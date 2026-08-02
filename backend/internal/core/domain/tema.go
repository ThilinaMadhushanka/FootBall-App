package domain

import "time"

type Team struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"unique;not null" json:"name"`
	ManagerID   *uint     `json:"manager_id"`
	Manager     *Manager  `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	FoundedYear int       `json:"founded_year"`
	Stadium     string    `json:"stadium"`
	Location    string    `json:"location"`
	LogoURL     string    `json:"logo_url"`
	Budget      float64   `json:"budget"`
	Formation   string    `gorm:"not null;default:4-4-2" json:"formation"`
	CreatedAt   time.Time `json:"created_at"`
}
