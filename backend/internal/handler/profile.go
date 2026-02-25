package handlers

import (
	"net/http"
	// "agri-sync-backend/internal/models"
	"agri-sync-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

func GetFarmerProfile(c *gin.Context, repo *repository.FarmerRepository) {
	id := c.Param("id")

	// Check if authenticated user is requesting their own profile
	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	userID := userIDVal.(string)

	if id != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only view your own profile"})
		return
	}

	farmer, err := repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Farmer not found or error: " + err.Error()})
		return
	}

	// Return safe profile (exclude password hash)
	profile := map[string]interface{}{
		"id":         farmer.ID,
		"name":       farmer.Name,
		"phone":      farmer.Phone,
		"created_at": farmer.CreatedAt,
		"updated_at": farmer.UpdatedAt,
		"version":    farmer.Version,
	}

	c.JSON(http.StatusOK, gin.H{
		"farmer": profile,
	})
}

func GetCollectorProfile(c *gin.Context, repo *repository.CollectorRepository) {
	id := c.Param("id")

	collector, err := repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collector not found or error: " + err.Error()})
		return
	}

	// Return safe profile (exclude password hash)
	profile := map[string]interface{}{
		"id":         collector.ID,
		"name":       collector.Name,
		"phone":      collector.Phone,
		"created_at": collector.CreatedAt,
		"updated_at": collector.UpdatedAt,
		"version":    collector.Version,
	}

	c.JSON(http.StatusOK, gin.H{
		"collector": profile,
	})
}