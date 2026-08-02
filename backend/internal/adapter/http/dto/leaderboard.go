package dto

type LeaderboardResponse struct {
	ManagerID      uint `json:"manager_id"`
	TeamID         uint `json:"team_id"`
	TotalPoints    int  `json:"total_points"`
	LeagueRank     int  `json:"league_rank"`
	GamesWon       int  `json:"games_won"`
	GamesDrawn     int  `json:"games_drawn"`
	GamesLost      int  `json:"games_lost"`
	GoalsFor       int  `json:"goals_for"`
	GoalsAgainst   int  `json:"goals_against"`
	GoalDifference int  `json:"goal_difference"`
}

type TeamRankResponse struct {
	Rank int `json:"rank"`
}
