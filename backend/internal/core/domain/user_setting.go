package domain

import "time"

type UserSettings struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	UserID             uint      `gorm:"uniqueIndex:idx_user_settings_identity" json:"user_id"`
	UserType           string    `gorm:"uniqueIndex:idx_user_settings_identity" json:"user_type"`
	EmailNotifications bool      `json:"email_notifications"`
	MatchReminders     bool      `json:"match_reminders"`
	DarkMode           bool      `json:"dark_mode"`
	Language           string    `json:"language"`
	Timezone           string    `json:"timezone"`
	LastUpdated        time.Time `json:"last_updated"`
}
