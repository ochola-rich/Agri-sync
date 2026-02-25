package handlers

import (
	"net/http"
	"agri-sync-backend/internal/auth"
	"agri-sync-backend/internal/models"
	"agri-sync-backend/internal/repository"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LoginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=farmer collector admin"`
}

func Login(c *gin.Context, farmerRepo *repository.FarmerRepository, collectorRepo *repository.CollectorRepository) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userID string
	var storedHash string

	switch req.Role {
	case "farmer":
		farmer, lookupErr := farmerRepo.GetByPhone(req.Phone)
		if lookupErr != nil {
			fmt.Printf("Farmer lookup failed for phone %s: %v\n", req.Phone, lookupErr) // debug
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid phone or password"})
			return
		}
		userID = farmer.ID
		storedHash = farmer.PasswordHash

		// NOW print — after assignment
		fmt.Printf("Farmer found - ID: %s, Stored hash (first 20 chars): %s...\n", farmer.ID, storedHash[:min(20, len(storedHash))])
		fmt.Printf("Password check result: %v\n", auth.CheckPassword(req.Password, storedHash))

	case "collector":
		collector, lookupErr := collectorRepo.GetByPhone(req.Phone)
		if lookupErr != nil {
			fmt.Printf("Collector lookup failed for phone %s: %v\n", req.Phone, lookupErr)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid phone or password"})
			return
		}
		userID = collector.ID
		storedHash = collector.PasswordHash

		fmt.Printf("Collector found - ID: %s, Stored hash (first 20 chars): %s...\n", collector.ID, storedHash[:min(20, len(storedHash))])
		fmt.Printf("Password check result: %v\n", auth.CheckPassword(req.Password, storedHash))

	case "admin":
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin login not implemented yet"})
		return

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	if !auth.CheckPassword(req.Password, storedHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid phone or password"})
		return
	}

	token, genErr := auth.GenerateJWT(userID, req.Role)
	if genErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"userId":  userID,
		"role":    req.Role,
		"message": "Login successful",
	})
}

// Helper for safe substring
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
// ── Signup Farmer ──
type CreateFarmerRequest struct {
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

func CreateFarmer(c *gin.Context, repo *repository.FarmerRepository) {
	var req CreateFarmerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, hashErr := auth.HashPassword(req.Password)
	if hashErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	farmer := &models.Farmer{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Phone:        req.Phone,
		PasswordHash: hash,
	}

	if err := repo.Create(farmer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create farmer: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      farmer.ID,
		"name":    farmer.Name,
		"phone":   farmer.Phone,
		"message": "Farmer created successfully",
	})
}

// ── Signup Collector ── (similar)
type CreateCollectorRequest struct {
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

func CreateCollector(c *gin.Context, repo *repository.CollectorRepository) {
	var req CreateCollectorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, hashErr := auth.HashPassword(req.Password)
	if hashErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	collector := &models.Collector{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Phone:        req.Phone,
		PasswordHash: hash,
	}

	if err := repo.Create(collector); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create collector: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      collector.ID,
		"name":    collector.Name,
		"phone":   collector.Phone,
		"message": "Collector created successfully",
	})
}