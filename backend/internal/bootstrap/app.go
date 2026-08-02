package bootstrap

import (
	"football-app-backend/internal/adapter/http"
	"football-app-backend/internal/adapter/http/middleware"
	"football-app-backend/internal/adapter/storage/postgres"
	"football-app-backend/internal/config"
	"log"

	"github.com/gin-gonic/gin"
)

type App struct {
	Config *config.Config
	Router *gin.Engine
}

func NewApp() *App {
	cfg := config.Load()
	if err := middleware.ValidateJWTConfiguration(); err != nil {
		log.Fatal(err)
	}

	// Initialize database
	db, err := postgres.Initialize(cfg)
	if err != nil {
		log.Fatalf("Could not initialize database: %v", err)
	}

	// Run migrations
	if err := postgres.RunMigrations(db); err != nil {
		log.Fatalf("Could not run migrations: %v", err)
	}

	// Setup router (which initializes all repos, services, and handlers)
	router := http.SetupRouter(db)

	return &App{
		Config: cfg,
		Router: router,
	}
}

func (a *App) Run() {
	log.Printf("Server starting on :%s", a.Config.AppPort)
	if err := a.Router.Run(":" + a.Config.AppPort); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
