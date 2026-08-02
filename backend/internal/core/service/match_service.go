package service

import (
	"errors"
	"time"

	"football-app-backend/internal/adapter/storage/postgres/repository"
	"football-app-backend/internal/core/domain"
)

type MatchService struct {
	matchRepo *repository.MatchRepository
	teamRepo  *repository.TeamRepository
}

func NewMatchService(matchRepo *repository.MatchRepository, teamRepo *repository.TeamRepository) *MatchService {
	return &MatchService{
		matchRepo: matchRepo,
		teamRepo:  teamRepo,
	}
}

func (s *MatchService) CreateMatch(match *domain.Match) error {
	match.CreatedAt = time.Now()
	// Initial score should be 0 if not set
	return s.matchRepo.Create(match)
}

func (s *MatchService) GetMatchByID(id int) (*domain.Match, error) {
	return s.matchRepo.GetByID(id)
}

func (s *MatchService) UpdateMatch(match *domain.Match) error {
	existingMatch, err := s.matchRepo.GetByID(int(match.ID))
	if err != nil {
		return err
	}

	// Preserve creation time
	match.CreatedAt = existingMatch.CreatedAt

	return s.matchRepo.Update(match)
}

func (s *MatchService) DeleteMatch(id int) error {
	return s.matchRepo.Delete(id)
}

func (s *MatchService) GetAllMatches() ([]*domain.Match, error) {
	return s.matchRepo.GetAll()
}

func (s *MatchService) GetAllMatchesBySeason(seasonID int) ([]*domain.Match, error) {
	return s.matchRepo.GetAllBySeason(seasonID)
}

func (s *MatchService) GetUpcomingMatches() ([]*domain.Match, error) {
	return s.matchRepo.GetUpcomingMatches()
}

func (s *MatchService) GetUpcomingMatchesBySeason(seasonID int) ([]*domain.Match, error) {
	return s.matchRepo.GetUpcomingMatchesBySeason(seasonID)
}

func (s *MatchService) UpdateMatchStatus(id int, status string) error {
	validStatuses := map[string]bool{
		"scheduled": true,
		"live":      true,
		"completed": true,
		"cancelled": true,
	}

	if !validStatuses[status] {
		return errors.New("invalid match status")
	}

	return s.matchRepo.UpdateMatchStatus(id, status)
}

func (s *MatchService) GetTeamMatches(teamName string) ([]*domain.Match, error) {
	return s.matchRepo.GetTeamMatches(teamName)
}

func (s *MatchService) UpdateMatchScore(matchID int, score1, score2 int) error {
	err := s.matchRepo.UpdateMatchScore(matchID, score1, score2)
	if err != nil {
		return err
	}

	// Update status to completed when score is updated (assuming it's a final score)
	return s.matchRepo.UpdateMatchStatus(matchID, "completed")
}

func (s *MatchService) AddMatchEvent(event *domain.MatchEvent) error {
	return s.matchRepo.AddMatchEvent(event)
}

func (s *MatchService) GetMatchEvents(matchID int) ([]*domain.MatchEvent, error) {
	return s.matchRepo.GetMatchEvents(matchID)
}
