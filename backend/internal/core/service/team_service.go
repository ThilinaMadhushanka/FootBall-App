package service

import (
	"errors"
	"time"

	"football-app-backend/internal/adapter/storage/postgres/repository"
	"football-app-backend/internal/core/domain"
)

type TeamService struct {
	teamRepo *repository.TeamRepository
}

func NewTeamService(teamRepo *repository.TeamRepository) *TeamService {
	return &TeamService{
		teamRepo: teamRepo,
	}
}

func (s *TeamService) CreateTeam(team *domain.Team) error {
	// Validate manager exists
	if team.ManagerID == nil || *team.ManagerID <= 0 {
		return errors.New("invalid manager ID")
	}

	team.CreatedAt = time.Now()
	return s.teamRepo.Create(team)
}

func (s *TeamService) GetTeamByID(id int) (*domain.Team, error) {
	return s.teamRepo.GetByID(id)
}

func (s *TeamService) UpdateTeam(team *domain.Team) error {
	existingTeam, err := s.teamRepo.GetByID(int(team.ID))
	if err != nil {
		return err
	}

	// Preserve creation time
	team.CreatedAt = existingTeam.CreatedAt

	return s.teamRepo.Update(team)
}

func (s *TeamService) DeleteTeam(id int) error {
	return s.teamRepo.Delete(id)
}

func (s *TeamService) GetAllTeams() ([]*domain.Team, error) {
	return s.teamRepo.GetAll()
}

func (s *TeamService) GetTeamByManagerID(managerID int) (*domain.Team, error) {
	return s.teamRepo.GetByManagerID(managerID)
}

func (s *TeamService) UpdateTeamBudget(teamID int, newBudget float64) error {
	if newBudget < 0 {
		return errors.New("budget cannot be negative")
	}

	team, err := s.teamRepo.GetByID(teamID)
	if err != nil {
		return err
	}

	team.Budget = newBudget
	return s.teamRepo.Update(team)
}

func (s *TeamService) UpdateTeamStadium(teamID int, newStadium string) error {
	if newStadium == "" {
		return errors.New("stadium name cannot be empty")
	}

	team, err := s.teamRepo.GetByID(teamID)
	if err != nil {
		return err
	}

	team.Stadium = newStadium
	return s.teamRepo.Update(team)
}

func (s *TeamService) GetTeamPlayers(teamID int) ([]*domain.Player, error) {
	return s.teamRepo.GetTeamPlayers(teamID)
}

func (s *TeamService) UpdateTeamFormation(teamID int, formation string) error {
	valid := map[string]bool{"4-4-2": true, "4-3-3": true, "3-5-2": true, "5-3-2": true, "4-2-3-1": true}
	if !valid[formation] {
		return errors.New("invalid formation")
	}
	return s.teamRepo.UpdateTeamFormation(teamID, formation)
}
