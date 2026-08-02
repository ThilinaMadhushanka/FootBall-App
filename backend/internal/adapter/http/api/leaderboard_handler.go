package api

import (
	"football-app-backend/internal/core/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type LeaderboardHandler struct {
	leaderboardService *service.LeaderboardService
}

func NewLeaderboardHandler(service *service.LeaderboardService) *LeaderboardHandler {
	return &LeaderboardHandler{leaderboardService: service}
}

func (h *LeaderboardHandler) GetLeaderboard(c *gin.Context) {
	leaderboard, err := h.leaderboardService.GetLeaderboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, leaderboard)
}

func (h *LeaderboardHandler) GetTeamRank(c *gin.Context) {
	managerID, err := strconv.Atoi(c.Param("manager_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manager ID"})
		return
	}

	rank, err := h.leaderboardService.GetTeamRank(managerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rank": rank})
}

func (h *LeaderboardHandler) GetTeamStats(c *gin.Context) {
	managerID, err := strconv.Atoi(c.Param("manager_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid manager ID"})
		return
	}

	stats, err := h.leaderboardService.GetTeamStats(managerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
