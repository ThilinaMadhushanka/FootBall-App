package middleware

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"football-app-backend/internal/core/domain"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Claims struct {
	UserID   uint   `json:"user_id"`
	UserType string `json:"user_type"`
	Username string `json:"username"`
	jwt.StandardClaims
}

func AuditMutations(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			return
		}
		id, _ := c.Get("user_id")
		kind, _ := c.Get("user_type")
		userID, _ := id.(uint)
		userType, _ := kind.(string)
		db.Create(&domain.AuditLog{UserID: userID, UserType: userType, Method: c.Request.Method, Path: c.FullPath(), StatusCode: c.Writer.Status(), IPAddress: c.ClientIP()})
	}
}

const developmentJWTSecret = "development-only-change-me"

func JWTSecret() []byte {
	if secret := strings.TrimSpace(os.Getenv("JWT_SECRET")); secret != "" {
		return []byte(secret)
	}
	return []byte(developmentJWTSecret)
}

func ValidateJWTConfiguration() error {
	if strings.EqualFold(os.Getenv("APP_ENV"), "production") && strings.TrimSpace(os.Getenv("JWT_SECRET")) == "" {
		return fmt.Errorf("JWT_SECRET is required when APP_ENV=production")
	}
	return nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		tokenString := bearerToken[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok || token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
			}
			return JWTSecret(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Add claims to Gin context
		c.Set("user_id", claims.UserID)
		c.Set("user_type", claims.UserType)
		c.Set("username", claims.Username)

		// Log for debugging
		log.Printf("AuthMiddleware: User ID: %d, User Type: %s", claims.UserID, claims.UserType)

		c.Next()
	}
}

func RequireRoles(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, role := range roles {
		allowed[role] = true
	}
	return func(c *gin.Context) {
		roleValue, exists := c.Get("user_type")
		role, ok := roleValue.(string)
		if !exists || !ok || !allowed[role] {
			c.JSON(http.StatusForbidden, gin.H{"error": "This account has read-only access"})
			c.Abort()
			return
		}
		c.Next()
	}
}
