package dto

import "time"

type CreateMatchRequest struct {
	Team1ID   uint      `json:"team1_id" binding:"required"`
	Team2ID   uint      `json:"team2_id" binding:"required"`
	MatchDate time.Time `json:"match_date" binding:"required"`
	MatchTime string    `json:"match_time" binding:"required"`
	Venue     string    `json:"venue" binding:"required"`
	Status    string    `json:"status"`
}

type UpdateMatchStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=scheduled live completed cancelled"`
}

type UpdateMatchScoreRequest struct {
	ScoreTeam1 int `json:"score_team1" binding:"gte=0"`
	ScoreTeam2 int `json:"score_team2" binding:"gte=0"`
}

type CreateMatchEventRequest struct {
	MatchID     uint   `json:"match_id" binding:"required"`
	EventType   string `json:"event_type" binding:"required"`
	PlayerID    *uint  `json:"player_id"`
	TeamID      *uint  `json:"team_id"`
	Minute      int    `json:"minute" binding:"gte=0"`
	Description string `json:"description"`
}
