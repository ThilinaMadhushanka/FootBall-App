package repository

import (
	"football-app-backend/internal/core/domain"
	"time"

	"gorm.io/gorm"
)

type MatchRepository struct {
	db *gorm.DB
}

func NewMatchRepository(db *gorm.DB) *MatchRepository {
	return &MatchRepository{db: db}
}

func (r *MatchRepository) Create(match *domain.Match) error {
	match.CreatedAt = time.Now()
	return r.db.Create(match).Error
}

func (r *MatchRepository) GetByID(id int) (*domain.Match, error) {
	var match domain.Match
	err := r.db.Preload("Team1").Preload("Team2").First(&match, id).Error
	if err != nil {
		return nil, err
	}
	return &match, nil
}

func (r *MatchRepository) Update(match *domain.Match) error {
	return r.db.Save(match).Error
}

func (r *MatchRepository) Delete(id int) error {
	return r.db.Delete(&domain.Match{}, id).Error
}

func (r *MatchRepository) GetAll() ([]*domain.Match, error) {
	var matches []*domain.Match
	err := r.db.Preload("Team1").Preload("Team2").Order("match_date desc").Find(&matches).Error
	return matches, err
}

func (r *MatchRepository) GetAllBySeason(seasonID int) ([]*domain.Match, error) {
	var matches []*domain.Match
	err := r.db.Preload("Team1").Preload("Team2").Preload("Competition").Where("season_id = ?", seasonID).Order("match_date desc").Find(&matches).Error
	return matches, err
}

func (r *MatchRepository) GetTeamMatches(teamName string) ([]*domain.Match, error) {
	var team domain.Team
	if err := r.db.Where("name = ?", teamName).First(&team).Error; err != nil {
		return nil, err
	}

	var matches []*domain.Match
	err := r.db.Preload("Team1").Preload("Team2").
		Where("team1_id = ? OR team2_id = ?", team.ID, team.ID).
		Order("match_date desc").Find(&matches).Error
	return matches, err
}

func (r *MatchRepository) GetUpcomingMatches() ([]*domain.Match, error) {
	var matches []*domain.Match
	err := r.db.Preload("Team1").Preload("Team2").
		Where("match_date > ?", time.Now()).
		Order("match_date asc").Find(&matches).Error
	return matches, err
}

func (r *MatchRepository) GetUpcomingMatchesBySeason(seasonID int) ([]*domain.Match, error) {
	var matches []*domain.Match
	err := r.db.Preload("Team1").Preload("Team2").Preload("Competition").Where("season_id = ? AND match_date > ?", seasonID, time.Now()).Order("match_date asc").Find(&matches).Error
	return matches, err
}

func (r *MatchRepository) AddMatchEvent(event *domain.MatchEvent) error {
	event.CreatedAt = time.Now()
	return r.db.Create(event).Error
}

func (r *MatchRepository) GetMatchEvents(matchID int) ([]*domain.MatchEvent, error) {
	var events []*domain.MatchEvent
	err := r.db.Preload("Player").Preload("Team").
		Where("match_id = ?", matchID).
		Order("minute asc").Find(&events).Error
	return events, err
}

func (r *MatchRepository) UpdateMatchStatus(id int, status string) error {
	return r.db.Model(&domain.Match{}).Where("id = ?", id).Update("status", status).Error
}

func (r *MatchRepository) UpdateMatchScore(id int, score1, score2 int) error {
	return r.db.Model(&domain.Match{}).Where("id = ?", id).Updates(map[string]interface{}{
		"score_team1": score1,
		"score_team2": score2,
	}).Error
}
