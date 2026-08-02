package dto

type RegisterPlayerRequest struct {
	Username        string `json:"username" binding:"required"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=6"`
	FullName        string `json:"full_name" binding:"required"`
	Position        string `json:"position" binding:"required"`
	Age             int    `json:"age"`
	Nationality     string `json:"nationality"`
	CurrentTeamID   *uint  `json:"current_team_id"`
	ExperienceYears int    `json:"experience_years"`
	HeightCm        int    `json:"height_cm"`
	WeightKg        int    `json:"weight_kg"`
	PreferredFoot   string `json:"preferred_foot"`
	Bio             string `json:"bio"`
}

type UpdatePlayerStatsRequest struct {
	GamesPlayed int `json:"games_played"`
	Goals       int `json:"goals"`
	Assists     int `json:"assists"`
	YellowCards int `json:"yellow_cards"`
	RedCards    int `json:"red_cards"`
	CleanSheets int `json:"clean_sheets"`
}

type TransferPlayerRequest struct {
	NewTeamID int `json:"new_team_id" binding:"required"`
}
