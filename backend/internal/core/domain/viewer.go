package domain

import "time"

// Viewer is a read-only football fan account. Viewers can browse public
// sporting data but cannot manage teams, players, transfers, or matches.
type Viewer struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"unique;not null" json:"username"`
	Email        string    `gorm:"unique;not null" json:"email"`
	FullName     string    `gorm:"not null" json:"full_name"`
	PasswordHash string    `gorm:"not null" json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
