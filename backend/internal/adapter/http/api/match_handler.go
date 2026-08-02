package api

import (
	"football-app-backend/internal/core/domain"
	"football-app-backend/internal/core/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MatchHandler struct {
	matchService *service.MatchService
}

func NewMatchHandler(service *service.MatchService) *MatchHandler {
	return &MatchHandler{matchService: service}
}

func (h *MatchHandler) UpdateMatchScore(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	var scoreUpdate struct {
		ScoreTeam1 int `json:"score_team1"`
		ScoreTeam2 int `json:"score_team2"`
	}

	if err := c.ShouldBindJSON(&scoreUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.matchService.UpdateMatchScore(matchID, scoreUpdate.ScoreTeam1, scoreUpdate.ScoreTeam2)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update match score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Match score updated successfully"})
}

func (h *MatchHandler) CreateMatch(c *gin.Context) {
	var match domain.Match
	if err := c.ShouldBindJSON(&match); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.matchService.CreateMatch(&match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, match)
}

func (h *MatchHandler) GetAllMatches(c *gin.Context) {
	seasonID, parseErr := strconv.Atoi(c.Query("season_id"))
	var matches []*domain.Match
	var err error
	if c.Query("season_id") != "" && parseErr == nil {
		matches, err = h.matchService.GetAllMatchesBySeason(seasonID)
	} else {
		matches, err = h.matchService.GetAllMatches()
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, matches)
}

func (h *MatchHandler) GetUpcomingMatches(c *gin.Context) {
	seasonID, parseErr := strconv.Atoi(c.Query("season_id"))
	var matches []*domain.Match
	var err error
	if c.Query("season_id") != "" && parseErr == nil {
		matches, err = h.matchService.GetUpcomingMatchesBySeason(seasonID)
	} else {
		matches, err = h.matchService.GetUpcomingMatches()
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, matches)
}

func (h *MatchHandler) GetMatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	match, err := h.matchService.GetMatchByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

func (h *MatchHandler) UpdateMatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	var match domain.Match
	if err := c.ShouldBindJSON(&match); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	match.ID = uint(id)
	if err := h.matchService.UpdateMatch(&match); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

func (h *MatchHandler) DeleteMatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	if err := h.matchService.DeleteMatch(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *MatchHandler) UpdateMatchStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	var statusUpdate struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&statusUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.matchService.UpdateMatchStatus(id, statusUpdate.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Match status updated successfully"})
}

func (h *MatchHandler) GetTeamMatches(c *gin.Context) {
	teamName := c.Param("team_name")

	matches, err := h.matchService.GetTeamMatches(teamName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, matches)
}

func (h *MatchHandler) GetMatchEvents(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	events, err := h.matchService.GetMatchEvents(matchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *MatchHandler) AddMatchEvent(c *gin.Context) {
	matchID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	var event domain.MatchEvent
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	event.MatchID = uint(matchID)

	if err := h.matchService.AddMatchEvent(&event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}
