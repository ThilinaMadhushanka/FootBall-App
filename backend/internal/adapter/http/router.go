package http

import (
	"football-app-backend/internal/adapter/http/api"
	"football-app-backend/internal/adapter/http/middleware"
	"football-app-backend/internal/adapter/storage/postgres/repository"
	"football-app-backend/internal/core/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	// Initialize repositories
	playerRepo := repository.NewPlayerRepository(db)
	teamRepo := repository.NewTeamRepository(db)
	managerRepo := repository.NewManagerRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(db)
	matchRepo := repository.NewMatchRepository(db)
	userSettingsRepo := repository.NewUserSettingsRepository(db)

	// Initialize services
	playerService := service.NewPlayerService(playerRepo, teamRepo)
	teamService := service.NewTeamService(teamRepo)
	managerService := service.NewManagerService(managerRepo, teamRepo)
	leaderboardService := service.NewLeaderboardService(leaderboardRepo)
	matchService := service.NewMatchService(matchRepo, teamRepo)
	userSettingsService := service.NewUserSettingsService(userSettingsRepo)

	// Initialize handlers
	playerHandler := api.NewPlayerHandler(playerService)
	teamHandler := api.NewTeamHandler(teamService)
	matchHandler := api.NewMatchHandler(matchService)
	authHandler := api.NewAuthHandler(managerService, playerService, db)
	userSettingsHandler := api.NewUserSettingsHandler(userSettingsService)
	leaderboardHandler := api.NewLeaderboardHandler(leaderboardService)
	dashboardHandler := api.NewDashboardHandler(db)
	teamRequestHandler := api.NewTeamRequestHandler(db)
	competitionHandler := api.NewCompetitionHandler(db)
	contractHandler := api.NewContractHandler(db)
	notificationHandler := api.NewNotificationHandler(db)

	// Create router
	router := gin.Default()

	// CORS Middleware
	router.Use(middleware.CORS())

	// API group
	apiGroup := router.Group("/api")
	{
		// Auth routes (no authentication required)
		apiGroup.POST("/login/:userType", authHandler.Login)
		apiGroup.POST("/register/manager", authHandler.RegisterManager)
		apiGroup.POST("/register/player", authHandler.RegisterPlayer)
		apiGroup.POST("/register/viewer", authHandler.RegisterViewer)
		apiGroup.POST("/register/organizer", authHandler.RegisterOrganizer)
		apiGroup.GET("/teams/available", competitionHandler.AvailableTeams)

		// Authenticated routes
		authenticated := apiGroup.Group("/")
		authenticated.Use(middleware.AuthMiddleware())
		authenticated.Use(middleware.AuditMutations(db))
		{
			authenticated.GET("/notifications", notificationHandler.List)
			authenticated.PUT("/notifications/read-all", notificationHandler.ReadAll)
			authenticated.PUT("/notifications/:id/read", notificationHandler.Read)
			authenticated.GET("/competitions", competitionHandler.List)
			authenticated.GET("/organizer/competitions", middleware.RequireRoles("organizer"), competitionHandler.Mine)
			authenticated.POST("/competitions", middleware.RequireRoles("organizer"), competitionHandler.Create)
			authenticated.POST("/organizer/teams", middleware.RequireRoles("organizer"), competitionHandler.CreateTeamName)
			authenticated.DELETE("/competitions/:id", middleware.RequireRoles("organizer"), competitionHandler.Delete)
			authenticated.POST("/seasons/:season_id/teams", middleware.RequireRoles("organizer"), competitionHandler.AddTeam)
			authenticated.DELETE("/seasons/:season_id/teams/:team_id", middleware.RequireRoles("organizer"), competitionHandler.RemoveTeam)
			authenticated.GET("/organizer/seasons/:season_id/registrations", middleware.RequireRoles("organizer"), competitionHandler.Registrations)
			authenticated.PUT("/organizer/seasons/:season_id/teams/:team_id/budget", middleware.RequireRoles("organizer"), competitionHandler.UpdateBudget)
			authenticated.POST("/organizer/seasons/:season_id/generate-fixtures", middleware.RequireRoles("organizer"), competitionHandler.GenerateFixtures)
			authenticated.POST("/organizer/seasons/:season_id/rollover", middleware.RequireRoles("organizer"), competitionHandler.RolloverSeason)
			authenticated.GET("/seasons/:season_id/teams", competitionHandler.Teams)
			authenticated.GET("/seasons/:season_id/standings", competitionHandler.Standings)
			authenticated.GET("/seasons/:season_id/players/:player_id/stats", competitionHandler.PlayerStats)
			authenticated.POST("/contract-offers", middleware.RequireRoles("manager"), contractHandler.Create)
			authenticated.GET("/contract-offers", middleware.RequireRoles("manager", "player"), contractHandler.List)
			authenticated.GET("/seasons/:season_id/my-budget", middleware.RequireRoles("manager"), contractHandler.MyBudget)
			authenticated.PUT("/contract-offers/:id/respond", middleware.RequireRoles("manager", "player"), contractHandler.Respond)
			authenticated.GET("/dashboard/stats", dashboardHandler.GetStats)
			authenticated.GET("/dashboard/next-match", dashboardHandler.GetNextMatch)

			// Player routes
			authenticated.GET("/players", playerHandler.GetAllPlayers)
			authenticated.GET("/players/:id", playerHandler.GetPlayer)
			authenticated.GET("/players/:id/stats", playerHandler.GetPlayerStats)
			authenticated.PUT("/players/:id", middleware.RequireRoles("player"), playerHandler.UpdatePlayer)
			authenticated.DELETE("/players/:id", middleware.RequireRoles("player"), playerHandler.DeletePlayer)
			authenticated.PUT("/players/:id/stats", middleware.RequireRoles("manager"), playerHandler.UpdatePlayerStats)
			authenticated.POST("/players/:id/transfer", middleware.RequireRoles("manager"), playerHandler.TransferPlayer)

			// Team routes
			authenticated.POST("/teams", middleware.RequireRoles("manager"), teamHandler.CreateTeam)
			authenticated.GET("/teams", teamHandler.GetAllTeams)
			authenticated.GET("/teams/:id", teamHandler.GetTeam)
			authenticated.PUT("/teams/:id", middleware.RequireRoles("manager"), teamHandler.UpdateTeam)
			authenticated.DELETE("/teams/:id", middleware.RequireRoles("manager"), teamHandler.DeleteTeam)
			authenticated.GET("/teams/my-teams", teamHandler.GetMyTeams)
			authenticated.GET("/teams/manager/:manager_id", teamHandler.GetTeamByManager)
			authenticated.PUT("/teams/:id/budget", middleware.RequireRoles("manager"), teamHandler.UpdateTeamBudget)
			authenticated.PUT("/teams/:id/stadium", middleware.RequireRoles("manager"), teamHandler.UpdateTeamStadium)
			authenticated.GET("/teams/:id/players", teamHandler.GetTeamPlayers)
			authenticated.PUT("/teams/:id/formation", middleware.RequireRoles("manager"), teamHandler.UpdateTeamFormation)
			authenticated.POST("/teams/:id/requests", middleware.RequireRoles("manager"), teamRequestHandler.Create)
			authenticated.GET("/team-requests/player", teamRequestHandler.PlayerInvitations)
			authenticated.GET("/team-requests/manager", teamRequestHandler.ManagerRequests)
			authenticated.PUT("/team-requests/:id/respond", middleware.RequireRoles("manager", "player"), teamRequestHandler.Respond)

			// Match routes
			authenticated.POST("/matches", middleware.RequireRoles("manager"), matchHandler.CreateMatch)
			authenticated.GET("/matches", matchHandler.GetAllMatches)
			authenticated.GET("/matches/upcoming", matchHandler.GetUpcomingMatches)
			authenticated.GET("/matches/:id", matchHandler.GetMatch)
			authenticated.GET("/matches/:id/events", matchHandler.GetMatchEvents)
			authenticated.POST("/matches/:id/events", middleware.RequireRoles("manager"), matchHandler.AddMatchEvent)
			authenticated.PUT("/matches/:id", middleware.RequireRoles("manager"), matchHandler.UpdateMatch)
			authenticated.DELETE("/matches/:id", middleware.RequireRoles("manager"), matchHandler.DeleteMatch)
			authenticated.PUT("/matches/:id/status", middleware.RequireRoles("manager"), matchHandler.UpdateMatchStatus)
			authenticated.GET("/matches/team/:team_name", matchHandler.GetTeamMatches)

			// User Profile route
			authenticated.GET("/profile", authHandler.GetProfile)
			authenticated.PUT("/profile", authHandler.UpdateProfile)

			// User Settings routes
			authenticated.GET("/settings", userSettingsHandler.GetUserSettings)
			authenticated.PUT("/settings", userSettingsHandler.UpdateUserSettings)

			// Leaderboard routes
			authenticated.GET("/leaderboard", leaderboardHandler.GetLeaderboard)
			authenticated.GET("/leaderboard/rank/:manager_id", leaderboardHandler.GetTeamRank)
			authenticated.GET("/leaderboard/stats/:manager_id", leaderboardHandler.GetTeamStats)
		}
	}

	return router
}
