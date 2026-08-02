package dto

type UpdateUserSettingsRequest struct {
	EmailNotifications bool   `json:"email_notifications"`
	MatchReminders     bool   `json:"match_reminders"`
	DarkMode           bool   `json:"dark_mode"`
	Language           string `json:"language"`
	Timezone           string `json:"timezone"`
}

type UserSettingsResponse struct {
	ID                 uint   `json:"id"`
	UserID             uint   `json:"user_id"`
	UserType           string `json:"user_type"`
	EmailNotifications bool   `json:"email_notifications"`
	MatchReminders     bool   `json:"match_reminders"`
	DarkMode           bool   `json:"dark_mode"`
	Language           string `json:"language"`
	Timezone           string `json:"timezone"`
}
