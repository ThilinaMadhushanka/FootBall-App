package api

import (
	"errors"
	"football-app-backend/internal/core/domain"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ContractHandler struct{ db *gorm.DB }

func NewContractHandler(db *gorm.DB) *ContractHandler { return &ContractHandler{db: db} }
func (h *ContractHandler) notify(userID uint, userType, title, message string) {
	h.db.Create(&domain.Notification{UserID: userID, UserType: userType, Type: "contract", Title: title, Message: message, Link: "/home"})
}

type offerTerms struct {
	PlayerID        uint    `json:"player_id"`
	SeasonID        uint    `json:"season_id"`
	TransferFee     float64 `json:"transfer_fee"`
	SalaryPerSeason float64 `json:"salary_per_season"`
	SigningBonus    float64 `json:"signing_bonus"`
	ContractMonths  int     `json:"contract_months"`
	ExpiryDays      int     `json:"expiry_days"`
	Message         string  `json:"message"`
}

func validateTerms(terms offerTerms) string {
	if terms.TransferFee < 0 || terms.SalaryPerSeason <= 0 || terms.SigningBonus < 0 {
		return "Offer amounts are invalid"
	}
	if terms.ContractMonths < 6 || terms.ContractMonths > 60 {
		return "Contract must be between 6 and 60 months"
	}
	return ""
}

func (h *ContractHandler) Create(c *gin.Context) {
	managerID, userType, ok := requestUser(c)
	if !ok || userType != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Manager access required"})
		return
	}
	var terms offerTerms
	if c.ShouldBindJSON(&terms) != nil || terms.PlayerID == 0 || terms.SeasonID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Player and season are required"})
		return
	}
	if message := validateTerms(terms); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": message})
		return
	}
	var team domain.Team
	if h.db.Where("manager_id = ?", managerID).First(&team).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Managed team not found"})
		return
	}
	var player domain.Player
	if h.db.First(&player, terms.PlayerID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
		return
	}
	if player.CurrentTeamID != nil && *player.CurrentTeamID == team.ID {
		c.JSON(http.StatusConflict, gin.H{"error": "Player is already in your team"})
		return
	}
	if !player.IsAvailable {
		c.JSON(http.StatusConflict, gin.H{"error": "Player is not accepting offers"})
		return
	}
	var registration domain.CompetitionTeam
	if h.db.Where("season_id = ? AND team_id = ?", terms.SeasonID, team.ID).First(&registration).Error != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Your team is not registered in this season"})
		return
	}
	var reservedTransfer, reservedSalary float64
	h.db.Model(&domain.ContractOffer{}).Where("season_id = ? AND from_team_id = ? AND status IN ?", terms.SeasonID, team.ID, []string{"pending_player", "pending_manager"}).Select("COALESCE(SUM(transfer_fee + signing_bonus),0)").Scan(&reservedTransfer)
	h.db.Model(&domain.ContractOffer{}).Where("season_id = ? AND from_team_id = ? AND status IN ?", terms.SeasonID, team.ID, []string{"pending_player", "pending_manager"}).Select("COALESCE(SUM(salary_per_season),0)").Scan(&reservedSalary)
	if terms.TransferFee+terms.SigningBonus > registration.RemainingTransferBudget-reservedTransfer {
		c.JSON(http.StatusConflict, gin.H{"error": "Insufficient available transfer budget after pending offers"})
		return
	}
	if terms.SalaryPerSeason > registration.RemainingSalaryBudget-reservedSalary {
		c.JSON(http.StatusConflict, gin.H{"error": "Insufficient available salary budget after pending offers"})
		return
	}
	expiryDays := terms.ExpiryDays
	if expiryDays < 1 || expiryDays > 30 {
		expiryDays = 7
	}
	offer := domain.ContractOffer{PlayerID: player.ID, FromTeamID: team.ID, CurrentTeamID: player.CurrentTeamID, SeasonID: terms.SeasonID, TransferFee: terms.TransferFee, SalaryPerSeason: terms.SalaryPerSeason, SigningBonus: terms.SigningBonus, ContractMonths: terms.ContractMonths, Status: "pending_player", CreatedByRole: "manager", Message: terms.Message, ExpiresAt: time.Now().AddDate(0, 0, expiryDays)}
	if err := h.db.Create(&offer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create offer"})
		return
	}
	h.notify(player.ID, "player", "New contract offer", team.Name+" sent you a contract offer")
	c.JSON(http.StatusCreated, offer)
}

func (h *ContractHandler) List(c *gin.Context) {
	userID, userType, ok := requestUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	query := h.db.Preload("Player").Preload("FromTeam").Preload("CurrentTeam").Preload("Season.Competition").Order("created_at desc")
	if userType == "player" {
		query = query.Where("player_id = ?", userID)
	} else if userType == "manager" {
		query = query.Joins("JOIN teams owner_team ON owner_team.id = contract_offers.from_team_id").Where("owner_team.manager_id = ?", userID)
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "Contract access is limited to managers and players"})
		return
	}
	var offers []domain.ContractOffer
	if err := query.Find(&offers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not load offers"})
		return
	}
	for index := range offers {
		if (offers[index].Status == "pending_player" || offers[index].Status == "pending_manager") && offers[index].ExpiresAt.Before(time.Now()) {
			h.db.Model(&offers[index]).Update("status", "expired")
			offers[index].Status = "expired"
		}
	}
	c.JSON(http.StatusOK, offers)
}

func (h *ContractHandler) MyBudget(c *gin.Context) {
	managerID, userType, _ := requestUser(c)
	if userType != "manager" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Manager access required"})
		return
	}
	var team domain.Team
	if h.db.Where("manager_id = ?", managerID).First(&team).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Managed team not found"})
		return
	}
	var registration domain.CompetitionTeam
	if h.db.Preload("Season.Competition").Where("season_id = ? AND team_id = ?", c.Param("season_id"), team.ID).First(&registration).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team is not registered in this season"})
		return
	}
	var reservedTransfer, reservedSalary float64
	statuses := []string{"pending_player", "pending_manager"}
	h.db.Model(&domain.ContractOffer{}).Where("season_id = ? AND from_team_id = ? AND status IN ?", registration.SeasonID, team.ID, statuses).Select("COALESCE(SUM(transfer_fee + signing_bonus),0)").Scan(&reservedTransfer)
	h.db.Model(&domain.ContractOffer{}).Where("season_id = ? AND from_team_id = ? AND status IN ?", registration.SeasonID, team.ID, statuses).Select("COALESCE(SUM(salary_per_season),0)").Scan(&reservedSalary)
	c.JSON(http.StatusOK, gin.H{"registration": registration, "reserved_transfer_budget": reservedTransfer, "reserved_salary_budget": reservedSalary, "available_transfer_budget": registration.RemainingTransferBudget - reservedTransfer, "available_salary_budget": registration.RemainingSalaryBudget - reservedSalary})
}

type offerAction struct {
	Action          string  `json:"action"`
	TransferFee     float64 `json:"transfer_fee"`
	SalaryPerSeason float64 `json:"salary_per_season"`
	SigningBonus    float64 `json:"signing_bonus"`
	ContractMonths  int     `json:"contract_months"`
	ExpiryDays      int     `json:"expiry_days"`
	Message         string  `json:"message"`
}

func (h *ContractHandler) Respond(c *gin.Context) {
	userID, userType, ok := requestUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var action offerAction
	if c.ShouldBindJSON(&action) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}
	var offer domain.ContractOffer
	if h.db.Preload("FromTeam").First(&offer, c.Param("id")).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Offer not found"})
		return
	}
	if offer.ExpiresAt.Before(time.Now()) {
		h.db.Model(&offer).Update("status", "expired")
		c.JSON(http.StatusConflict, gin.H{"error": "Offer has expired"})
		return
	}
	if userType == "player" {
		if offer.PlayerID != userID || offer.Status != "pending_player" {
			c.JSON(http.StatusForbidden, gin.H{"error": "This offer is not awaiting this player"})
			return
		}
	} else if userType == "manager" {
		if offer.FromTeam == nil || offer.FromTeam.ManagerID == nil || *offer.FromTeam.ManagerID != userID || (offer.Status != "pending_manager" && action.Action != "cancel") {
			c.JSON(http.StatusForbidden, gin.H{"error": "This offer is not awaiting this manager"})
			return
		}
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
		return
	}
	switch action.Action {
	case "reject", "cancel":
		status := "rejected"
		if action.Action == "cancel" {
			status = "cancelled"
		}
		h.db.Model(&offer).Update("status", status)
		c.JSON(http.StatusOK, gin.H{"status": status})
	case "counter":
		terms := offerTerms{PlayerID: offer.PlayerID, SeasonID: offer.SeasonID, TransferFee: action.TransferFee, SalaryPerSeason: action.SalaryPerSeason, SigningBonus: action.SigningBonus, ContractMonths: action.ContractMonths, ExpiryDays: action.ExpiryDays, Message: action.Message}
		if message := validateTerms(terms); message != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": message})
			return
		}
		nextStatus := "pending_player"
		previousStatus := "countered_by_manager"
		if userType == "player" {
			nextStatus = "pending_manager"
			previousStatus = "countered_by_player"
		}
		expiryDays := action.ExpiryDays
		if expiryDays < 1 || expiryDays > 30 {
			expiryDays = 7
		}
		child := domain.ContractOffer{ParentOfferID: &offer.ID, PlayerID: offer.PlayerID, FromTeamID: offer.FromTeamID, CurrentTeamID: offer.CurrentTeamID, SeasonID: offer.SeasonID, TransferFee: action.TransferFee, SalaryPerSeason: action.SalaryPerSeason, SigningBonus: action.SigningBonus, ContractMonths: action.ContractMonths, Status: nextStatus, CreatedByRole: userType, Message: action.Message, ExpiresAt: time.Now().AddDate(0, 0, expiryDays)}
		if err := h.db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Model(&offer).Update("status", previousStatus).Error; err != nil {
				return err
			}
			return tx.Create(&child).Error
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not send counter offer"})
			return
		}
		if nextStatus == "pending_player" {
			h.notify(offer.PlayerID, "player", "Revised contract offer", "A manager sent revised contract terms")
		} else if offer.FromTeam != nil && offer.FromTeam.ManagerID != nil {
			h.notify(*offer.FromTeam.ManagerID, "manager", "Player counter offer", "A player suggested new contract terms")
		}
		c.JSON(http.StatusCreated, child)
	case "accept":
		if err := h.acceptOffer(&offer); err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		if userType == "player" && offer.FromTeam != nil && offer.FromTeam.ManagerID != nil {
			h.notify(*offer.FromTeam.ManagerID, "manager", "Contract accepted", "The player accepted your contract offer")
		} else {
			h.notify(offer.PlayerID, "player", "Contract accepted", "Your counter offer was accepted")
		}
		c.JSON(http.StatusOK, gin.H{"status": "accepted"})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Use accept, reject, counter or cancel"})
	}
}

func (h *ContractHandler) acceptOffer(offer *domain.ContractOffer) error {
	return h.db.Transaction(func(tx *gorm.DB) error {
		var player domain.Player
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&player, offer.PlayerID).Error; err != nil {
			return err
		}
		teamChanged := (player.CurrentTeamID == nil) != (offer.CurrentTeamID == nil) || (player.CurrentTeamID != nil && offer.CurrentTeamID != nil && *player.CurrentTeamID != *offer.CurrentTeamID)
		if teamChanged {
			return errors.New("player team changed while this offer was pending")
		}
		var registration domain.CompetitionTeam
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("season_id = ? AND team_id = ?", offer.SeasonID, offer.FromTeamID).First(&registration).Error; err != nil {
			return err
		}
		transferCost := offer.TransferFee + offer.SigningBonus
		if registration.RemainingTransferBudget < transferCost {
			return errors.New("insufficient transfer budget")
		}
		if registration.RemainingSalaryBudget < offer.SalaryPerSeason {
			return errors.New("insufficient salary budget")
		}
		registration.RemainingTransferBudget -= transferCost
		registration.RemainingSalaryBudget -= offer.SalaryPerSeason
		if err := tx.Save(&registration).Error; err != nil {
			return err
		}
		if offer.CurrentTeamID != nil {
			tx.Model(&domain.CompetitionTeam{}).Where("season_id = ? AND team_id = ?", offer.SeasonID, *offer.CurrentTeamID).Update("remaining_transfer_budget", gorm.Expr("remaining_transfer_budget + ?", offer.TransferFee))
		}
		tx.Model(&domain.PlayerContract{}).Where("player_id = ? AND status = ?", offer.PlayerID, "active").Update("status", "completed")
		now := time.Now()
		contract := domain.PlayerContract{PlayerID: offer.PlayerID, TeamID: offer.FromTeamID, SeasonID: offer.SeasonID, AcceptedOfferID: offer.ID, SalaryPerSeason: offer.SalaryPerSeason, SigningBonus: offer.SigningBonus, TransferFee: offer.TransferFee, StartDate: now, EndDate: now.AddDate(0, offer.ContractMonths, 0), Status: "active"}
		if err := tx.Create(&contract).Error; err != nil {
			return err
		}
		if err := tx.Model(&domain.Player{}).Where("id = ?", offer.PlayerID).Updates(map[string]interface{}{"current_team_id": offer.FromTeamID, "salary": offer.SalaryPerSeason, "is_available": false}).Error; err != nil {
			return err
		}
		tx.Model(&domain.ContractOffer{}).Where("player_id = ? AND id <> ? AND status IN ?", offer.PlayerID, offer.ID, []string{"pending_player", "pending_manager"}).Update("status", "cancelled")
		return tx.Model(offer).Update("status", "accepted").Error
	})
}
