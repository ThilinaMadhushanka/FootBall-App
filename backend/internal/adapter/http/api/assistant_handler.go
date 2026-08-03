package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"football-app-backend/internal/core/domain"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AssistantHandler struct {
	db           *gorm.DB
	client       *http.Client
	serviceURL   string
	serviceToken string
}

type assistantChatRequest struct {
	Message  string `json:"message" binding:"required"`
	SeasonID *uint  `json:"season_id"`
}

type assistantContext struct {
	SeasonID        *uint    `json:"season_id,omitempty"`
	CompetitionName string   `json:"competition_name,omitempty"`
	TeamName        string   `json:"team_name,omitempty"`
	NextMatch       string   `json:"next_match,omitempty"`
	RemainingBudget *float64 `json:"remaining_budget,omitempty"`
}

type assistantServiceRequest struct {
	Message  string           `json:"message"`
	UserID   uint             `json:"user_id"`
	UserRole string           `json:"user_role"`
	Username string           `json:"username"`
	Context  assistantContext `json:"context"`
}

func NewAssistantHandler(db *gorm.DB) *AssistantHandler {
	serviceURL := strings.TrimRight(os.Getenv("AI_SERVICE_URL"), "/")
	if serviceURL == "" {
		serviceURL = "http://localhost:8000"
	}
	return &AssistantHandler{
		db:           db,
		client:       &http.Client{Timeout: 135 * time.Second},
		serviceURL:   serviceURL,
		serviceToken: os.Getenv("AI_SERVICE_TOKEN"),
	}
}

func (h *AssistantHandler) Chat(c *gin.Context) {
	userID, userType, ok := requestUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var input assistantChatRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A message is required"})
		return
	}
	input.Message = strings.TrimSpace(input.Message)
	if input.Message == "" || utf8.RuneCountInString(input.Message) > 2000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message must contain 1 to 2000 characters"})
		return
	}
	if h.serviceToken == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service is not configured"})
		return
	}

	username, _ := c.Get("username")
	payload := assistantServiceRequest{Message: input.Message, UserID: userID, UserRole: userType, Username: fmt.Sprint(username)}
	payload.Context = h.contextFor(userID, userType, input.SeasonID)
	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not prepare AI request"})
		return
	}
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, h.serviceURL+"/chat", bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not prepare AI request"})
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-AI-Service-Token", h.serviceToken)
	response, err := h.client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI service is unavailable"})
		return
	}
	defer response.Body.Close()
	var result map[string]interface{}
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI service returned an invalid response"})
		return
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := result["detail"].(string)
		if message == "" {
			message = "AI could not answer this request"
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": message})
		return
	}
	answer, _ := result["answer"].(string)
	if strings.TrimSpace(answer) == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "AI returned an empty answer"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"answer": answer})
}

func (h *AssistantHandler) contextFor(userID uint, userType string, seasonID *uint) assistantContext {
	context := assistantContext{SeasonID: seasonID}
	if seasonID != nil {
		var season domain.Season
		if h.db.Preload("Competition").First(&season, *seasonID).Error == nil && season.Competition != nil {
			context.CompetitionName = season.Competition.Name
		}
	}
	var team domain.Team
	switch userType {
	case "manager":
		h.db.Where("manager_id = ?", userID).First(&team)
	case "player":
		var player domain.Player
		if h.db.First(&player, userID).Error == nil && player.CurrentTeamID != nil {
			h.db.First(&team, *player.CurrentTeamID)
		}
	}
	if team.ID == 0 {
		return context
	}
	context.TeamName = team.Name
	if seasonID != nil {
		var registration domain.CompetitionTeam
		if h.db.Where("season_id = ? AND team_id = ?", *seasonID, team.ID).First(&registration).Error == nil {
			budget := registration.RemainingTransferBudget
			context.RemainingBudget = &budget
		}
	}
	var match domain.Match
	query := h.db.Preload("Team1").Preload("Team2").Where("team1_id = ? OR team2_id = ?", team.ID, team.ID)
	if seasonID != nil {
		query = query.Where("season_id = ?", *seasonID)
	}
	if query.Where("status IN ?", []string{"live", "in_progress", "scheduled"}).Order("CASE WHEN status IN ('live','in_progress') THEN 0 ELSE 1 END, match_date asc, match_time asc").First(&match).Error == nil {
		team1, team2 := strconv.FormatUint(uint64(match.Team1ID), 10), strconv.FormatUint(uint64(match.Team2ID), 10)
		if match.Team1 != nil {
			team1 = match.Team1.Name
		}
		if match.Team2 != nil {
			team2 = match.Team2.Name
		}
		context.NextMatch = fmt.Sprintf("%s vs %s on %s at %s (%s)", team1, team2, match.MatchDate.Format("2006-01-02"), match.MatchTime, match.Status)
	}
	return context
}
