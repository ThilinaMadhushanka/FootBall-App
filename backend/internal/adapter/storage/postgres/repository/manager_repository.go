package repository

import (
	"football-app-backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

type ManagerRepository struct {
	db *gorm.DB
}

func NewManagerRepository(db *gorm.DB) *ManagerRepository {
	return &ManagerRepository{db: db}
}

func (r *ManagerRepository) GetByID(id int) (*domain.Manager, error) {
	var manager domain.Manager
	err := r.db.Preload("Teams").First(&manager, id).Error
	if err != nil {
		return nil, err
	}
	return &manager, nil
}

func (r *ManagerRepository) GetByUsername(username string) (*domain.Manager, error) {
	var manager domain.Manager
	err := r.db.Preload("Teams").Where("username = ?", username).First(&manager).Error
	if err != nil {
		return nil, err
	}
	return &manager, nil
}

func (r *ManagerRepository) GetByEmail(email string) (*domain.Manager, error) {
	var manager domain.Manager
	err := r.db.Preload("Teams").Where("email = ?", email).First(&manager).Error
	if err != nil {
		return nil, err
	}
	return &manager, nil
}

func (r *ManagerRepository) Create(manager *domain.Manager) error {
	manager.CreatedAt = time.Now()
	manager.UpdatedAt = time.Now()
	return r.db.Create(manager).Error
}

func (r *ManagerRepository) Update(manager *domain.Manager) error {
	manager.UpdatedAt = time.Now()
	return r.db.Save(manager).Error
}

func (r *ManagerRepository) UpdatePassword(id uint, passwordHash string) error {
	return r.db.Model(&domain.Manager{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

func (r *ManagerRepository) Delete(id int) error {
	return r.db.Delete(&domain.Manager{}, id).Error
}

func (r *ManagerRepository) GetAll() ([]*domain.Manager, error) {
	var managers []*domain.Manager
	err := r.db.Preload("Teams").Order("created_at desc").Find(&managers).Error
	return managers, err
}
