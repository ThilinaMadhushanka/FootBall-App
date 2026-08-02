package api

import (
	"football-app-backend/internal/core/domain"
	"football-app-backend/internal/core/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserSettingsHandler struct {
	userSettingsService *service.UserSettingsService
}

func NewUserSettingsHandler(service *service.UserSettingsService) *UserSettingsHandler {
	return &UserSettingsHandler{userSettingsService: service}
}

func (h *UserSettingsHandler) GetUserSettings(c *gin.Context) {
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

	settings, err := h.userSettingsService.GetUserSettings(userID, userType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func (h *UserSettingsHandler) UpdateUserSettings(c *gin.Context) {
	var settings domain.UserSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}
	settings.UserID = userIDVal.(uint)

	userTypeVal, exists := c.Get("user_type")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User type not found in context"})
		return
	}
	settings.UserType = userTypeVal.(string)

	if err := h.userSettingsService.UpdateUserSettings(&settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}
