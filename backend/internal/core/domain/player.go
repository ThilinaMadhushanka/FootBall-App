package domain

import "time"

type Player struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Username        string    `gorm:"unique;not null" json:"username"`
	Email           string    `gorm:"unique;not null" json:"email"`
	PasswordHash    string    `gorm:"not null" json:"-"`
	FullName        string    `json:"full_name"`
	Position        string    `json:"position"`
	Age             int       `json:"age"`
	Nationality     string    `json:"nationality"`
	CurrentTeamID   *uint     `json:"current_team_id"`
	CurrentTeam     *Team     `gorm:"foreignKey:CurrentTeamID" json:"current_team,omitempty"`
	Rating          float64   `json:"rating"`
	Price           float64   `json:"price"`
	Salary          float64   `json:"salary"`
	ExperienceYears int       `json:"experience_years"`
	HeightCm        int       `json:"height_cm"`
	WeightKg        int       `json:"weight_kg"`
	PreferredFoot   string    `json:"preferred_foot"`
	Bio             string    `json:"bio"`
	ProfileImageURL string    `json:"profile_image_url"`
	IsAvailable     bool      `json:"is_available"`
	GamesPlayed     int       `json:"games_played"`
	Goals           int       `json:"goals"`
	Assists         int       `json:"assists"`
	YellowCards     int       `json:"yellow_cards"`
	RedCards        int       `json:"red_cards"`
	CleanSheets     int       `json:"clean_sheets"`
	JerseyNumber    int       `json:"jersey_number"`
	CreatedAt       time.Time `json:"created_at"`
	LastLogin       time.Time `json:"last_login"`
}

type PlayerStats struct {
	PlayerID      uint      `gorm:"primaryKey" json:"player_id"`
	GamesPlayed   int       `json:"games_played"`
	Goals         int       `json:"goals"`
	Assists       int       `json:"assists"`
	YellowCards   int       `json:"yellow_cards"`
	RedCards      int       `json:"red_cards"`
	CleanSheets   int       `json:"clean_sheets"`
	MinutesPlayed int       `json:"minutes_played"`
	PassAccuracy  float64   `json:"pass_accuracy"`
	ShotsOnTarget int       `json:"shots_on_target"`
	LastUpdated   time.Time `json:"last_updated"`
}
