package dto

type CreateTeamRequest struct {
	Name        string  `json:"name" binding:"required"`
	ManagerID   *uint   `json:"manager_id" binding:"required"`
	FoundedYear int     `json:"founded_year"`
	Stadium     string  `json:"stadium" binding:"required"`
	Location    string  `json:"location"`
	LogoURL     string  `json:"logo_url"`
	Budget      float64 `json:"budget"`
}

type UpdateTeamBudgetRequest struct {
	Budget float64 `json:"budget" binding:"gte=0"`
}

type UpdateTeamStadiumRequest struct {
	Stadium string `json:"stadium" binding:"required"`
}
