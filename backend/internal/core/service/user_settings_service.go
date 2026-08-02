package service

import (
	"football-app-backend/internal/adapter/storage/postgres/repository"
	"football-app-backend/internal/core/domain"
	"time"
)

type UserSettingsService struct {
	userSettingsRepo *repository.UserSettingsRepository
}

func NewUserSettingsService(userSettingsRepo *repository.UserSettingsRepository) *UserSettingsService {
	return &UserSettingsService{
		userSettingsRepo: userSettingsRepo,
	}
}

func (s *UserSettingsService) GetUserSettings(userID int, userType string) (*domain.UserSettings, error) {
	settings, err := s.userSettingsRepo.GetSettings(userID, userType)
	if err != nil {
		// If settings not found, create default settings
		if err.Error() == "user settings not found" {
			defaultSettings := &domain.UserSettings{
				UserID:             uint(userID),
				UserType:           userType,
				EmailNotifications: true,
				MatchReminders:     true,
				DarkMode:           false,
				Language:           "en",
				Timezone:           "UTC",
				LastUpdated:        time.Now(),
			}
			err = s.userSettingsRepo.CreateSettings(defaultSettings)
			if err != nil {
				return nil, err
			}
			return s.userSettingsRepo.GetSettings(userID, userType)
		}
		return nil, err
	}
	return settings, nil
}

func (s *UserSettingsService) UpdateUserSettings(settings *domain.UserSettings) error {
	return s.userSettingsRepo.UpdateSettings(settings)
}
