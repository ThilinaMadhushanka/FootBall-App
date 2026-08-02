package domain

import "time"

type TeamRequest struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PlayerID    uint      `gorm:"not null;index" json:"player_id"`
	Player      *Player   `gorm:"foreignKey:PlayerID" json:"player,omitempty"`
	FromTeamID  *uint     `gorm:"index" json:"from_team_id"`
	FromTeam    *Team     `gorm:"foreignKey:FromTeamID" json:"from_team,omitempty"`
	ToTeamID    uint      `gorm:"not null;index" json:"to_team_id"`
	ToTeam      *Team     `gorm:"foreignKey:ToTeamID" json:"to_team,omitempty"`
	RequestedBy uint      `gorm:"not null" json:"requested_by"`
	RequestType string    `gorm:"not null" json:"request_type"`
	Status      string    `gorm:"not null;default:pending" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
