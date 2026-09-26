package service

import (
	"football-app-backend/internal/core/domain"
	"football-app-backend/internal/adapter/storage/postgres/repository"
)

type LeaderboardService struct {
	leaderboardRepo *repository.LeaderboardRepository
}

func NewLeaderboardService(leaderboardRepo *repository.LeaderboardRepository) *LeaderboardService {
	return &LeaderboardService{
		leaderboardRepo: leaderboardRepo,
	}
}

func (s *LeaderboardService) GetLeaderboard() ([]*domain.LeaderboardEntry, error) {
	return s.leaderboardRepo.GetLeaderboard()
}

func (s *LeaderboardService) UpdateLeaderboard(entry *domain.LeaderboardEntry) error {
	return s.leaderboardRepo.UpdateTeamStats(entry)
}

func (s *LeaderboardService) GetTeamRank(managerID int) (int, error) {
	entry, err := s.leaderboardRepo.GetTeamRank(managerID)
	if err != nil {
		return 0, err
	}
	return entry.LeagueRank, nil
}

func (s *LeaderboardService) GetTeamStats(managerID int) (*domain.LeaderboardEntry, error) {
	return s.leaderboardRepo.GetTeamRank(managerID)
}
