package domain

import "time"

type Manager struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"unique;not null" json:"username"`
	Email        string    `gorm:"unique;not null" json:"email"`
	FullName     string    `gorm:"not null" json:"full_name"`
	TeamName     string    `json:"team_name"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Teams        []Team    `gorm:"foreignKey:ManagerID" json:"teams,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
