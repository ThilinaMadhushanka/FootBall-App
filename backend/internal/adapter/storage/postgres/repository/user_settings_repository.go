package repository

import (
	"errors"
	"football-app-backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

type UserSettingsRepository struct {
	db *gorm.DB
}

func NewUserSettingsRepository(db *gorm.DB) *UserSettingsRepository {
	return &UserSettingsRepository{db: db}
}

func (r *UserSettingsRepository) GetSettings(userID int, userType string) (*domain.UserSettings, error) {
	var settings domain.UserSettings
	err := r.db.Where("user_id = ? AND user_type = ?", userID, userType).First(&settings).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user settings not found")
		}
		return nil, err
	}
	return &settings, nil
}

func (r *UserSettingsRepository) UpdateSettings(settings *domain.UserSettings) error {
	settings.LastUpdated = time.Now()
	return r.db.Model(&domain.UserSettings{}).
		Where("user_id = ? AND user_type = ?", settings.UserID, settings.UserType).
		Updates(map[string]interface{}{
			"email_notifications": settings.EmailNotifications,
			"match_reminders":     settings.MatchReminders,
			"dark_mode":           settings.DarkMode,
			"language":            settings.Language,
			"timezone":            settings.Timezone,
			"last_updated":        settings.LastUpdated,
		}).Error
}

func (r *UserSettingsRepository) CreateSettings(settings *domain.UserSettings) error {
	settings.LastUpdated = time.Now()
	return r.db.Create(settings).Error
}

func (r *UserSettingsRepository) DeleteSettings(userID int, userType string) error {
	return r.db.Where("user_id = ? AND user_type = ?", userID, userType).Delete(&domain.UserSettings{}).Error
}

func (r *UserSettingsRepository) GetUsersWithNotifications() ([]*domain.UserSettings, error) {
	var settings []*domain.UserSettings
	err := r.db.Where("email_notifications = ? OR match_reminders = ?", true, true).Find(&settings).Error
	return settings, err
}
