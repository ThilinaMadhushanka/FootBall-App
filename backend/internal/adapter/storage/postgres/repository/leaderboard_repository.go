package repository

import (
	"football-app-backend/internal/core/domain"

	"gorm.io/gorm"
)

type LeaderboardRepository struct {
	db *gorm.DB
}

func NewLeaderboardRepository(db *gorm.DB) *LeaderboardRepository {
	return &LeaderboardRepository{db: db}
}

func (r *LeaderboardRepository) GetLeaderboard() ([]*domain.LeaderboardEntry, error) {
	var entries []*domain.LeaderboardEntry
	err := r.db.Preload("Manager").Preload("Team").
		Order("total_points desc").
		Order("goal_difference desc").
		Order("goals_for desc").
		Find(&entries).Error
	return entries, err
}

func (r *LeaderboardRepository) GetTeamRank(managerID int) (*domain.LeaderboardEntry, error) {
	var entry domain.LeaderboardEntry
	err := r.db.Preload("Team").Where("manager_id = ?", managerID).First(&entry).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

func (r *LeaderboardRepository) Create(entry *domain.LeaderboardEntry) error {
	return r.db.Create(entry).Error
}

func (r *LeaderboardRepository) UpdateTeamStats(entry *domain.LeaderboardEntry) error {
	return r.db.Save(entry).Error
}
