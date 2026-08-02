package postgres

import (
	"fmt"
	"football-app-backend/internal/config"
	"football-app-backend/internal/core/domain"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Initialize(cfg *config.Config) (*gorm.DB, error) {

	dsn := getDSN(cfg)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database : %w", err)
	}

	log.Println("Database connected successfully")
	return db, nil
}

func getDSN(cfg *config.Config) string {
	return fmt.Sprintf(
		"host = %s user = %s password = %s dbname = %s port = %s sslmode = disable",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
	)
}

func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")
	if err := db.AutoMigrate(&domain.Viewer{}); err != nil {
		return fmt.Errorf("viewer migration failed: %w", err)
	}
	if err := db.AutoMigrate(&domain.Organizer{}, &domain.Organization{}, &domain.Competition{}, &domain.Season{}, &domain.CompetitionTeam{}, &domain.CompetitionPlayerStats{}, &domain.ContractOffer{}, &domain.PlayerContract{}, &domain.Notification{}, &domain.AuditLog{}); err != nil {
		return fmt.Errorf("competition migration failed: %w", err)
	}
	for _, field := range []string{"CompetitionID", "SeasonID", "RoundName"} {
		if !db.Migrator().HasColumn(&domain.Match{}, field) {
			if err := db.Migrator().AddColumn(&domain.Match{}, field); err != nil {
				return fmt.Errorf("match competition column migration failed: %w", err)
			}
		}
	}
	if err := seedCompetitions(db); err != nil {
		return err
	}
	if err := db.AutoMigrate(&domain.TeamRequest{}); err != nil {
		return fmt.Errorf("team request migration failed: %w", err)
	}
	if !db.Migrator().HasColumn(&domain.Team{}, "Formation") {
		if err := db.Migrator().AddColumn(&domain.Team{}, "Formation"); err != nil {
			return fmt.Errorf("team formation migration failed: %w", err)
		}
	}

	// This project ships with a SQL-managed schema. Avoid having AutoMigrate
	// rewrite constraints when that complete schema already exists.
	requiredTables := []string{
		"managers", "matches", "match_events", "leaderboard",
		"players", "player_stats", "teams", "user_settings",
	}
	allTablesExist := true
	for _, table := range requiredTables {
		if !db.Migrator().HasTable(table) {
			allTablesExist = false
			break
		}
	}
	if allTablesExist {
		log.Println("Database schema already exists; skipping automatic migrations")
		return nil
	}

	err := db.AutoMigrate(
		&domain.Manager{},
		&domain.Match{},
		&domain.MatchEvent{},
		&domain.LeaderboardEntry{},
		&domain.Player{},
		&domain.PlayerStats{},
		&domain.Team{},
		&domain.UserSettings{},
	)

	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("migrations completed successfully")
	return nil
}

func seedCompetitions(db *gorm.DB) error {
	type seed struct{ org, orgCode, region, competition, code, kind string }
	seeds := []seed{
		{"Premier League", "PL", "England", "English Premier League", "EPL", "domestic_league"},
		{"UEFA", "UEFA", "Europe", "UEFA Champions League", "UCL", "continental_club"},
		{"FIFA", "FIFA", "International", "FIFA World Cup", "FWC", "international"},
		{"Major League Soccer", "MLSORG", "USA/Canada", "Major League Soccer", "MLS", "domestic_league"},
	}
	for index, item := range seeds {
		var org domain.Organization
		if err := db.Where("code = ?", item.orgCode).First(&org).Error; err != nil {
			if err != gorm.ErrRecordNotFound {
				return fmt.Errorf("organization seed failed: %w", err)
			}
			org = domain.Organization{Name: item.org, Code: item.orgCode, Region: item.region}
			if err := db.Create(&org).Error; err != nil {
				return fmt.Errorf("organization seed failed: %w", err)
			}
		}
		var competition domain.Competition
		if err := db.Where("code = ?", item.code).First(&competition).Error; err != nil {
			if err != gorm.ErrRecordNotFound {
				return fmt.Errorf("competition seed failed: %w", err)
			}
			competition = domain.Competition{OrganizationID: org.ID, Name: item.competition, Code: item.code, Type: item.kind, Region: item.region, DefaultTransferBudget: 500000000, DefaultSalaryBudget: 200000000}
			if err := db.Create(&competition).Error; err != nil {
				return fmt.Errorf("competition seed failed: %w", err)
			}
		}
		if competition.DefaultTransferBudget == 0 || competition.DefaultSalaryBudget == 0 {
			db.Model(&competition).Updates(map[string]interface{}{"default_transfer_budget": 500000000, "default_salary_budget": 200000000})
		}
		var season domain.Season
		if err := db.Where("competition_id = ? AND name = ?", competition.ID, "2026/27").First(&season).Error; err != nil {
			if err != gorm.ErrRecordNotFound {
				return fmt.Errorf("season seed failed: %w", err)
			}
			season = domain.Season{CompetitionID: competition.ID, Name: "2026/27", StartDate: time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC), EndDate: time.Date(2027, 6, 30, 0, 0, 0, 0, time.UTC), IsActive: true}
			if err := db.Create(&season).Error; err != nil {
				return fmt.Errorf("season seed failed: %w", err)
			}
		}
		if index == 0 {
			var teams []domain.Team
			if err := db.Find(&teams).Error; err != nil {
				return err
			}
			for _, team := range teams {
				var registration domain.CompetitionTeam
				if err := db.Where("season_id = ? AND team_id = ?", season.ID, team.ID).First(&registration).Error; err == gorm.ErrRecordNotFound {
					registration = domain.CompetitionTeam{SeasonID: season.ID, TeamID: team.ID, TransferBudget: 500000000, RemainingTransferBudget: 500000000, SalaryBudget: 200000000, RemainingSalaryBudget: 200000000}
					db.Create(&registration)
				}
				db.Model(&domain.CompetitionTeam{}).Where("season_id = ? AND team_id = ? AND transfer_budget = 0", season.ID, team.ID).Updates(map[string]interface{}{"transfer_budget": 500000000, "remaining_transfer_budget": 500000000, "salary_budget": 200000000, "remaining_salary_budget": 200000000})
			}
			db.Model(&domain.Match{}).Where("season_id IS NULL").Updates(map[string]interface{}{"competition_id": competition.ID, "season_id": season.ID})
			var playerStats []domain.PlayerStats
			if err := db.Find(&playerStats).Error; err == nil {
				for _, stats := range playerStats {
					var existing domain.CompetitionPlayerStats
					if err := db.Where("season_id = ? AND player_id = ?", season.ID, stats.PlayerID).First(&existing).Error; err == gorm.ErrRecordNotFound {
						record := domain.CompetitionPlayerStats{SeasonID: season.ID, PlayerID: stats.PlayerID, GamesPlayed: stats.GamesPlayed, Goals: stats.Goals, Assists: stats.Assists, YellowCards: stats.YellowCards, RedCards: stats.RedCards, CleanSheets: stats.CleanSheets, MinutesPlayed: stats.MinutesPlayed, LastUpdated: stats.LastUpdated}
						db.Create(&record)
					}
				}
			}
		}
	}
	return nil
}
