package config

import (
	"os"

	"github.com/joho/godotenv"
)

/*
import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() {
	var err error
	connStr := "host=localhost port=5432 user=postgres password=0616 dbname=football-app sslmode=disable"
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("Connected to PostgreSQL database")
}

func GetDB() *sql.DB {
	return DB
}
*/

type Config struct{
	Appname string
	AppEnv string
	AppPort string
	AppURL string
	DBDriver string
	DBHost string
	DBPort string
	DBUser string
	DBPassword string
	DBName string
	JWTSecret string
	JWTExp string
	CORSOrigins string
	UploadPath string
	MaxUploadSize int64
}

func Load() *Config{
	_ = godotenv.Load()

	return &Config{
		Appname: getEnv("APP_NAME","FOOTBALL"),
		AppEnv:        getEnv("APP_ENV", "development"),
		AppPort:       getEnv("APP_PORT", "8888"),
		AppURL:        getEnv("APP_URL", "http://localhost:8888"),

		DBDriver:      getEnv("DB_DRIVER", "postgres"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "postgres"),
		DBPassword:    getEnv("DB_PASSWORD", "0616"),
		DBName:        getEnv("DB_NAME", "football-app"),

		JWTSecret:     getEnv("JWT_SECRET", "secret-key"),
		JWTExp:        getEnv("JWT_EXPIRATION", "24h"),

		CORSOrigins:   getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),

		UploadPath:    getEnv("UPLOAD_PATH", "./uploads"),
		MaxUploadSize: 10 * 1024 * 1024, 
	}
}

func getEnv(key, defaultValue string) string{
	if value := os.Getenv(key); value !=""{
		return value
	}
	return defaultValue
}
