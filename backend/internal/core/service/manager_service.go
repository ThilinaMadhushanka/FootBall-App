package service

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"

	"football-app-backend/internal/adapter/storage/postgres/repository"
	"football-app-backend/internal/core/domain"
)

type ManagerService struct {
	managerRepo *repository.ManagerRepository
	teamRepo    *repository.TeamRepository
}

func NewManagerService(managerRepo *repository.ManagerRepository, teamRepo *repository.TeamRepository) *ManagerService {
	return &ManagerService{
		managerRepo: managerRepo,
		teamRepo:    teamRepo,
	}
}

func (s *ManagerService) Authenticate(username, password string) (*domain.Manager, error) {
	manager, err := s.managerRepo.GetByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(manager.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return manager, nil
}

func (s *ManagerService) GetManagerByID(id int) (*domain.Manager, error) {
	manager, err := s.managerRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Get team information if available
	team, err := s.teamRepo.GetByManagerID(int(manager.ID))
	if err == nil {
		manager.TeamName = team.Name
	}

	return manager, nil
}

func (s *ManagerService) RegisterManager(manager *domain.Manager, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	manager.PasswordHash = string(hashedPassword)
	manager.CreatedAt = time.Now()

	return s.managerRepo.Create(manager)
}

func (s *ManagerService) UpdateManager(manager *domain.Manager) error {
	return s.managerRepo.Update(manager)
}
