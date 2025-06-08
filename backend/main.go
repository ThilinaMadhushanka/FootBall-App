package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// Database connection
var db *sql.DB

// JWT secret key
var jwtSecret = []byte("your-secret-key-change-this-in-production")

// Structs
type Manager struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	TeamName  string    `json:"team_name"`
	CreatedAt time.Time `json:"created_at"`
}

type Player struct {
	ID              int       `json:"id"`
	Username        string    `json:"username"`
	Email           string    `json:"email"`
	FullName        string    `json:"full_name"`
	Position        string    `json:"position"`
	Age             int       `json:"age"`
	Nationality     string    `json:"nationality"`
	CurrentTeam     string    `json:"current_team"`
	Rating          int       `json:"rating"`
	Price           int       `json:"price"`
	ExperienceYears int       `json:"experience_years"`
	HeightCm        int       `json:"height_cm"`
	WeightKg        int       `json:"weight_kg"`
	PreferredFoot   string    `json:"preferred_foot"`
	Bio             string    `json:"bio"`
	ProfileImageURL string    `json:"profile_image_url"`
	IsAvailable     bool      `json:"is_available"`
	GamesPlayed     int       `json:"games_played"`
	Goals           int       `json:"goals"`
	Assists         int       `json:"assists"`
	YellowCards     int       `json:"yellow_cards"`
	RedCards        int       `json:"red_cards"`
	CleanSheets     int       `json:"clean_sheets"`
	CreatedAt       time.Time `json:"created_at"`
}

type Match struct {
	ID        int       `json:"id"`
	Team1     string    `json:"team1"`
	Team2     string    `json:"team2"`
	MatchDate string    `json:"match_date"`
	MatchTime string    `json:"match_time"`
	Venue     string    `json:"venue"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterManagerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	TeamName string `json:"team_name"`
}

type RegisterPlayerRequest struct {
	Username        string `json:"username"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	FullName        string `json:"full_name"`
	Position        string `json:"position"`
	Age             int    `json:"age"`
	Nationality     string `json:"nationality"`
	CurrentTeam     string `json:"current_team"`
	ExperienceYears int    `json:"experience_years"`
	HeightCm        int    `json:"height_cm"`
	WeightKg        int    `json:"weight_kg"`
	PreferredFoot   string `json:"preferred_foot"`
	Bio             string `json:"bio"`
}

type Claims struct {
	UserID   int    `json:"user_id"`
	UserType string `json:"user_type"` // "manager" or "player"
	Username string `json:"username"`
	jwt.StandardClaims
}

// New structs for enhanced functionality
type MatchEvent struct {
	ID          int       `json:"id"`
	MatchID     int       `json:"match_id"`
	EventType   string    `json:"event_type"`
	PlayerID    int       `json:"player_id"`
	Team        string    `json:"team"`
	Minute      int       `json:"minute"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type PlayerStats struct {
	PlayerID      int       `json:"player_id"`
	GamesPlayed   int       `json:"games_played"`
	Goals         int       `json:"goals"`
	Assists       int       `json:"assists"`
	YellowCards   int       `json:"yellow_cards"`
	RedCards      int       `json:"red_cards"`
	CleanSheets   int       `json:"clean_sheets"`
	MinutesPlayed int       `json:"minutes_played"`
	PassAccuracy  float64   `json:"pass_accuracy"`
	ShotsOnTarget int       `json:"shots_on_target"`
	LastUpdated   time.Time `json:"last_updated"`
}

type LeaderboardEntry struct {
	ManagerID      int    `json:"manager_id"`
	TeamName       string `json:"team_name"`
	TotalPoints    int    `json:"total_points"`
	LeagueRank     int    `json:"league_rank"`
	GamesWon       int    `json:"games_won"`
	GamesDrawn     int    `json:"games_drawn"`
	GamesLost      int    `json:"games_lost"`
	GoalsFor       int    `json:"goals_for"`
	GoalsAgainst   int    `json:"goals_against"`
	GoalDifference int    `json:"goal_difference"`
}

// New struct for user settings
type UserSettings struct {
	UserID             int       `json:"user_id"`
	EmailNotifications bool      `json:"email_notifications"`
	MatchReminders     bool      `json:"match_reminders"`
	DarkMode           bool      `json:"dark_mode"`
	Language           string    `json:"language"`
	Timezone           string    `json:"timezone"`
	LastUpdated        time.Time `json:"last_updated"`
}

// Database connection
func initDB() {
	var err error
	connStr := "host=localhost port=5432 user=postgres password=0616 dbname=football-app sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	fmt.Println("Connected to PostgreSQL database")

	// Create tables if not exists
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS managers (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(100) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			full_name VARCHAR(100) NOT NULL,
			team_name VARCHAR(100) DEFAULT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			last_login TIMESTAMP WITH TIME ZONE,
			CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
			CONSTRAINT valid_username CHECK (username ~* '^[a-zA-Z0-9_]{3,50}$'),
			CONSTRAINT valid_full_name CHECK (full_name ~* '^[a-zA-Z\p{L}\s]{2,100}$')
		);

		CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);
		CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
		CREATE INDEX IF NOT EXISTS idx_managers_team_name ON managers(team_name);

		CREATE TABLE IF NOT EXISTS players (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(100) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			full_name VARCHAR(100) NOT NULL,
			position VARCHAR(50) NOT NULL,
			age INT CHECK (age >= 16 AND age <= 45),
			nationality VARCHAR(50) NOT NULL,
			current_team VARCHAR(100) DEFAULT NULL,
			rating INT CHECK (rating >= 0 AND rating <= 100),
			price DECIMAL(10,2) CHECK (price >= 0),
			experience_years INT CHECK (experience_years >= 0),
			height_cm INT CHECK (height_cm >= 150 AND height_cm <= 220),
			weight_kg INT CHECK (weight_kg >= 45 AND weight_kg <= 120),
			preferred_foot VARCHAR(10) CHECK (preferred_foot IN ('left', 'right', 'both')),
			bio TEXT,
			profile_image_url VARCHAR(255),
			is_available BOOLEAN DEFAULT true,
			games_played INT DEFAULT 0 CHECK (games_played >= 0),
			goals INT DEFAULT 0 CHECK (goals >= 0),
			assists INT DEFAULT 0 CHECK (assists >= 0),
			yellow_cards INT DEFAULT 0 CHECK (yellow_cards >= 0),
			red_cards INT DEFAULT 0 CHECK (red_cards >= 0),
			clean_sheets INT DEFAULT 0 CHECK (clean_sheets >= 0),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			last_login TIMESTAMP WITH TIME ZONE,
			CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
			CONSTRAINT valid_username CHECK (username ~* '^[a-zA-Z0-9_]{3,50}$'),
			CONSTRAINT valid_full_name CHECK (full_name ~* '^[a-zA-Z\p{L}\s]{2,100}$'),
			CONSTRAINT valid_position CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker')),
			CONSTRAINT valid_nationality CHECK (nationality ~* '^[a-zA-Z\s]{2,50}$')
		);

		CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
		CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
		CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
		CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating);
		CREATE INDEX IF NOT EXISTS idx_players_is_available ON players(is_available);

		CREATE TABLE IF NOT EXISTS matches (
			id SERIAL PRIMARY KEY,
			team1 VARCHAR(100) NOT NULL,
			team2 VARCHAR(100) NOT NULL,
			match_date DATE NOT NULL,
			match_time TIME NOT NULL,
			venue VARCHAR(100) NOT NULL,
			status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
			score_team1 INT DEFAULT 0 CHECK (score_team1 >= 0),
			score_team2 INT DEFAULT 0 CHECK (score_team2 >= 0),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT valid_teams CHECK (team1 != team2),
			CONSTRAINT valid_match_date CHECK (match_date >= CURRENT_DATE)
		);

		CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
		CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

		CREATE TABLE IF NOT EXISTS match_events (
			id SERIAL PRIMARY KEY,
			match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
			event_type VARCHAR(50) NOT NULL,
			player_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
			team VARCHAR(100) NOT NULL,
			minute INT CHECK (minute >= 1 AND minute <= 120),
			description TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT valid_event_type CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'injury', 'other'))
		);

		CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
		CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);

		CREATE TABLE IF NOT EXISTS player_stats (
			player_id INT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
			games_played INT DEFAULT 0 CHECK (games_played >= 0),
			goals INT DEFAULT 0 CHECK (goals >= 0),
			assists INT DEFAULT 0 CHECK (assists >= 0),
			yellow_cards INT DEFAULT 0 CHECK (yellow_cards >= 0),
			red_cards INT DEFAULT 0 CHECK (red_cards >= 0),
			clean_sheets INT DEFAULT 0 CHECK (clean_sheets >= 0),
			minutes_played INT DEFAULT 0 CHECK (minutes_played >= 0),
			pass_accuracy DECIMAL(5,2) CHECK (pass_accuracy >= 0 AND pass_accuracy <= 100),
			shots_on_target INT DEFAULT 0 CHECK (shots_on_target >= 0),
			last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS leaderboard (
			manager_id INT PRIMARY KEY REFERENCES managers(id) ON DELETE CASCADE,
			team_name VARCHAR(100) NOT NULL,
			total_points INT DEFAULT 0 CHECK (total_points >= 0),
			league_rank INT CHECK (league_rank > 0),
			games_won INT DEFAULT 0 CHECK (games_won >= 0),
			games_drawn INT DEFAULT 0 CHECK (games_drawn >= 0),
			games_lost INT DEFAULT 0 CHECK (games_lost >= 0),
			goals_for INT DEFAULT 0 CHECK (goals_for >= 0),
			goals_against INT DEFAULT 0 CHECK (goals_against >= 0),
			goal_difference INT DEFAULT 0,
			last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT valid_goal_difference CHECK (goal_difference = goals_for - goals_against)
		);

		CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC);
		CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(league_rank);

		CREATE TABLE IF NOT EXISTS user_settings (
			user_id INT PRIMARY KEY,
			user_type VARCHAR(10) CHECK (user_type IN ('manager', 'player')),
			email_notifications BOOLEAN DEFAULT true,
			match_reminders BOOLEAN DEFAULT true,
			dark_mode BOOLEAN DEFAULT false,
			language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de')),
			timezone VARCHAR(50) DEFAULT 'UTC',
			last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT valid_timezone CHECK (timezone ~* '^[A-Za-z0-9/_-]+$')
		);

		CREATE TABLE IF NOT EXISTS team_players (
			team_id INT REFERENCES managers(id) ON DELETE CASCADE,
			player_id INT REFERENCES players(id) ON DELETE CASCADE,
			position VARCHAR(50) NOT NULL,
			joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (team_id, player_id),
			CONSTRAINT valid_position CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker'))
		);

		CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
		CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);
	`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatalf("Error creating tables: %v", err)
	}

	fmt.Println("Database tables checked/created successfully")

	// Seed initial data if tables are empty (example for managers)
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM managers").Scan(&count)
	if count == 0 {
		fmt.Println("Seeding initial manager data...")
		hashedPassword, _ := hashPassword("managerpass")
		_, err = db.Exec(`
			INSERT INTO managers (username, email, password_hash, full_name, team_name) 
			VALUES ($1, $2, $3, $4, $5)`,
			"testmanager", "manager@example.com", hashedPassword, "Test Manager", "Dream Team")
		if err != nil {
			log.Printf("Error seeding manager data: %v", err)
		}
	}

	// Seed initial data for players
	_ = db.QueryRow("SELECT COUNT(*) FROM players").Scan(&count)
	if count == 0 {
		fmt.Println("Seeding initial player data...")
		playersToSeed := []Player{
			{Username: "alex_t", Email: "alex.t@example.com", FullName: "Alex Thompson", Position: "Forward", Age: 25, Nationality: "England", CurrentTeam: "FC London", Rating: 85, Price: 1500000, ExperienceYears: 5, HeightCm: 180, WeightKg: 75, PreferredFoot: "Right", Bio: "Prolific goal scorer.", ProfileImageURL: "https://via.placeholder.com/80/80?text=AT"},
			{Username: "maria_g", Email: "maria.g@example.com", FullName: "Maria Garcia", Position: "Midfielder", Age: 28, Nationality: "Spain", CurrentTeam: "Real Madrid", Rating: 88, Price: 2000000, ExperienceYears: 7, HeightCm: 165, WeightKg: 60, PreferredFoot: "Both", Bio: "Creative playmaker.", ProfileImageURL: "https://via.placeholder.com/80/80?text=MG"},
			{Username: "david_k", Email: "david.k@example.com", FullName: "David Kim", Position: "Defender", Age: 22, Nationality: "South Korea", CurrentTeam: "Seoul FC", Rating: 82, Price: 1200000, ExperienceYears: 3, HeightCm: 185, WeightKg: 80, PreferredFoot: "Left", Bio: "Solid defender.", ProfileImageURL: "https://via.placeholder.com/80/80?text=DK"},
			{Username: "emily_w", Email: "emily.w@example.com", FullName: "Emily Wong", Position: "Goalkeeper", Age: 30, Nationality: "Canada", CurrentTeam: "Toronto FC", Rating: 90, Price: 2500000, ExperienceYears: 10, HeightCm: 178, WeightKg: 70, PreferredFoot: "Right", Bio: "Exceptional shot-stopper.", ProfileImageURL: "https://via.placeholder.com/80/80?text=EW"},
			{Username: "robert_c", Email: "robert.c@example.com", FullName: "Robert Chen", Position: "Forward", Age: 26, Nationality: "China", CurrentTeam: "Beijing Guoan", Rating: 80, Price: 1000000, ExperienceYears: 4, HeightCm: 175, WeightKg: 70, PreferredFoot: "Right", Bio: "Fast and agile.", ProfileImageURL: "https://via.placeholder.com/80/80?text=RC"},
			{Username: "david_s", Email: "david.s@example.com", FullName: "David Silva", Position: "Midfielder", Age: 34, Nationality: "Spain", CurrentTeam: "Real Betis", Rating: 87, Price: 1800000, ExperienceYears: 12, HeightCm: 170, WeightKg: 68, PreferredFoot: "Left", Bio: "Veteran midfielder with excellent vision.", ProfileImageURL: "https://via.placeholder.com/80/80?text=DS", IsAvailable: false},
			{Username: "luka_m", Email: "luka.m@example.com", FullName: "Luka Modric", Position: "Midfielder", Age: 37, Nationality: "Croatia", CurrentTeam: "Real Madrid", Rating: 92, Price: 3000000, ExperienceYears: 15, HeightCm: 172, WeightKg: 66, PreferredFoot: "Right", Bio: "World-class midfielder with incredible passing range.", ProfileImageURL: "https://via.placeholder.com/80/80?text=LM"},
			{Username: "virgil_v", Email: "virgil.v@example.com", FullName: "Virgil van Dijk", Position: "Defender", Age: 31, Nationality: "Netherlands", CurrentTeam: "Liverpool", Rating: 91, Price: 2800000, ExperienceYears: 10, HeightCm: 193, WeightKg: 92, PreferredFoot: "Right", Bio: "Dominant center-back, aerial threat.", ProfileImageURL: "https://via.placeholder.com/80/80?text=VV"},
			{Username: "kylian_m", Email: "kylian.m@example.com", FullName: "Kylian Mbappé", Position: "Forward", Age: 24, Nationality: "France", CurrentTeam: "PSG", Rating: 95, Price: 5000000, ExperienceYears: 6, HeightCm: 178, WeightKg: 73, PreferredFoot: "Right", Bio: "One of the fastest and most skilled forwards.", ProfileImageURL: "https://via.placeholder.com/80/80?text=KM"},
			{Username: "kevin_d", Email: "kevin.d@example.com", FullName: "Kevin De Bruyne", Position: "Midfielder", Age: 31, Nationality: "Belgium", CurrentTeam: "Manchester City", Rating: 93, Price: 4000000, ExperienceYears: 12, HeightCm: 181, WeightKg: 68, PreferredFoot: "Right", Bio: "Master of assists and long-range goals.", ProfileImageURL: "https://via.placeholder.com/80/80?text=KD"},
			{Username: "lionel_m", Email: "lionel.m@example.com", FullName: "Lionel Messi", Position: "Forward", Age: 35, Nationality: "Argentina", CurrentTeam: "Inter Miami CF", Rating: 97, Price: 6000000, ExperienceYears: 19, HeightCm: 170, WeightKg: 67, PreferredFoot: "Left", Bio: "Arguably the greatest player of all time.", ProfileImageURL: "https://via.placeholder.com/80/80?text=LM", IsAvailable: false},
		}

		for _, player := range playersToSeed {
			hashedPassword, _ := hashPassword("playerpass") // Use a generic password for seeding
			var playerID int
			err = db.QueryRow(`
				INSERT INTO players (username, email, password_hash, full_name, position, age, nationality,
					current_team, rating, price, experience_years, height_cm, weight_kg, preferred_foot,
					bio, profile_image_url, is_available)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
				player.Username, player.Email, hashedPassword, player.FullName, player.Position, player.Age,
				player.Nationality, player.CurrentTeam, player.Rating, player.Price, player.ExperienceYears,
				player.HeightCm, player.WeightKg, player.PreferredFoot, player.Bio, player.ProfileImageURL,
				player.IsAvailable).Scan(&playerID)

			if err != nil {
				log.Printf("Error seeding player %s: %v", player.FullName, err)
			} else {
				// Create initial player stats
				_, err = db.Exec(`
					INSERT INTO player_stats (player_id, games_played, goals, assists, yellow_cards, red_cards, clean_sheets) 
					VALUES ($1, 0, 0, 0, 0, 0, 0)`,
					playerID)
				if err != nil {
					log.Printf("Failed to create player stats for %s: %v", player.FullName, err)
				}
			}
		}
	}

	// Seed initial data for matches
	_ = db.QueryRow("SELECT COUNT(*) FROM matches").Scan(&count)
	if count == 0 {
		fmt.Println("Seeding initial match data...")
		matchesToSeed := []Match{
			{Team1: "FC Barcelona", Team2: "Real Madrid", MatchDate: "2024-03-20", MatchTime: "20:00", Venue: "Camp Nou", Status: "scheduled"},
			{Team1: "Manchester Utd", Team2: "Liverpool", MatchDate: "2024-03-21", MatchTime: "19:30", Venue: "Old Trafford", Status: "scheduled"},
			{Team1: "Bayern Munich", Team2: "Borussia Dortmund", MatchDate: "2024-03-22", MatchTime: "18:00", Venue: "Allianz Arena", Status: "scheduled"},
		}

		for _, match := range matchesToSeed {
			_, err = db.Exec(`
				INSERT INTO matches (team1, team2, match_date, match_time, venue, status) 
				VALUES ($1, $2, $3, $4, $5, $6)`,
				match.Team1, match.Team2, match.MatchDate, match.MatchTime, match.Venue, match.Status)
			if err != nil {
				log.Printf("Error seeding match data: %v", err)
			}
		}
	}

	// Seed initial data for leaderboard (example entries)
	_ = db.QueryRow("SELECT COUNT(*) FROM leaderboard").Scan(&count)
	if count == 0 {
		fmt.Println("Seeding initial leaderboard data...")
		// Assuming manager IDs 1, 2, 3, 4, 5 exist from manager seeding or elsewhere
		leadersToSeed := []struct {
			ManagerID   int
			TotalPoints int
			LeagueRank  int
		}{
			{ManagerID: 1, TotalPoints: 587, LeagueRank: 1},
			{ManagerID: 2, TotalPoints: 562, LeagueRank: 2},
			{ManagerID: 3, TotalPoints: 558, LeagueRank: 3},
			{ManagerID: 4, TotalPoints: 543, LeagueRank: 4},
			{ManagerID: 5, TotalPoints: 520, LeagueRank: 5},
		}

		for _, leader := range leadersToSeed {
			_, err = db.Exec(`
				INSERT INTO leaderboard (manager_id, total_points, league_rank) 
				VALUES ($1, $2, $3)`,
				leader.ManagerID, leader.TotalPoints, leader.LeagueRank)
			if err != nil {
				log.Printf("Error seeding leaderboard data: %v", err)
			}
		}
	}
}

// Utility functions
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func generateJWT(userID int, userType, username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   userID,
		UserType: userType,
		Username: username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	return tokenString, err
}

// Middleware
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Remove "Bearer " prefix if present
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add claims to request context or headers for use in handlers
		r.Header.Set("UserID", strconv.Itoa(claims.UserID))
		r.Header.Set("UserType", claims.UserType)
		r.Header.Set("Username", claims.Username)

		next(w, r)
	}
}

// Handlers
func registerManager(w http.ResponseWriter, r *http.Request) {
	var req RegisterManagerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Insert manager into database
	var managerID int
	err = db.QueryRow(`
        INSERT INTO managers (username, email, password_hash, full_name, team_name) 
        VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		req.Username, req.Email, hashedPassword, req.FullName, req.TeamName).Scan(&managerID)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique violation
				http.Error(w, "Username or email already exists", http.StatusConflict)
				return
			}
		}
		http.Error(w, "Failed to register manager", http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := generateJWT(managerID, "manager", req.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Manager registered successfully",
		"token":     token,
		"user_id":   managerID,
		"user_type": "manager",
	})
}

func registerPlayer(w http.ResponseWriter, r *http.Request) {
	var req RegisterPlayerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" || req.Position == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Insert player into database
	var playerID int
	err = db.QueryRow(`
        INSERT INTO players (username, email, password_hash, full_name, position, age, nationality, 
                           current_team, experience_years, height_cm, weight_kg, preferred_foot, bio) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
		req.Username, req.Email, hashedPassword, req.FullName, req.Position, req.Age,
		req.Nationality, req.CurrentTeam, req.ExperienceYears, req.HeightCm, req.WeightKg,
		req.PreferredFoot, req.Bio).Scan(&playerID)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique violation
				http.Error(w, "Username or email already exists", http.StatusConflict)
				return
			}
		}
		http.Error(w, "Failed to register player", http.StatusInternalServerError)
		return
	}

	// Create initial player stats
	_, err = db.Exec(`
        INSERT INTO player_stats (player_id, games_played, goals, assists, yellow_cards, red_cards, clean_sheets) 
        VALUES ($1, 0, 0, 0, 0, 0, 0)`, playerID)

	if err != nil {
		log.Printf("Failed to create player stats: %v", err)
	}

	// Generate JWT token
	token, err := generateJWT(playerID, "player", req.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Player registered successfully",
		"token":     token,
		"user_id":   playerID,
		"user_type": "player",
	})
}

func loginManager(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var manager Manager
	var passwordHash string
	err := db.QueryRow(`
        SELECT id, username, email, full_name, team_name, password_hash, created_at 
        FROM managers WHERE username = $1`, req.Username).Scan(
		&manager.ID, &manager.Username, &manager.Email, &manager.FullName,
		&manager.TeamName, &passwordHash, &manager.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if !checkPasswordHash(req.Password, passwordHash) {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, err := generateJWT(manager.ID, "manager", manager.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Login successful",
		"token":     token,
		"user":      manager,
		"user_type": "manager",
	})
}

func loginPlayer(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var player Player
	var passwordHash string
	err := db.QueryRow(`
        SELECT p.id, p.username, p.email, p.full_name, p.position, p.age, p.nationality, 
               p.current_team, p.rating, p.price, p.experience_years, p.height_cm, p.weight_kg, 
               p.preferred_foot, p.bio, p.profile_image_url, p.is_available, p.created_at, 
               p.password_hash, COALESCE(ps.games_played, 0), COALESCE(ps.goals, 0), 
               COALESCE(ps.assists, 0), COALESCE(ps.yellow_cards, 0), COALESCE(ps.red_cards, 0), 
               COALESCE(ps.clean_sheets, 0)
        FROM players p 
        LEFT JOIN player_stats ps ON p.id = ps.player_id 
        WHERE p.username = $1`, req.Username).Scan(
		&player.ID, &player.Username, &player.Email, &player.FullName, &player.Position,
		&player.Age, &player.Nationality, &player.CurrentTeam, &player.Rating, &player.Price,
		&player.ExperienceYears, &player.HeightCm, &player.WeightKg, &player.PreferredFoot,
		&player.Bio, &player.ProfileImageURL, &player.IsAvailable, &player.CreatedAt,
		&passwordHash, &player.GamesPlayed, &player.Goals, &player.Assists,
		&player.YellowCards, &player.RedCards, &player.CleanSheets)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid username or password", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if !checkPasswordHash(req.Password, passwordHash) {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, err := generateJWT(player.ID, "player", player.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Login successful",
		"token":     token,
		"user":      player,
		"user_type": "player",
	})
}

func getAllPlayers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
        SELECT p.id, p.username, p.email, p.full_name, p.position, p.age, p.nationality, 
               p.current_team, p.rating, p.price, p.experience_years, p.height_cm, p.weight_kg, 
               p.preferred_foot, p.bio, p.profile_image_url, p.is_available, p.created_at,
               COALESCE(ps.games_played, 0), COALESCE(ps.goals, 0), COALESCE(ps.assists, 0), 
               COALESCE(ps.yellow_cards, 0), COALESCE(ps.red_cards, 0), COALESCE(ps.clean_sheets, 0)
        FROM players p 
        LEFT JOIN player_stats ps ON p.id = ps.player_id 
        WHERE p.is_available = true
        ORDER BY p.rating DESC`)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var players []Player
	for rows.Next() {
		var player Player
		err := rows.Scan(
			&player.ID, &player.Username, &player.Email, &player.FullName, &player.Position,
			&player.Age, &player.Nationality, &player.CurrentTeam, &player.Rating, &player.Price,
			&player.ExperienceYears, &player.HeightCm, &player.WeightKg, &player.PreferredFoot,
			&player.Bio, &player.ProfileImageURL, &player.IsAvailable, &player.CreatedAt,
			&player.GamesPlayed, &player.Goals, &player.Assists, &player.YellowCards,
			&player.RedCards, &player.CleanSheets)
		if err != nil {
			http.Error(w, "Error scanning player data", http.StatusInternalServerError)
			return
		}
		players = append(players, player)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(players)
}

func getUpcomingMatches(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
        SELECT id, team1, team2, match_date, match_time, venue, status, created_at 
        FROM matches 
        WHERE match_date >= CURRENT_DATE 
        ORDER BY match_date, match_time`)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var matches []Match
	for rows.Next() {
		var match Match
		var matchDate, matchTime string
		err := rows.Scan(
			&match.ID, &match.Team1, &match.Team2, &matchDate, &matchTime,
			&match.Venue, &match.Status, &match.CreatedAt)
		if err != nil {
			http.Error(w, "Error scanning match data", http.StatusInternalServerError)
			return
		}
		match.MatchDate = matchDate
		match.MatchTime = matchTime
		matches = append(matches, match)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(matches)
}

func getDashboardStats(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("UserID")
	userType := r.Header.Get("UserType")

	if userType != "manager" {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	stats := map[string]interface{}{
		"team_members":      "5/11",
		"remaining_budget":  4500000,
		"league_rank":       23,
		"total_points":      356,
		"total_players":     0,
		"available_players": 0,
	}

	// Get total players count
	var totalPlayers, availablePlayers int
	db.QueryRow("SELECT COUNT(*) FROM players").Scan(&totalPlayers)
	db.QueryRow("SELECT COUNT(*) FROM players WHERE is_available = true").Scan(&availablePlayers)

	stats["total_players"] = totalPlayers
	stats["available_players"] = availablePlayers

	// Get manager's team count
	managerIDInt, _ := strconv.Atoi(userID)
	var teamCount int
	db.QueryRow("SELECT COUNT(*) FROM team_players WHERE team_id = $1", managerIDInt).Scan(&teamCount)
	stats["team_members"] = fmt.Sprintf("%d/11", teamCount)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func addPlayerToTeam(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("UserID")
	userType := r.Header.Get("UserType")

	if userType != "manager" {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}

	var req struct {
		PlayerID int    `json:"player_id"`
		Position string `json:"position"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	managerIDInt, _ := strconv.Atoi(userID)

	_, err := db.Exec(`
        INSERT INTO team_players (team_id, player_id, position) 
        VALUES ($1, $2, $3)
        ON CONFLICT (team_id, player_id) 
        DO UPDATE SET position = $3`,
		managerIDInt, req.PlayerID, req.Position)

	if err != nil {
		http.Error(w, "Failed to add player to team", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Player added to team successfully"})
}

// New API endpoints
func getPlayerStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	playerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid player ID", http.StatusBadRequest)
		return
	}

	var stats PlayerStats
	err = db.QueryRow(`
		SELECT player_id, games_played, goals, assists, yellow_cards, red_cards, 
			   clean_sheets, minutes_played, pass_accuracy, shots_on_target, last_updated
		FROM player_stats 
		WHERE player_id = $1`, playerID).Scan(
		&stats.PlayerID, &stats.GamesPlayed, &stats.Goals, &stats.Assists,
		&stats.YellowCards, &stats.RedCards, &stats.CleanSheets,
		&stats.MinutesPlayed, &stats.PassAccuracy, &stats.ShotsOnTarget,
		&stats.LastUpdated,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Player stats not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func updatePlayerStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	playerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid player ID", http.StatusBadRequest)
		return
	}

	var stats PlayerStats
	if err := json.NewDecoder(r.Body).Decode(&stats); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`
		UPDATE player_stats 
		SET games_played = $1, goals = $2, assists = $3, yellow_cards = $4,
			red_cards = $5, clean_sheets = $6, minutes_played = $7,
			pass_accuracy = $8, shots_on_target = $9, last_updated = CURRENT_TIMESTAMP
		WHERE player_id = $10`,
		stats.GamesPlayed, stats.Goals, stats.Assists, stats.YellowCards,
		stats.RedCards, stats.CleanSheets, stats.MinutesPlayed,
		stats.PassAccuracy, stats.ShotsOnTarget, playerID,
	)

	if err != nil {
		http.Error(w, "Failed to update player stats", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func getMatchEvents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	matchID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid match ID", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
		SELECT id, match_id, event_type, player_id, team, minute, description, created_at
		FROM match_events
		WHERE match_id = $1
		ORDER BY minute ASC`, matchID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []MatchEvent
	for rows.Next() {
		var event MatchEvent
		err := rows.Scan(
			&event.ID, &event.MatchID, &event.EventType, &event.PlayerID,
			&event.Team, &event.Minute, &event.Description, &event.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Error reading match events", http.StatusInternalServerError)
			return
		}
		events = append(events, event)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func addMatchEvent(w http.ResponseWriter, r *http.Request) {
	var event MatchEvent
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := db.QueryRow(`
		INSERT INTO match_events (match_id, event_type, player_id, team, minute, description)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at`,
		event.MatchID, event.EventType, event.PlayerID, event.Team,
		event.Minute, event.Description,
	).Scan(&event.ID, &event.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to add match event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(event)
}

func updateLeaderboard(w http.ResponseWriter, r *http.Request) {
	// Update leaderboard based on match results
	_, err := db.Exec(`
		WITH match_results AS (
			SELECT 
				m.team1, m.team2, m.score_team1, m.score_team2,
				m1.manager_id as team1_manager_id,
				m2.manager_id as team2_manager_id
			FROM matches m
			JOIN managers m1 ON m.team1 = m1.team_name
			JOIN managers m2 ON m.team2 = m2.team_name
			WHERE m.status = 'completed'
		)
		UPDATE leaderboard l
		SET 
			total_points = CASE
				WHEN l.manager_id = mr.team1_manager_id THEN
					CASE
						WHEN mr.score_team1 > mr.score_team2 THEN l.total_points + 3
						WHEN mr.score_team1 = mr.score_team2 THEN l.total_points + 1
						ELSE l.total_points
					END
				WHEN l.manager_id = mr.team2_manager_id THEN
					CASE
						WHEN mr.score_team2 > mr.score_team1 THEN l.total_points + 3
						WHEN mr.score_team2 = mr.score_team1 THEN l.total_points + 1
						ELSE l.total_points
					END
			END,
			games_won = CASE
				WHEN l.manager_id = mr.team1_manager_id AND mr.score_team1 > mr.score_team2 THEN l.games_won + 1
				WHEN l.manager_id = mr.team2_manager_id AND mr.score_team2 > mr.score_team1 THEN l.games_won + 1
				ELSE l.games_won
			END,
			games_drawn = CASE
				WHEN l.manager_id = mr.team1_manager_id AND mr.score_team1 = mr.score_team2 THEN l.games_drawn + 1
				WHEN l.manager_id = mr.team2_manager_id AND mr.score_team2 = mr.score_team1 THEN l.games_drawn + 1
				ELSE l.games_drawn
			END,
			games_lost = CASE
				WHEN l.manager_id = mr.team1_manager_id AND mr.score_team1 < mr.score_team2 THEN l.games_lost + 1
				WHEN l.manager_id = mr.team2_manager_id AND mr.score_team2 < mr.score_team1 THEN l.games_lost + 1
				ELSE l.games_lost
			END,
			goals_for = CASE
				WHEN l.manager_id = mr.team1_manager_id THEN l.goals_for + mr.score_team1
				WHEN l.manager_id = mr.team2_manager_id THEN l.goals_for + mr.score_team2
				ELSE l.goals_for
			END,
			goals_against = CASE
				WHEN l.manager_id = mr.team1_manager_id THEN l.goals_against + mr.score_team2
				WHEN l.manager_id = mr.team2_manager_id THEN l.goals_against + mr.score_team1
				ELSE l.goals_against
			END,
			goal_difference = goals_for - goals_against,
			last_updated = CURRENT_TIMESTAMP
		FROM match_results mr
		WHERE l.manager_id IN (mr.team1_manager_id, mr.team2_manager_id)`)

	if err != nil {
		http.Error(w, "Failed to update leaderboard", http.StatusInternalServerError)
		return
	}

	// Update league ranks
	_, err = db.Exec(`
		WITH ranked_managers AS (
			SELECT 
				manager_id,
				RANK() OVER (ORDER BY total_points DESC, goal_difference DESC, goals_for DESC) as new_rank
			FROM leaderboard
		)
		UPDATE leaderboard l
		SET league_rank = rm.new_rank
		FROM ranked_managers rm
		WHERE l.manager_id = rm.manager_id`)

	if err != nil {
		http.Error(w, "Failed to update league ranks", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func getLeaderboard(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT 
			l.manager_id,
			m.team_name,
			l.total_points,
			l.league_rank,
			l.games_won,
			l.games_drawn,
			l.games_lost,
			l.goals_for,
			l.goals_against,
			l.goal_difference
		FROM leaderboard l
		JOIN managers m ON l.manager_id = m.id
		ORDER BY l.league_rank ASC
	`)
	if err != nil {
		http.Error(w, "Failed to fetch leaderboard", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	for rows.Next() {
		var entry LeaderboardEntry
		err := rows.Scan(
			&entry.ManagerID,
			&entry.TeamName,
			&entry.TotalPoints,
			&entry.LeagueRank,
			&entry.GamesWon,
			&entry.GamesDrawn,
			&entry.GamesLost,
			&entry.GoalsFor,
			&entry.GoalsAgainst,
			&entry.GoalDifference,
		)
		if err != nil {
			http.Error(w, "Error reading leaderboard data", http.StatusInternalServerError)
			return
		}
		entries = append(entries, entry)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

func getUserProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var err error
	if claims.UserType == "manager" {
		var manager Manager
		err = db.QueryRow("SELECT id, username, email, full_name, team_name, created_at FROM managers WHERE id = $1", claims.UserID).
			Scan(&manager.ID, &manager.Username, &manager.Email, &manager.FullName, &manager.TeamName, &manager.CreatedAt)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Manager profile not found", http.StatusNotFound)
			} else {
				http.Error(w, "Failed to fetch manager profile", http.StatusInternalServerError)
			}
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(manager)
	} else if claims.UserType == "player" {
		var player Player
		err = db.QueryRow("SELECT id, username, email, full_name, position, age, nationality, current_team, rating, price, experience_years, height_cm, weight_kg, preferred_foot, bio, profile_image_url, is_available, games_played, goals, assists, yellow_cards, red_cards, clean_sheets, created_at FROM players WHERE id = $1", claims.UserID).
			Scan(&player.ID, &player.Username, &player.Email, &player.FullName, &player.Position, &player.Age, &player.Nationality, &player.CurrentTeam, &player.Rating, &player.Price, &player.ExperienceYears, &player.HeightCm, &player.WeightKg, &player.PreferredFoot, &player.Bio, &player.ProfileImageURL, &player.IsAvailable, &player.GamesPlayed, &player.Goals, &player.Assists, &player.YellowCards, &player.RedCards, &player.CleanSheets, &player.CreatedAt)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Player profile not found", http.StatusNotFound)
			} else {
				http.Error(w, "Failed to fetch player profile", http.StatusInternalServerError)
			}
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(player)
	} else {
		http.Error(w, "Invalid user type", http.StatusBadRequest)
		return
	}
}

// New function to update manager profile
func updateManagerProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*Claims)
	if !ok || claims.UserType != "manager" {
		http.Error(w, "Unauthorized or invalid user type", http.StatusUnauthorized)
		return
	}

	var updatedManager Manager
	if err := json.NewDecoder(r.Body).Decode(&updatedManager); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure manager can only update their own profile
	if updatedManager.ID != 0 && updatedManager.ID != claims.UserID {
		http.Error(w, "Cannot update another manager's profile", http.StatusForbidden)
		return
	}

	// Only update fields that are provided in the request body (non-zero/non-empty values)
	setClauses := []string{}
	args := []interface{}{}
	argCount := 1

	if updatedManager.Username != "" {
		setClauses = append(setClauses, fmt.Sprintf("username = $%d", argCount))
		args = append(args, updatedManager.Username)
		argCount++
	}
	if updatedManager.Email != "" {
		setClauses = append(setClauses, fmt.Sprintf("email = $%d", argCount))
		args = append(args, updatedManager.Email)
		argCount++
	}
	if updatedManager.FullName != "" {
		setClauses = append(setClauses, fmt.Sprintf("full_name = $%d", argCount))
		args = append(args, updatedManager.FullName)
		argCount++
	}
	if updatedManager.TeamName != "" {
		setClauses = append(setClauses, fmt.Sprintf("team_name = $%d", argCount))
		args = append(args, updatedManager.TeamName)
		argCount++
	}

	if len(setClauses) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query := fmt.Sprintf("UPDATE managers SET %s WHERE id = $%d", strings.Join(setClauses, ", "), argCount)
	args = append(args, claims.UserID)

	_, err := db.Exec(query, args...)
	if err != nil {
		log.Printf("Error updating manager profile for user %d: %v", claims.UserID, err)
		http.Error(w, "Failed to update manager profile", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Manager profile updated successfully"})
}

// New function to update player profile
func updatePlayerProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*Claims)
	if !ok || claims.UserType != "player" {
		http.Error(w, "Unauthorized or invalid user type", http.StatusUnauthorized)
		return
	}

	var updatedPlayer Player
	if err := json.NewDecoder(r.Body).Decode(&updatedPlayer); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure player can only update their own profile
	if updatedPlayer.ID != 0 && updatedPlayer.ID != claims.UserID {
		http.Error(w, "Cannot update another player's profile", http.StatusForbidden)
		return
	}

	setClauses := []string{}
	args := []interface{}{}
	argCount := 1

	if updatedPlayer.Username != "" {
		setClauses = append(setClauses, fmt.Sprintf("username = $%d", argCount))
		args = append(args, updatedPlayer.Username)
		argCount++
	}
	if updatedPlayer.Email != "" {
		setClauses = append(setClauses, fmt.Sprintf("email = $%d", argCount))
		args = append(args, updatedPlayer.Email)
		argCount++
	}
	if updatedPlayer.FullName != "" {
		setClauses = append(setClauses, fmt.Sprintf("full_name = $%d", argCount))
		args = append(args, updatedPlayer.FullName)
		argCount++
	}
	if updatedPlayer.Position != "" {
		setClauses = append(setClauses, fmt.Sprintf("position = $%d", argCount))
		args = append(args, updatedPlayer.Position)
		argCount++
	}
	if updatedPlayer.Age != 0 {
		setClauses = append(setClauses, fmt.Sprintf("age = $%d", argCount))
		args = append(args, updatedPlayer.Age)
		argCount++
	}
	if updatedPlayer.Nationality != "" {
		setClauses = append(setClauses, fmt.Sprintf("nationality = $%d", argCount))
		args = append(args, updatedPlayer.Nationality)
		argCount++
	}
	if updatedPlayer.CurrentTeam != "" {
		setClauses = append(setClauses, fmt.Sprintf("current_team = $%d", argCount))
		args = append(args, updatedPlayer.CurrentTeam)
		argCount++
	}
	if updatedPlayer.Rating != 0 {
		setClauses = append(setClauses, fmt.Sprintf("rating = $%d", argCount))
		args = append(args, updatedPlayer.Rating)
		argCount++
	}
	if updatedPlayer.Price != 0 {
		setClauses = append(setClauses, fmt.Sprintf("price = $%d", argCount))
		args = append(args, updatedPlayer.Price)
		argCount++
	}
	if updatedPlayer.ExperienceYears != 0 {
		setClauses = append(setClauses, fmt.Sprintf("experience_years = $%d", argCount))
		args = append(args, updatedPlayer.ExperienceYears)
		argCount++
	}
	if updatedPlayer.HeightCm != 0 {
		setClauses = append(setClauses, fmt.Sprintf("height_cm = $%d", argCount))
		args = append(args, updatedPlayer.HeightCm)
		argCount++
	}
	if updatedPlayer.WeightKg != 0 {
		setClauses = append(setClauses, fmt.Sprintf("weight_kg = $%d", argCount))
		args = append(args, updatedPlayer.WeightKg)
		argCount++
	}
	if updatedPlayer.PreferredFoot != "" {
		setClauses = append(setClauses, fmt.Sprintf("preferred_foot = $%d", argCount))
		args = append(args, updatedPlayer.PreferredFoot)
		argCount++
	}
	if updatedPlayer.Bio != "" {
		setClauses = append(setClauses, fmt.Sprintf("bio = $%d", argCount))
		args = append(args, updatedPlayer.Bio)
		argCount++
	}
	if updatedPlayer.ProfileImageURL != "" {
		setClauses = append(setClauses, fmt.Sprintf("profile_image_url = $%d", argCount))
		args = append(args, updatedPlayer.ProfileImageURL)
		argCount++
	}
	if updatedPlayer.IsAvailable != false {
		setClauses = append(setClauses, fmt.Sprintf("is_available = $%d", argCount))
		args = append(args, updatedPlayer.IsAvailable)
		argCount++
	}
	if updatedPlayer.GamesPlayed != 0 {
		setClauses = append(setClauses, fmt.Sprintf("games_played = $%d", argCount))
		args = append(args, updatedPlayer.GamesPlayed)
		argCount++
	}
	if updatedPlayer.Goals != 0 {
		setClauses = append(setClauses, fmt.Sprintf("goals = $%d", argCount))
		args = append(args, updatedPlayer.Goals)
		argCount++
	}
	if updatedPlayer.Assists != 0 {
		setClauses = append(setClauses, fmt.Sprintf("assists = $%d", argCount))
		args = append(args, updatedPlayer.Assists)
		argCount++
	}
	if updatedPlayer.YellowCards != 0 {
		setClauses = append(setClauses, fmt.Sprintf("yellow_cards = $%d", argCount))
		args = append(args, updatedPlayer.YellowCards)
		argCount++
	}
	if updatedPlayer.RedCards != 0 {
		setClauses = append(setClauses, fmt.Sprintf("red_cards = $%d", argCount))
		args = append(args, updatedPlayer.RedCards)
		argCount++
	}
	if updatedPlayer.CleanSheets != 0 {
		setClauses = append(setClauses, fmt.Sprintf("clean_sheets = $%d", argCount))
		args = append(args, updatedPlayer.CleanSheets)
		argCount++
	}

	if len(setClauses) == 0 {
		http.Error(w, "No fields to update", http.StatusBadRequest)
		return
	}

	query := fmt.Sprintf("UPDATE players SET %s WHERE id = $%d", strings.Join(setClauses, ", "), argCount)
	args = append(args, claims.UserID)

	_, err := db.Exec(query, args...)
	if err != nil {
		log.Printf("Error updating player profile for user %d: %v", claims.UserID, err)
		http.Error(w, "Failed to update player profile", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Player profile updated successfully"})
}

func getUserSettings(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*Claims)
	if !ok || claims.UserType != "manager" {
		http.Error(w, "Unauthorized or invalid user type", http.StatusUnauthorized)
		return
	}

	var settings UserSettings
	err := db.QueryRow(`SELECT user_id, email_notifications, match_reminders, dark_mode, language, timezone, last_updated FROM user_settings WHERE user_id = $1`, claims.UserID).Scan(
		&settings.UserID, &settings.EmailNotifications, &settings.MatchReminders,
		&settings.DarkMode, &settings.Language, &settings.Timezone, &settings.LastUpdated,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Create default settings if none exist
			settings = UserSettings{
				UserID:             claims.UserID,
				EmailNotifications: true,
				MatchReminders:     true,
				DarkMode:           false,
				Language:           "en",
				Timezone:           "UTC",
				LastUpdated:        time.Now(),
			}
			_, err = db.Exec(`INSERT INTO user_settings (user_id, email_notifications, match_reminders, dark_mode, language, timezone, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				settings.UserID, settings.EmailNotifications, settings.MatchReminders,
				settings.DarkMode, settings.Language, settings.Timezone, settings.LastUpdated,
			)
			if err != nil {
				http.Error(w, "Failed to create default settings", http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "Failed to fetch settings", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

func updateUserSettings(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*Claims)
	if !ok || claims.UserType != "manager" {
		http.Error(w, "Unauthorized or invalid user type", http.StatusUnauthorized)
		return
	}

	var updatedSettings UserSettings
	if err := json.NewDecoder(r.Body).Decode(&updatedSettings); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure the user can only update their own settings
	if updatedSettings.UserID != claims.UserID {
		http.Error(w, "Cannot update another user's settings", http.StatusForbidden)
		return
	}

	_, err := db.Exec(`UPDATE user_settings SET email_notifications = $1, match_reminders = $2, dark_mode = $3, language = $4, timezone = $5, last_updated = $6 WHERE user_id = $7`,
		updatedSettings.EmailNotifications, updatedSettings.MatchReminders,
		updatedSettings.DarkMode, updatedSettings.Language, updatedSettings.Timezone,
		time.Now(), updatedSettings.UserID,
	)

	if err != nil {
		log.Printf("Error updating settings for user %d: %v", claims.UserID, err)
		http.Error(w, "Failed to update settings", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Settings updated successfully"})
}

func main() {
	// Initialize database
	initDB()
	defer db.Close()

	// Create router
	router := mux.NewRouter()

	// Public routes
	router.HandleFunc("/api/register/manager", registerManager).Methods("POST")
	router.HandleFunc("/api/register/player", registerPlayer).Methods("POST")
	router.HandleFunc("/api/login/manager", loginManager).Methods("POST")
	router.HandleFunc("/api/login/player", loginPlayer).Methods("POST")

	// Protected routes
	router.HandleFunc("/api/players", authMiddleware(getAllPlayers)).Methods("GET")
	router.HandleFunc("/api/matches", authMiddleware(getUpcomingMatches)).Methods("GET")
	router.HandleFunc("/api/dashboard/stats", authMiddleware(getDashboardStats)).Methods("GET")
	router.HandleFunc("/api/team/add-player", authMiddleware(addPlayerToTeam)).Methods("POST")

	// Add new routes
	router.HandleFunc("/api/players/{id}/stats", getPlayerStats).Methods("GET")
	router.HandleFunc("/api/players/{id}/stats", updatePlayerStats).Methods("PUT")
	router.HandleFunc("/api/matches/{id}/events", getMatchEvents).Methods("GET")
	router.HandleFunc("/api/matches/events", addMatchEvent).Methods("POST")
	router.HandleFunc("/api/leaderboard/update", updateLeaderboard).Methods("POST")
	router.HandleFunc("/api/leaderboard", getLeaderboard).Methods("GET")
	router.HandleFunc("/api/profile", authMiddleware(getUserProfile)).Methods("GET")
	router.HandleFunc("/api/profile", authMiddleware(updateManagerProfile)).Methods("PUT")
	router.HandleFunc("/api/profile", authMiddleware(updatePlayerProfile)).Methods("PUT")
	router.HandleFunc("/api/settings", authMiddleware(getUserSettings)).Methods("GET")
	router.HandleFunc("/api/settings", authMiddleware(updateUserSettings)).Methods("PUT")

	// CORS middleware
	corsObj := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3000"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		handlers.AllowCredentials(),
	)

	// Start server
	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsObj(router)))
}
