package api

import (
	"fmt"
	"football-app-backend/internal/core/domain"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TeamRequestHandler struct{ db *gorm.DB }

func NewTeamRequestHandler(db *gorm.DB) *TeamRequestHandler { return &TeamRequestHandler{db: db} }

func requestUser(c *gin.Context) (uint, string, bool) {
	id, idOK := c.Get("user_id")
	role, roleOK := c.Get("user_type")
	userID, validID := id.(uint)
	userType, validRole := role.(string)
	return userID, userType, idOK && roleOK && validID && validRole
}

func (h *TeamRequestHandler) Create(c *gin.Context) {
	managerID, role, ok := requestUser(c)
	if !ok || role != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only managers can invite players"})
		return
	}
	teamID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}
	var body struct {
		PlayerID uint `json:"player_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Player ID is required"})
		return
	}
	var team domain.Team
	if err := h.db.Where("id = ? AND manager_id = ?", teamID, managerID).First(&team).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not manage this team"})
		return
	}
	var squadSize int64
	if err := h.db.Model(&domain.Player{}).Where("current_team_id = ?", team.ID).Count(&squadSize).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check squad capacity"})
		return
	}
	if squadSize >= 25 {
		c.JSON(http.StatusConflict, gin.H{"error": "Team squad is full (maximum 25 players)"})
		return
	}
	var player domain.Player
	if err := h.db.First(&player, body.PlayerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
		return
	}
	if !player.IsAvailable {
		c.JSON(http.StatusConflict, gin.H{"error": "Player is not accepting offers"})
		return
	}
	if player.CurrentTeamID != nil && *player.CurrentTeamID == team.ID {
		c.JSON(http.StatusConflict, gin.H{"error": "Player is already in your team"})
		return
	}
	var pending int64
	h.db.Model(&domain.TeamRequest{}).Where("player_id = ? AND to_team_id = ? AND status = ?", player.ID, team.ID, "pending").Count(&pending)
	if pending > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "A request is already pending"})
		return
	}
	requestType := "invitation"
	if player.CurrentTeamID != nil {
		requestType = "transfer"
	}
	request := domain.TeamRequest{PlayerID: player.ID, FromTeamID: player.CurrentTeamID, ToTeamID: team.ID, RequestedBy: managerID, RequestType: requestType, Status: "pending"}
	if err := h.db.Create(&request).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}
	h.db.Preload("Player").Preload("FromTeam").Preload("ToTeam").First(&request, request.ID)
	c.JSON(http.StatusCreated, request)
}

func (h *TeamRequestHandler) PlayerInvitations(c *gin.Context) {
	playerID, role, ok := requestUser(c)
	if !ok || role != "player" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Player access required"})
		return
	}
	var requests []domain.TeamRequest
	h.db.Preload("ToTeam").Where("player_id = ? AND request_type = ? AND status = ?", playerID, "invitation", "pending").Order("created_at desc").Find(&requests)
	c.JSON(http.StatusOK, requests)
}

func (h *TeamRequestHandler) ManagerRequests(c *gin.Context) {
	managerID, role, ok := requestUser(c)
	if !ok || role != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Manager access required"})
		return
	}
	var requests []domain.TeamRequest
	h.db.Joins("JOIN teams ON teams.id = team_requests.from_team_id").Preload("Player").Preload("FromTeam").Preload("ToTeam").Where("teams.manager_id = ? AND team_requests.request_type = ? AND team_requests.status = ?", managerID, "transfer", "pending").Order("team_requests.created_at desc").Find(&requests)
	c.JSON(http.StatusOK, requests)
}

func (h *TeamRequestHandler) Respond(c *gin.Context) {
	userID, role, ok := requestUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	requestID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}
	var body struct {
		Decision string `json:"decision" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || (body.Decision != "accepted" && body.Decision != "rejected") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Decision must be accepted or rejected"})
		return
	}
	var request domain.TeamRequest
	if err := h.db.First(&request, requestID).Error; err != nil || request.Status != "pending" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pending request not found"})
		return
	}
	allowed := role == "player" && request.RequestType == "invitation" && request.PlayerID == userID
	if role == "manager" && request.RequestType == "transfer" && request.FromTeamID != nil {
		var count int64
		h.db.Model(&domain.Team{}).Where("id = ? AND manager_id = ?", *request.FromTeamID, userID).Count(&count)
		allowed = count > 0
	}
	if !allowed {
		c.JSON(http.StatusForbidden, gin.H{"error": "You cannot respond to this request"})
		return
	}
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if body.Decision == "accepted" {
			var squadSize int64
			if err := tx.Model(&domain.Player{}).Where("current_team_id = ?", request.ToTeamID).Count(&squadSize).Error; err != nil {
				return err
			}
			if squadSize >= 25 {
				return fmt.Errorf("team squad is full")
			}
			if err := tx.Model(&domain.Player{}).Where("id = ?", request.PlayerID).Update("current_team_id", request.ToTeamID).Error; err != nil {
				return err
			}
		}
		return tx.Model(&request).Update("status", body.Decision).Error
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process request"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Request " + body.Decision})
}
