package api

import (
	"football-app-backend/internal/core/domain"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
)

type NotificationHandler struct{ db *gorm.DB }

func NewNotificationHandler(db *gorm.DB) *NotificationHandler { return &NotificationHandler{db: db} }
func (h *NotificationHandler) List(c *gin.Context) {
	id, kind, ok := requestUser(c)
	if !ok {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	var items []domain.Notification
	h.db.Where("user_id = ? AND user_type = ?", id, kind).Order("created_at desc").Limit(50).Find(&items)
	c.JSON(http.StatusOK, items)
}
func (h *NotificationHandler) Read(c *gin.Context) {
	id, kind, ok := requestUser(c)
	if !ok {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	h.db.Model(&domain.Notification{}).Where("id = ? AND user_id = ? AND user_type = ?", c.Param("id"), id, kind).Update("is_read", true)
	c.Status(http.StatusNoContent)
}
func (h *NotificationHandler) ReadAll(c *gin.Context) {
	id, kind, ok := requestUser(c)
	if !ok {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	h.db.Model(&domain.Notification{}).Where("user_id = ? AND user_type = ?", id, kind).Update("is_read", true)
	c.Status(http.StatusNoContent)
}
