package domain

import "time"

type Organization struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"unique;not null" json:"name"`
	Code      string    `gorm:"unique;not null" json:"code"`
	Region    string    `json:"region"`
	CreatedAt time.Time `json:"created_at"`
}

type Competition struct {
	ID                    uint          `gorm:"primaryKey" json:"id"`
	OrganizerID           *uint         `json:"organizer_id,omitempty"`
	Organizer             *Organizer    `gorm:"foreignKey:OrganizerID" json:"organizer,omitempty"`
	OrganizationID        uint          `json:"organization_id"`
	Organization          *Organization `gorm:"foreignKey:OrganizationID" json:"organization,omitempty"`
	Name                  string        `gorm:"unique;not null" json:"name"`
	Code                  string        `gorm:"unique;not null" json:"code"`
	Type                  string        `json:"type"`
	Region                string        `json:"region"`
	LogoURL               string        `json:"logo_url"`
	DefaultTransferBudget float64       `json:"default_transfer_budget"`
	DefaultSalaryBudget   float64       `json:"default_salary_budget"`
	Seasons               []Season      `gorm:"foreignKey:CompetitionID" json:"seasons,omitempty"`
	CreatedAt             time.Time     `json:"created_at"`
}

type Season struct {
	ID               uint         `gorm:"primaryKey" json:"id"`
	CompetitionID    uint         `json:"competition_id"`
	Competition      *Competition `gorm:"foreignKey:CompetitionID" json:"competition,omitempty"`
	Name             string       `json:"name"`
	StartDate        time.Time    `json:"start_date"`
	EndDate          time.Time    `json:"end_date"`
	IsActive         bool         `json:"is_active"`
	IsFinalized      bool         `json:"is_finalized"`
	PreviousSeasonID *uint        `json:"previous_season_id,omitempty"`
	CreatedAt        time.Time    `json:"created_at"`
}

type CompetitionTeam struct {
	SeasonID                uint    `gorm:"primaryKey" json:"season_id"`
	TeamID                  uint    `gorm:"primaryKey" json:"team_id"`
	Season                  *Season `gorm:"foreignKey:SeasonID" json:"season,omitempty"`
	Team                    *Team   `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	GroupName               string  `json:"group_name"`
	TransferBudget          float64 `json:"transfer_budget"`
	RemainingTransferBudget float64 `json:"remaining_transfer_budget"`
	SalaryBudget            float64 `json:"salary_budget"`
	RemainingSalaryBudget   float64 `json:"remaining_salary_budget"`
}

type CompetitionPlayerStats struct {
	SeasonID      uint      `gorm:"primaryKey" json:"season_id"`
	PlayerID      uint      `gorm:"primaryKey" json:"player_id"`
	Season        *Season   `gorm:"foreignKey:SeasonID" json:"season,omitempty"`
	Player        *Player   `gorm:"foreignKey:PlayerID" json:"player,omitempty"`
	GamesPlayed   int       `json:"games_played"`
	Goals         int       `json:"goals"`
	Assists       int       `json:"assists"`
	YellowCards   int       `json:"yellow_cards"`
	RedCards      int       `json:"red_cards"`
	CleanSheets   int       `json:"clean_sheets"`
	MinutesPlayed int       `json:"minutes_played"`
	LastUpdated   time.Time `json:"last_updated"`
}
