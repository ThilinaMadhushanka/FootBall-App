package repository

import (
	"football-app-backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

type TeamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

func (r *TeamRepository) Create(team *domain.Team) error {
	team.CreatedAt = time.Now()
	return r.db.Create(team).Error
}

func (r *TeamRepository) GetByID(id int) (*domain.Team, error) {
	var team domain.Team
	err := r.db.Preload("Manager").First(&team, id).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func (r *TeamRepository) Update(team *domain.Team) error {
	return r.db.Save(team).Error
}

func (r *TeamRepository) Delete(id int) error {
	return r.db.Delete(&domain.Team{}, id).Error
}

func (r *TeamRepository) GetAll() ([]*domain.Team, error) {
	var teams []*domain.Team
	err := r.db.Preload("Manager").Order("created_at desc").Find(&teams).Error
	return teams, err
}

func (r *TeamRepository) GetByManagerID(managerID int) (*domain.Team, error) {
	var team domain.Team
	err := r.db.Preload("Manager").Where("manager_id = ?", managerID).First(&team).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func (r *TeamRepository) GetTeamPlayers(teamID int) ([]*domain.Player, error) {
	var players []*domain.Player
	err := r.db.Where("current_team_id = ?", teamID).Order("position, jersey_number").Find(&players).Error
	return players, err
}

func (r *TeamRepository) UpdateTeamBudget(teamID int, newBudget float64) error {
	return r.db.Model(&domain.Team{}).Where("id = ?", teamID).Update("budget", newBudget).Error
}

func (r *TeamRepository) UpdateTeamStadium(teamID int, stadium string) error {
	return r.db.Model(&domain.Team{}).Where("id = ?", teamID).Update("stadium", stadium).Error
}

func (r *TeamRepository) UpdateTeamFormation(teamID int, formation string) error {
	return r.db.Model(&domain.Team{}).Where("id = ?", teamID).Update("formation", formation).Error
}
