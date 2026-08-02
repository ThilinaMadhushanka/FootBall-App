package api

import (
	"football-app-backend/internal/core/domain"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CompetitionHandler struct{ db *gorm.DB }

func NewCompetitionHandler(db *gorm.DB) *CompetitionHandler { return &CompetitionHandler{db: db} }

func (h *CompetitionHandler) List(c *gin.Context) {
	var competitions []domain.Competition
	query := h.db.Model(&domain.Competition{}).Distinct("competitions.*")
	userID, userType, _ := requestUser(c)
	if userType == "manager" {
		query = query.Joins("JOIN seasons ON seasons.competition_id = competitions.id JOIN competition_teams ON competition_teams.season_id = seasons.id JOIN teams ON teams.id = competition_teams.team_id").Where("teams.manager_id = ?", userID)
	} else if userType == "player" {
		query = query.Joins("JOIN seasons ON seasons.competition_id = competitions.id JOIN competition_teams ON competition_teams.season_id = seasons.id JOIN players ON players.current_team_id = competition_teams.team_id").Where("players.id = ?", userID)
	}
	if err := query.Preload("Organization").Preload("Seasons", func(db *gorm.DB) *gorm.DB { return db.Order("start_date desc") }).Order("name asc").Find(&competitions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load competitions"})
		return
	}
	c.JSON(http.StatusOK, competitions)
}

func (h *CompetitionHandler) Mine(c *gin.Context) {
	userID, userType, ok := requestUser(c)
	if !ok || userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	var competitions []domain.Competition
	if err := h.db.Preload("Organization").Preload("Seasons").Where("organizer_id = ?", userID).Order("created_at desc").Find(&competitions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load competitions"})
		return
	}
	c.JSON(http.StatusOK, competitions)
}

func (h *CompetitionHandler) Create(c *gin.Context) {
	userID, userType, ok := requestUser(c)
	if !ok || userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	var body struct {
		Name                  string  `json:"name"`
		Code                  string  `json:"code"`
		Type                  string  `json:"type"`
		Region                string  `json:"region"`
		OrganizationName      string  `json:"organization_name"`
		SeasonName            string  `json:"season_name"`
		StartDate             string  `json:"start_date"`
		EndDate               string  `json:"end_date"`
		DefaultTransferBudget float64 `json:"default_transfer_budget"`
		DefaultSalaryBudget   float64 `json:"default_salary_budget"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Name == "" || body.Code == "" || body.SeasonName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, code and season are required"})
		return
	}
	startDate, err1 := time.Parse("2006-01-02", body.StartDate)
	endDate, err2 := time.Parse("2006-01-02", body.EndDate)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid start and end dates are required"})
		return
	}
	err := h.db.Transaction(func(tx *gorm.DB) error {
		orgName := body.OrganizationName
		if orgName == "" {
			orgName = body.Name
		}
		var organization domain.Organization
		if err := tx.Where("name = ?", orgName).FirstOrCreate(&organization, domain.Organization{Name: orgName, Code: body.Code + "-ORG", Region: body.Region}).Error; err != nil {
			return err
		}
		if body.DefaultTransferBudget <= 0 {
			body.DefaultTransferBudget = 500000000
		}
		if body.DefaultSalaryBudget <= 0 {
			body.DefaultSalaryBudget = 200000000
		}
		competition := domain.Competition{OrganizerID: &userID, OrganizationID: organization.ID, Name: body.Name, Code: body.Code, Type: body.Type, Region: body.Region, DefaultTransferBudget: body.DefaultTransferBudget, DefaultSalaryBudget: body.DefaultSalaryBudget}
		if err := tx.Create(&competition).Error; err != nil {
			return err
		}
		return tx.Create(&domain.Season{CompetitionID: competition.ID, Name: body.SeasonName, StartDate: startDate, EndDate: endDate, IsActive: true}).Error
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Competition code or name already exists"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Competition created"})
}

func (h *CompetitionHandler) Delete(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	competitionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid competition"})
		return
	}
	var competition domain.Competition
	if h.db.Where("id = ? AND organizer_id = ?", competitionID, userID).First(&competition).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Competition not found"})
		return
	}
	var seasons []domain.Season
	h.db.Where("competition_id = ?", competition.ID).Find(&seasons)
	err = h.db.Transaction(func(tx *gorm.DB) error {
		for _, season := range seasons {
			tx.Where("season_id = ?", season.ID).Delete(&domain.CompetitionTeam{})
			tx.Where("season_id = ?", season.ID).Delete(&domain.CompetitionPlayerStats{})
		}
		if err := tx.Where("competition_id = ?", competition.ID).Delete(&domain.Season{}).Error; err != nil {
			return err
		}
		return tx.Delete(&competition).Error
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Competition has linked match data"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CompetitionHandler) AddTeam(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	seasonID, err := strconv.Atoi(c.Param("season_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season"})
		return
	}
	var body struct {
		TeamID uint `json:"team_id"`
	}
	if c.ShouldBindJSON(&body) != nil || body.TeamID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Team is required"})
		return
	}
	var season domain.Season
	if h.db.Joins("JOIN competitions ON competitions.id = seasons.competition_id").Where("seasons.id = ? AND competitions.organizer_id = ?", seasonID, userID).First(&season).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Season not found"})
		return
	}
	var competition domain.Competition
	h.db.First(&competition, season.CompetitionID)
	registration := domain.CompetitionTeam{SeasonID: uint(seasonID), TeamID: body.TeamID, TransferBudget: competition.DefaultTransferBudget, RemainingTransferBudget: competition.DefaultTransferBudget, SalaryBudget: competition.DefaultSalaryBudget, RemainingSalaryBudget: competition.DefaultSalaryBudget}
	if err := h.db.Create(&registration).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Team is already in this season"})
		return
	}
	c.JSON(http.StatusCreated, registration)
}

func (h *CompetitionHandler) Registrations(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	seasonID, err := strconv.Atoi(c.Param("season_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season"})
		return
	}
	var season domain.Season
	if h.db.Joins("JOIN competitions ON competitions.id = seasons.competition_id").Where("seasons.id = ? AND competitions.organizer_id = ?", seasonID, userID).First(&season).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Season not found"})
		return
	}
	var registrations []domain.CompetitionTeam
	if h.db.Preload("Team.Manager").Where("season_id = ?", seasonID).Find(&registrations).Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not load budgets"})
		return
	}
	c.JSON(http.StatusOK, registrations)
}

func (h *CompetitionHandler) UpdateBudget(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	seasonID, err1 := strconv.Atoi(c.Param("season_id"))
	teamID, err2 := strconv.Atoi(c.Param("team_id"))
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season or team"})
		return
	}
	var body struct {
		TransferBudget float64 `json:"transfer_budget"`
		SalaryBudget   float64 `json:"salary_budget"`
	}
	if c.ShouldBindJSON(&body) != nil || body.TransferBudget < 0 || body.SalaryBudget < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid budgets are required"})
		return
	}
	var season domain.Season
	if h.db.Joins("JOIN competitions ON competitions.id = seasons.competition_id").Where("seasons.id = ? AND competitions.organizer_id = ?", seasonID, userID).First(&season).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Season not found"})
		return
	}
	var registration domain.CompetitionTeam
	if h.db.Where("season_id = ? AND team_id = ?", seasonID, teamID).First(&registration).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team registration not found"})
		return
	}
	spentTransfer := registration.TransferBudget - registration.RemainingTransferBudget
	spentSalary := registration.SalaryBudget - registration.RemainingSalaryBudget
	if body.TransferBudget < spentTransfer || body.SalaryBudget < spentSalary {
		c.JSON(http.StatusConflict, gin.H{"error": "Budget cannot be lower than the amount already spent"})
		return
	}
	registration.TransferBudget = body.TransferBudget
	registration.RemainingTransferBudget = body.TransferBudget - spentTransfer
	registration.SalaryBudget = body.SalaryBudget
	registration.RemainingSalaryBudget = body.SalaryBudget - spentSalary
	if h.db.Save(&registration).Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update budget"})
		return
	}
	c.JSON(http.StatusOK, registration)
}

func (h *CompetitionHandler) GenerateFixtures(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	seasonID, err := strconv.Atoi(c.Param("season_id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid season"})
		return
	}
	var season domain.Season
	if h.db.Preload("Competition").Joins("JOIN competitions ON competitions.id = seasons.competition_id").Where("seasons.id = ? AND competitions.organizer_id = ?", seasonID, userID).First(&season).Error != nil {
		c.JSON(404, gin.H{"error": "Season not found"})
		return
	}
	var teams []domain.CompetitionTeam
	h.db.Where("season_id = ?", seasonID).Order("team_id").Find(&teams)
	if len(teams) < 2 {
		c.JSON(409, gin.H{"error": "At least two teams are required"})
		return
	}
	var existing int64
	h.db.Model(&domain.Match{}).Where("season_id = ?", seasonID).Count(&existing)
	if existing > 0 {
		c.JSON(409, gin.H{"error": "Fixtures already exist for this season"})
		return
	}
	ids := make([]uint, 0, len(teams))
	for _, team := range teams {
		ids = append(ids, team.TeamID)
	}
	if len(ids)%2 == 1 {
		ids = append(ids, 0)
	}
	rounds := len(ids) - 1
	half := len(ids) / 2
	start := season.StartDate
	created := 0
	err = h.db.Transaction(func(tx *gorm.DB) error {
		for round := 0; round < rounds; round++ {
			for i := 0; i < half; i++ {
				home, away := ids[i], ids[len(ids)-1-i]
				if home == 0 || away == 0 {
					continue
				}
				if round%2 == 1 {
					home, away = away, home
				}
				var homeTeam domain.Team
				tx.First(&homeTeam, home)
				match := domain.Match{CompetitionID: &season.CompetitionID, SeasonID: &season.ID, RoundName: "Round " + strconv.Itoa(round+1), Team1ID: home, Team2ID: away, MatchDate: start.AddDate(0, 0, round*7), MatchTime: "15:00:00", Venue: homeTeam.Stadium, Status: "scheduled"}
				if err := tx.Create(&match).Error; err != nil {
					return err
				}
				created++
			}
			last := ids[len(ids)-1]
			copy(ids[2:], ids[1:len(ids)-1])
			ids[1] = last
		}
		return nil
	})
	if err != nil {
		c.JSON(500, gin.H{"error": "Could not generate fixtures"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"created": created, "format": season.Competition.Type})
}

func (h *CompetitionHandler) RolloverSeason(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(403, gin.H{"error": "Organizer access required"})
		return
	}
	seasonID, err := strconv.Atoi(c.Param("season_id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid season"})
		return
	}
	var current domain.Season
	if h.db.Joins("JOIN competitions ON competitions.id = seasons.competition_id").Where("seasons.id = ? AND competitions.organizer_id = ?", seasonID, userID).First(&current).Error != nil {
		c.JSON(404, gin.H{"error": "Season not found"})
		return
	}
	var body struct {
		Name             string `json:"name"`
		StartDate        string `json:"start_date"`
		EndDate          string `json:"end_date"`
		PromotedTeamIDs  []uint `json:"promoted_team_ids"`
		RelegatedTeamIDs []uint `json:"relegated_team_ids"`
	}
	if c.ShouldBindJSON(&body) != nil || body.Name == "" {
		c.JSON(400, gin.H{"error": "New season details are required"})
		return
	}
	start, e1 := time.Parse("2006-01-02", body.StartDate)
	end, e2 := time.Parse("2006-01-02", body.EndDate)
	if e1 != nil || e2 != nil {
		c.JSON(400, gin.H{"error": "Valid dates are required"})
		return
	}
	var competition domain.Competition
	h.db.First(&competition, current.CompetitionID)
	var old []domain.CompetitionTeam
	h.db.Where("season_id = ?", current.ID).Find(&old)
	relegated := map[uint]bool{}
	for _, id := range body.RelegatedTeamIDs {
		relegated[id] = true
	}
	var next domain.Season
	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&current).Updates(map[string]interface{}{"is_active": false, "is_finalized": true}).Error; err != nil {
			return err
		}
		next = domain.Season{CompetitionID: current.CompetitionID, Name: body.Name, StartDate: start, EndDate: end, IsActive: true, PreviousSeasonID: &current.ID}
		if err := tx.Create(&next).Error; err != nil {
			return err
		}
		ids := map[uint]bool{}
		for _, r := range old {
			if !relegated[r.TeamID] {
				ids[r.TeamID] = true
			}
		}
		for _, id := range body.PromotedTeamIDs {
			ids[id] = true
		}
		for id := range ids {
			r := domain.CompetitionTeam{SeasonID: next.ID, TeamID: id, TransferBudget: competition.DefaultTransferBudget, RemainingTransferBudget: competition.DefaultTransferBudget, SalaryBudget: competition.DefaultSalaryBudget, RemainingSalaryBudget: competition.DefaultSalaryBudget}
			if err := tx.Create(&r).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(409, gin.H{"error": "Could not roll over season"})
		return
	}
	c.JSON(http.StatusCreated, next)
}

func (h *CompetitionHandler) RemoveTeam(c *gin.Context) {
	userID, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	seasonID, err1 := strconv.Atoi(c.Param("season_id"))
	teamID, err2 := strconv.Atoi(c.Param("team_id"))
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season or team"})
		return
	}
	var season domain.Season
	if h.db.Joins("JOIN competitions ON competitions.id = seasons.competition_id").Where("seasons.id = ? AND competitions.organizer_id = ?", seasonID, userID).First(&season).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Season not found"})
		return
	}
	h.db.Where("season_id = ? AND team_id = ?", seasonID, teamID).Delete(&domain.CompetitionTeam{})
	c.Status(http.StatusNoContent)
}

func (h *CompetitionHandler) Teams(c *gin.Context) {
	seasonID, err := strconv.Atoi(c.Param("season_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season"})
		return
	}
	var registrations []domain.CompetitionTeam
	if err := h.db.Preload("Team.Manager").Where("season_id = ?", seasonID).Find(&registrations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load teams"})
		return
	}
	teams := make([]*domain.Team, 0, len(registrations))
	for _, registration := range registrations {
		if registration.Team != nil {
			teams = append(teams, registration.Team)
		}
	}
	c.JSON(http.StatusOK, teams)
}

type standingRow struct {
	TeamID         uint            `json:"team_id"`
	Team           *domain.Team    `json:"team,omitempty"`
	ManagerID      uint            `json:"manager_id"`
	Manager        *domain.Manager `json:"manager,omitempty"`
	LeagueRank     int             `json:"league_rank"`
	TotalPoints    int             `json:"total_points"`
	GamesWon       int             `json:"games_won"`
	GamesDrawn     int             `json:"games_drawn"`
	GamesLost      int             `json:"games_lost"`
	GoalsFor       int             `json:"goals_for"`
	GoalsAgainst   int             `json:"goals_against"`
	GoalDifference int             `json:"goal_difference"`
}

func (h *CompetitionHandler) Standings(c *gin.Context) {
	seasonID, err := strconv.Atoi(c.Param("season_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season"})
		return
	}
	var registrations []domain.CompetitionTeam
	if err := h.db.Preload("Team.Manager").Where("season_id = ?", seasonID).Find(&registrations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load standings"})
		return
	}
	rows := map[uint]*standingRow{}
	for _, registration := range registrations {
		if registration.Team == nil {
			continue
		}
		managerID := uint(0)
		if registration.Team.ManagerID != nil {
			managerID = *registration.Team.ManagerID
		}
		rows[registration.TeamID] = &standingRow{TeamID: registration.TeamID, Team: registration.Team, ManagerID: managerID, Manager: registration.Team.Manager}
	}
	var matches []domain.Match
	if err := h.db.Where("season_id = ? AND status = ?", seasonID, "completed").Find(&matches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate standings"})
		return
	}
	for _, match := range matches {
		home, away := rows[match.Team1ID], rows[match.Team2ID]
		if home == nil || away == nil {
			continue
		}
		home.GoalsFor += match.ScoreTeam1
		home.GoalsAgainst += match.ScoreTeam2
		away.GoalsFor += match.ScoreTeam2
		away.GoalsAgainst += match.ScoreTeam1
		if match.ScoreTeam1 > match.ScoreTeam2 {
			home.GamesWon++
			home.TotalPoints += 3
			away.GamesLost++
		} else if match.ScoreTeam1 < match.ScoreTeam2 {
			away.GamesWon++
			away.TotalPoints += 3
			home.GamesLost++
		} else {
			home.GamesDrawn++
			away.GamesDrawn++
			home.TotalPoints++
			away.TotalPoints++
		}
	}
	result := make([]*standingRow, 0, len(rows))
	for _, row := range rows {
		row.GoalDifference = row.GoalsFor - row.GoalsAgainst
		result = append(result, row)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].TotalPoints != result[j].TotalPoints {
			return result[i].TotalPoints > result[j].TotalPoints
		}
		if result[i].GoalDifference != result[j].GoalDifference {
			return result[i].GoalDifference > result[j].GoalDifference
		}
		return result[i].GoalsFor > result[j].GoalsFor
	})
	for index := range result {
		result[index].LeagueRank = index + 1
	}
	c.JSON(http.StatusOK, result)
}

func (h *CompetitionHandler) PlayerStats(c *gin.Context) {
	seasonID, err1 := strconv.Atoi(c.Param("season_id"))
	playerID, err2 := strconv.Atoi(c.Param("player_id"))
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid season or player"})
		return
	}
	var stats domain.CompetitionPlayerStats
	err := h.db.Where("season_id = ? AND player_id = ?", seasonID, playerID).First(&stats).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusOK, domain.CompetitionPlayerStats{SeasonID: uint(seasonID), PlayerID: uint(playerID)})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load player statistics"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *CompetitionHandler) AvailableTeams(c *gin.Context) {
	var teams []domain.Team
	if err := h.db.Where("manager_id IS NULL").Order("name asc").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load available teams"})
		return
	}
	c.JSON(http.StatusOK, teams)
}

func (h *CompetitionHandler) CreateTeamName(c *gin.Context) {
	_, userType, _ := requestUser(c)
	if userType != "organizer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Organizer access required"})
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if c.ShouldBindJSON(&body) != nil || body.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Team name is required"})
		return
	}
	team := domain.Team{Name: body.Name, Formation: "4-4-2"}
	if err := h.db.Create(&team).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Team name already exists"})
		return
	}
	c.JSON(http.StatusCreated, team)
}
