package api

import (
	"fmt"
	"football-app-backend/internal/core/domain"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	response := gin.H{
		"team_members":     "0/11",
		"remaining_budget": 0,
		"league_rank":      0,
		"total_points":     0,
	}

	userType, _ := c.Get("user_type")
	if userType != "manager" {
		c.JSON(http.StatusOK, response)
		return
	}

	var team domain.Team
	if err := h.db.Where("manager_id = ?", userID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, response)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard"})
		return
	}

	var playerCount int64
	if err := h.db.Model(&domain.Player{}).Where("current_team_id = ?", team.ID).Count(&playerCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count team members"})
		return
	}

	response["team_members"] = formatTeamMembers(playerCount)
	response["remaining_budget"] = team.Budget
	if seasonID := c.Query("season_id"); seasonID != "" {
		var registration domain.CompetitionTeam
		if err := h.db.Where("season_id = ? AND team_id = ?", seasonID, team.ID).First(&registration).Error; err == nil {
			response["remaining_budget"] = registration.RemainingTransferBudget
			response["remaining_transfer_budget"] = registration.RemainingTransferBudget
			response["remaining_salary_budget"] = registration.RemainingSalaryBudget
			response["transfer_budget"] = registration.TransferBudget
			response["salary_budget"] = registration.SalaryBudget
		}
	}

	var leaderboard domain.LeaderboardEntry
	if err := h.db.Where("manager_id = ?", userID).First(&leaderboard).Error; err == nil {
		response["league_rank"] = leaderboard.LeagueRank
		response["total_points"] = leaderboard.TotalPoints
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load leaderboard stats"})
		return
	}

	c.JSON(http.StatusOK, response)
}

func formatTeamMembers(count int64) string {
	return fmt.Sprintf("%d/25", count)
}

func (h *DashboardHandler) GetNextMatch(c *gin.Context) {
	userID, userType, ok := requestUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if userType == "viewer" {
		var match domain.Match
		err := h.db.Preload("Team1").Preload("Team2").Where("status IN ?", []string{"live", "in_progress"}).Order("match_date desc, match_time desc").First(&match).Error
		if err == gorm.ErrRecordNotFound {
			err = h.db.Preload("Team1").Preload("Team2").Where("status = ? AND match_date >= ?", "scheduled", time.Now().Format("2006-01-02")).Order("match_date asc, match_time asc").First(&match).Error
		}
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "No live or upcoming match found"})
			return
		}
		c.JSON(http.StatusOK, match)
		return
	}

	var teamID uint
	if userType == "manager" {
		var team domain.Team
		if err := h.db.Where("manager_id = ?", userID).First(&team).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
			return
		}
		teamID = team.ID
	} else {
		var player domain.Player
		if err := h.db.First(&player, userID).Error; err != nil || player.CurrentTeamID == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
			return
		}
		teamID = *player.CurrentTeamID
	}

	var match domain.Match
	// An active fixture is always more useful on the dashboard than a future
	// fixture. Accept both common status values so imported match data works too.
	err := h.db.Preload("Team1").Preload("Team2").
		Where("status IN ? AND (team1_id = ? OR team2_id = ?)", []string{"live", "in_progress"}, teamID, teamID).
		Order("match_date desc, match_time desc").First(&match).Error
	if err == nil {
		c.JSON(http.StatusOK, match)
		return
	}

	query := h.db.Preload("Team1").Preload("Team2").Where("status = ? AND (team1_id = ? OR team2_id = ?)", "scheduled", teamID, teamID)
	err = query.Where("match_date >= ?", time.Now().Format("2006-01-02")).Order("match_date asc, match_time asc").First(&match).Error
	if err == gorm.ErrRecordNotFound {
		err = h.db.Preload("Team1").Preload("Team2").Where("status = ? AND (team1_id = ? OR team2_id = ?)", "scheduled", teamID, teamID).Order("match_date desc, match_time desc").First(&match).Error
	}
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No scheduled match found"})
		return
	}
	c.JSON(http.StatusOK, match)
}
