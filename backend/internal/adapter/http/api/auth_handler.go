package api

import (
	"football-app-backend/internal/adapter/http/middleware"
	"football-app-backend/internal/core/domain"
	"football-app-backend/internal/core/service"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	managerService *service.ManagerService
	playerService  *service.PlayerService
	jwtSecret      []byte
	db             *gorm.DB
}

func NewAuthHandler(managerService *service.ManagerService, playerService *service.PlayerService, db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		managerService: managerService,
		playerService:  playerService,
		jwtSecret:      middleware.JWTSecret(),
		db:             db,
	}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userType := c.Param("userType")
	var user interface{}
	var err error

	switch userType {
	case "manager":
		user, err = h.managerService.Authenticate(req.Username, req.Password)
		if err == nil {
			manager := user.(*domain.Manager)
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"user_id":   manager.ID,
				"username":  req.Username,
				"user_type": userType,
				"exp":       time.Now().Add(time.Hour * 24).Unix(),
			})

			tokenString, err := token.SignedString(h.jwtSecret)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
				return
			}

			c.JSON(http.StatusOK, LoginResponse{
				Token: tokenString,
				User:  manager,
			})
			return
		}
	case "player":
		user, err = h.playerService.Authenticate(req.Username, req.Password)
		if err == nil {
			player := user.(*domain.Player)
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"user_id":   player.ID,
				"username":  req.Username,
				"user_type": userType,
				"exp":       time.Now().Add(time.Hour * 24).Unix(),
			})

			tokenString, err := token.SignedString(h.jwtSecret)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
				return
			}

			c.JSON(http.StatusOK, LoginResponse{
				Token: tokenString,
				User:  player,
			})
			return
		}
	case "viewer":
		var viewer domain.Viewer
		if dbErr := h.db.Where("username = ?", req.Username).First(&viewer).Error; dbErr == nil {
			if compareErr := bcrypt.CompareHashAndPassword([]byte(viewer.PasswordHash), []byte(req.Password)); compareErr == nil {
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"user_id": viewer.ID, "username": viewer.Username, "user_type": "viewer", "exp": time.Now().Add(24 * time.Hour).Unix()})
				tokenString, signErr := token.SignedString(h.jwtSecret)
				if signErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
					return
				}
				c.JSON(http.StatusOK, LoginResponse{Token: tokenString, User: viewer})
				return
			}
		}
	case "organizer":
		var organizer domain.Organizer
		if dbErr := h.db.Where("username = ?", req.Username).First(&organizer).Error; dbErr == nil && bcrypt.CompareHashAndPassword([]byte(organizer.PasswordHash), []byte(req.Password)) == nil {
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"user_id": organizer.ID, "username": organizer.Username, "user_type": "organizer", "exp": time.Now().Add(24 * time.Hour).Unix()})
			tokenString, signErr := token.SignedString(h.jwtSecret)
			if signErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
				return
			}
			c.JSON(http.StatusOK, LoginResponse{Token: tokenString, User: organizer})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user type"})
		return
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}
	userID := int(userIDVal.(uint))

	userTypeVal, exists := c.Get("user_type")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User type not found in context"})
		return
	}
	userType := userTypeVal.(string)

	var user interface{}
	var err error

	switch userType {
	case "manager":
		user, err = h.managerService.GetManagerByID(userID)
	case "player":
		user, err = h.playerService.GetPlayerByID(userID)
	case "viewer":
		var viewer domain.Viewer
		err = h.db.First(&viewer, userID).Error
		user = &viewer
	case "organizer":
		var organizer domain.Organizer
		err = h.db.First(&organizer, userID).Error
		user = &organizer
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user type in context"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *AuthHandler) RegisterViewer(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}
	var count int64
	h.db.Model(&domain.Viewer{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to secure password"})
		return
	}
	viewer := domain.Viewer{Username: req.Username, Email: req.Email, FullName: req.FullName, PasswordHash: string(hash)}
	if err := h.db.Create(&viewer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register viewer"})
		return
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"user_id": viewer.ID, "username": viewer.Username, "user_type": "viewer", "exp": time.Now().Add(24 * time.Hour).Unix()})
	tokenString, _ := token.SignedString(h.jwtSecret)
	c.JSON(http.StatusCreated, LoginResponse{Token: tokenString, User: viewer})
}

func (h *AuthHandler) RegisterOrganizer(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}
	var count int64
	h.db.Model(&domain.Organizer{}).Where("username = ? OR email = ?", req.Username, req.Email).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to secure password"})
		return
	}
	organizer := domain.Organizer{Username: req.Username, Email: req.Email, FullName: req.FullName, PasswordHash: string(hash)}
	if err := h.db.Create(&organizer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register organizer"})
		return
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"user_id": organizer.ID, "username": organizer.Username, "user_type": "organizer", "exp": time.Now().Add(24 * time.Hour).Unix()})
	tokenString, _ := token.SignedString(h.jwtSecret)
	c.JSON(http.StatusCreated, LoginResponse{Token: tokenString, User: organizer})
}

func (h *AuthHandler) RegisterManager(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
		TeamName string `json:"team_name"`
		TeamID   *uint  `json:"team_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" || (req.TeamID == nil && req.TeamName == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}
	if req.TeamID != nil {
		var team domain.Team
		if err := h.db.Where("id = ? AND manager_id IS NULL", *req.TeamID).First(&team).Error; err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Selected team is no longer available"})
			return
		}
		req.TeamName = team.Name
	} else {
		var count int64
		h.db.Model(&domain.Team{}).Where("name = ?", req.TeamName).Count(&count)
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Team name already exists; select it from the list if available"})
			return
		}
	}

	manager := domain.Manager{
		Username: req.Username,
		Email:    req.Email,
		FullName: req.FullName,
		TeamName: req.TeamName,
	}

	if err := h.managerService.RegisterManager(&manager, req.Password); err != nil {
		if err.Error() == "username already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
			return
		}
		if err.Error() == "email already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register manager"})
		return
	}
	if req.TeamID != nil {
		result := h.db.Model(&domain.Team{}).Where("id = ? AND manager_id IS NULL", *req.TeamID).Update("manager_id", manager.ID)
		if result.Error != nil || result.RowsAffected != 1 {
			h.db.Delete(&manager)
			c.JSON(http.StatusConflict, gin.H{"error": "Selected team is no longer available"})
			return
		}
	} else {
		team := domain.Team{Name: req.TeamName, ManagerID: &manager.ID, Formation: "4-4-2"}
		if err := h.db.Create(&team).Error; err != nil {
			h.db.Delete(&manager)
			c.JSON(http.StatusConflict, gin.H{"error": "Could not create team"})
			return
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":   manager.ID,
		"username":  manager.Username,
		"user_type": "manager",
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	c.JSON(http.StatusCreated, LoginResponse{
		Token: tokenString,
		User:  manager,
	})
}

func (h *AuthHandler) RegisterPlayer(c *gin.Context) {
	var req struct {
		Username        string `json:"username"`
		Email           string `json:"email"`
		Password        string `json:"password"`
		FullName        string `json:"full_name"`
		Position        string `json:"position"`
		Age             int    `json:"age"`
		Nationality     string `json:"nationality"`
		CurrentTeamID   *uint  `json:"current_team_id"`
		ExperienceYears int    `json:"experience_years"`
		HeightCm        int    `json:"height_cm"`
		WeightKg        int    `json:"weight_kg"`
		PreferredFoot   string `json:"preferred_foot"`
		Bio             string `json:"bio"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" || req.Position == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Required fields are missing"})
		return
	}

	player := domain.Player{
		Username:        req.Username,
		Email:           req.Email,
		FullName:        req.FullName,
		Position:        req.Position,
		Age:             req.Age,
		Nationality:     req.Nationality,
		CurrentTeamID:   req.CurrentTeamID,
		ExperienceYears: req.ExperienceYears,
		HeightCm:        req.HeightCm,
		WeightKg:        req.WeightKg,
		PreferredFoot:   req.PreferredFoot,
		Bio:             req.Bio,
	}

	if err := h.playerService.RegisterPlayer(&player, req.Password); err != nil {
		if err.Error() == "username already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
			return
		}
		if err.Error() == "email already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register player"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":   player.ID,
		"username":  player.Username,
		"user_type": "player",
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	c.JSON(http.StatusCreated, LoginResponse{
		Token: tokenString,
		User:  player,
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userIDValue, idExists := c.Get("user_id")
	userTypeValue, typeExists := c.Get("user_type")
	if !idExists || !typeExists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := int(userIDValue.(uint))
	userType := userTypeValue.(string)

	var body struct {
		Username        *string `json:"username"`
		Email           *string `json:"email"`
		FullName        *string `json:"full_name"`
		TeamName        *string `json:"team_name"`
		Position        *string `json:"position"`
		Age             *int    `json:"age"`
		Nationality     *string `json:"nationality"`
		Bio             *string `json:"bio"`
		ProfileImageURL *string `json:"profile_image_url"`
		IsAvailable     *bool   `json:"is_available"`
		PreferredFoot   *string `json:"preferred_foot"`
		HeightCm        *int    `json:"height_cm"`
		WeightKg        *int    `json:"weight_kg"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if userType == "manager" {
		manager, err := h.managerService.GetManagerByID(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Manager not found"})
			return
		}
		if body.Username != nil {
			manager.Username = *body.Username
		}
		if body.Email != nil {
			manager.Email = *body.Email
		}
		if body.FullName != nil {
			manager.FullName = *body.FullName
		}
		if body.TeamName != nil {
			manager.TeamName = *body.TeamName
		}
		if err := h.managerService.UpdateManager(manager); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
		c.JSON(http.StatusOK, manager)
		return
	}
	if userType == "viewer" {
		var viewer domain.Viewer
		if err := h.db.First(&viewer, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Viewer not found"})
			return
		}
		if body.Username != nil {
			viewer.Username = *body.Username
		}
		if body.Email != nil {
			viewer.Email = *body.Email
		}
		if body.FullName != nil {
			viewer.FullName = *body.FullName
		}
		if err := h.db.Save(&viewer).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
		c.JSON(http.StatusOK, viewer)
		return
	}

	player, err := h.playerService.GetPlayerByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
		return
	}
	if body.Username != nil {
		player.Username = *body.Username
	}
	if body.Email != nil {
		player.Email = *body.Email
	}
	if body.FullName != nil {
		player.FullName = *body.FullName
	}
	if body.Position != nil {
		player.Position = *body.Position
	}
	if body.Age != nil {
		player.Age = *body.Age
	}
	if body.Nationality != nil {
		player.Nationality = *body.Nationality
	}
	if body.Bio != nil {
		player.Bio = *body.Bio
	}
	if body.ProfileImageURL != nil {
		player.ProfileImageURL = *body.ProfileImageURL
	}
	if body.IsAvailable != nil {
		player.IsAvailable = *body.IsAvailable
	}
	if body.PreferredFoot != nil {
		player.PreferredFoot = *body.PreferredFoot
	}
	if body.HeightCm != nil {
		player.HeightCm = *body.HeightCm
	}
	if body.WeightKg != nil {
		player.WeightKg = *body.WeightKg
	}
	if err := h.playerService.UpdatePlayer(player); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, player)
}
