package service

import (
	"errors"
	"time"

	"football-app-backend/internal/adapter/storage/postgres/repository"
	"football-app-backend/internal/core/domain"

	"golang.org/x/crypto/bcrypt"
)

type PlayerService struct {
	playerRepo *repository.PlayerRepository
	teamRepo   *repository.TeamRepository
}

func NewPlayerService(playerRepo *repository.PlayerRepository, teamRepo *repository.TeamRepository) *PlayerService {
	return &PlayerService{
		playerRepo: playerRepo,
		teamRepo:   teamRepo,
	}
}

func (s *PlayerService) RegisterPlayer(player *domain.Player, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	player.PasswordHash = string(hashedPassword)
	player.CreatedAt = time.Now()
	player.LastLogin = time.Now()

	return s.playerRepo.Create(player)
}

func (s *PlayerService) GetPlayerByID(id int) (*domain.Player, error) {
	return s.playerRepo.GetByID(id)
}

func (s *PlayerService) UpdatePlayer(player *domain.Player) error {
	existingPlayer, err := s.playerRepo.GetByID(int(player.ID))
	if err != nil {
		return err
	}

	// Preserve sensitive fields
	player.PasswordHash = existingPlayer.PasswordHash
	player.CreatedAt = existingPlayer.CreatedAt

	return s.playerRepo.Update(player)
}

func (s *PlayerService) DeletePlayer(id int) error {
	return s.playerRepo.Delete(id)
}

func (s *PlayerService) GetAllPlayers() ([]*domain.Player, error) {
	return s.playerRepo.GetAll()
}

func (s *PlayerService) UpdatePlayerStats(playerID int, stats *domain.PlayerStats) error {
	player, err := s.playerRepo.GetByID(playerID)
	if err != nil {
		return err
	}

	player.GamesPlayed = stats.GamesPlayed
	player.Goals = stats.Goals
	player.Assists = stats.Assists
	player.YellowCards = stats.YellowCards
	player.RedCards = stats.RedCards
	player.CleanSheets = stats.CleanSheets

	return s.playerRepo.Update(player)
}

func (s *PlayerService) GetPlayerStats(playerID int) (*domain.PlayerStats, error) {
	stats, err := s.playerRepo.GetStats(playerID)
	if err == nil {
		return stats, nil
	}

	// Older records may only have their summary stats on the players table.
	player, playerErr := s.playerRepo.GetByID(playerID)
	if playerErr != nil {
		return nil, playerErr
	}

	return &domain.PlayerStats{
		PlayerID:    player.ID,
		GamesPlayed: player.GamesPlayed,
		Goals:       player.Goals,
		Assists:     player.Assists,
		YellowCards: player.YellowCards,
		RedCards:    player.RedCards,
		CleanSheets: player.CleanSheets,
	}, nil
}

func (s *PlayerService) TransferPlayer(playerID int, newTeamID int) error {
	player, err := s.playerRepo.GetByID(playerID)
	if err != nil {
		return err
	}

	team, err := s.teamRepo.GetByID(newTeamID)
	if err != nil {
		return err
	}

	player.CurrentTeam = team
	uTeamID := team.ID
	player.CurrentTeamID = &uTeamID
	return s.playerRepo.Update(player)
}

func (s *PlayerService) UpdatePlayerRating(playerID int, newRating int) error {
	if newRating < 0 || newRating > 100 {
		return errors.New("invalid rating value")
	}

	player, err := s.playerRepo.GetByID(playerID)
	if err != nil {
		return err
	}

	player.Rating = float64(newRating)
	return s.playerRepo.Update(player)
}

func (s *PlayerService) Authenticate(username, password string) (*domain.Player, error) {
	player, err := s.playerRepo.GetByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(player.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return player, nil
}
