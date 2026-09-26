package repository

import (
	"football-app-backend/internal/core/domain"

	"gorm.io/gorm"
)

type PlayerRepository struct {
	db *gorm.DB
}

func NewPlayerRepository(db *gorm.DB) *PlayerRepository {
	return &PlayerRepository{db: db}
}

func (r *PlayerRepository) Create(player *domain.Player) error {
	return r.db.Create(player).Error
}

func (r *PlayerRepository) GetByID(id int) (*domain.Player, error) {
	var player domain.Player
	err := r.db.Preload("CurrentTeam").First(&player, id).Error
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (r *PlayerRepository) Update(player *domain.Player) error {
	return r.db.Save(player).Error
}

func (r *PlayerRepository) Delete(id int) error {
	return r.db.Delete(&domain.Player{}, id).Error
}

func (r *PlayerRepository) GetAll() ([]*domain.Player, error) {
	var players []*domain.Player
	err := r.db.Preload("CurrentTeam").Order("created_at desc").Find(&players).Error
	return players, err
}

func (r *PlayerRepository) GetByUsername(username string) (*domain.Player, error) {
	var player domain.Player
	err := r.db.Preload("CurrentTeam").Where("username = ?", username).First(&player).Error
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (r *PlayerRepository) GetByEmail(email string) (*domain.Player, error) {
	var player domain.Player
	err := r.db.Preload("CurrentTeam").Where("email = ?", email).First(&player).Error
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (r *PlayerRepository) UpdatePassword(id uint, passwordHash string) error {
	return r.db.Model(&domain.Player{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

func (r *PlayerRepository) UpdateStats(stats *domain.PlayerStats) error {
	return r.db.Save(stats).Error
}

func (r *PlayerRepository) GetStats(playerID int) (*domain.PlayerStats, error) {
	var stats domain.PlayerStats
	err := r.db.Where("player_id = ?", playerID).First(&stats).Error
	if err != nil {
		return nil, err
	}
	return &stats, nil
}
