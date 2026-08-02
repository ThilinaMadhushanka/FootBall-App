package domain

import "time"

type ContractOffer struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ParentOfferID   *uint          `json:"parent_offer_id,omitempty"`
	ParentOffer     *ContractOffer `gorm:"foreignKey:ParentOfferID" json:"parent_offer,omitempty"`
	PlayerID        uint           `json:"player_id"`
	Player          *Player        `gorm:"foreignKey:PlayerID" json:"player,omitempty"`
	FromTeamID      uint           `json:"from_team_id"`
	FromTeam        *Team          `gorm:"foreignKey:FromTeamID" json:"from_team,omitempty"`
	CurrentTeamID   *uint          `json:"current_team_id,omitempty"`
	CurrentTeam     *Team          `gorm:"foreignKey:CurrentTeamID" json:"current_team,omitempty"`
	SeasonID        uint           `json:"season_id"`
	Season          *Season        `gorm:"foreignKey:SeasonID" json:"season,omitempty"`
	TransferFee     float64        `json:"transfer_fee"`
	SalaryPerSeason float64        `json:"salary_per_season"`
	SigningBonus    float64        `json:"signing_bonus"`
	ContractMonths  int            `json:"contract_months"`
	Status          string         `gorm:"not null" json:"status"`
	CreatedByRole   string         `json:"created_by_role"`
	Message         string         `json:"message"`
	ExpiresAt       time.Time      `json:"expires_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

type PlayerContract struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	PlayerID        uint      `json:"player_id"`
	Player          *Player   `gorm:"foreignKey:PlayerID" json:"player,omitempty"`
	TeamID          uint      `json:"team_id"`
	Team            *Team     `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	SeasonID        uint      `json:"season_id"`
	Season          *Season   `gorm:"foreignKey:SeasonID" json:"season,omitempty"`
	AcceptedOfferID uint      `json:"accepted_offer_id"`
	SalaryPerSeason float64   `json:"salary_per_season"`
	SigningBonus    float64   `json:"signing_bonus"`
	TransferFee     float64   `json:"transfer_fee"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	Status          string    `gorm:"not null" json:"status"`
	CreatedAt       time.Time `json:"created_at"`
}
