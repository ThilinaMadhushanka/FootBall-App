package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

func signedToken(t *testing.T, method jwt.SigningMethod) string {
	t.Helper()
	token := jwt.NewWithClaims(method, Claims{UserID: 7, UserType: "manager", Username: "alex", StandardClaims: jwt.StandardClaims{ExpiresAt: time.Now().Add(time.Hour).Unix()}})
	value, err := token.SignedString(JWTSecret())
	if err != nil {
		t.Fatal(err)
	}
	return value
}

func TestAuthMiddlewareAcceptsHS256(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("JWT_SECRET", "test-secret-at-least-32-characters")
	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/private", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	req := httptest.NewRequest(http.MethodGet, "/private", nil)
	req.Header.Set("Authorization", "Bearer "+signedToken(t, jwt.SigningMethodHS256))
	res := httptest.NewRecorder()
	r.ServeHTTP(res, req)
	if res.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", res.Code)
	}
}

func TestAuthMiddlewareRejectsUnexpectedAlgorithm(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("JWT_SECRET", "test-secret-at-least-32-characters")
	r := gin.New()
	r.Use(AuthMiddleware())
	r.GET("/private", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	req := httptest.NewRequest(http.MethodGet, "/private", nil)
	req.Header.Set("Authorization", "Bearer "+signedToken(t, jwt.SigningMethodHS384))
	res := httptest.NewRecorder()
	r.ServeHTTP(res, req)
	if res.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", res.Code)
	}
}

func TestProductionRequiresJWTSecret(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	os.Unsetenv("JWT_SECRET")
	if ValidateJWTConfiguration() == nil {
		t.Fatal("expected missing production JWT secret to fail")
	}
}

func TestRequireRolesDoesNotPanicWithoutClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(RequireRoles("manager"))
	r.GET("/manager", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	res := httptest.NewRecorder()
	r.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/manager", nil))
	if res.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", res.Code)
	}
}
