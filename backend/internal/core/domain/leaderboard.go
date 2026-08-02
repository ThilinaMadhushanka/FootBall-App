package domain

type LeaderboardEntry struct {
	ManagerID      uint     `gorm:"primaryKey" json:"manager_id"`
	Manager        *Manager `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	TeamID         uint     `json:"team_id"`
	Team           *Team    `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	TotalPoints    int      `json:"total_points"`
	LeagueRank     int      `json:"league_rank"`
	GamesWon       int      `json:"games_won"`
	GamesDrawn     int      `json:"games_drawn"`
	GamesLost      int      `json:"games_lost"`
	GoalsFor       int      `json:"goals_for"`
	GoalsAgainst   int      `json:"goals_against"`
	GoalDifference int      `json:"goal_difference"`
}

func (LeaderboardEntry) TableName() string { return "leaderboard" }
