package domain

import "time"

type Match struct {
	ID            uint         `gorm:"primaryKey" json:"id"`
	CompetitionID *uint        `json:"competition_id,omitempty"`
	Competition   *Competition `gorm:"foreignKey:CompetitionID" json:"competition,omitempty"`
	SeasonID      *uint        `json:"season_id,omitempty"`
	Season        *Season      `gorm:"foreignKey:SeasonID" json:"season,omitempty"`
	RoundName     string       `json:"round_name"`
	Team1ID       uint         `json:"team1_id"`
	Team1         *Team        `gorm:"foreignKey:Team1ID" json:"team1,omitempty"`
	Team2ID       uint         `json:"team2_id"`
	Team2         *Team        `gorm:"foreignKey:Team2ID" json:"team2,omitempty"`
	MatchDate     time.Time    `json:"match_date"`
	MatchTime     string       `json:"match_time"`
	Venue         string       `json:"venue"`
	Status        string       `json:"status"`
	ScoreTeam1    int          `json:"score_team1"`
	ScoreTeam2    int          `json:"score_team2"`
	CreatedAt     time.Time    `json:"created_at"`
}

type MatchEvent struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	MatchID     uint      `json:"match_id"`
	Match       *Match    `gorm:"foreignKey:MatchID" json:"match,omitempty"`
	EventType   string    `json:"event_type"`
	PlayerID    *uint     `json:"player_id"`
	Player      *Player   `gorm:"foreignKey:PlayerID" json:"player,omitempty"`
	TeamID      *uint     `json:"team_id"`
	Team        *Team     `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	Minute      int       `json:"minute"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}
