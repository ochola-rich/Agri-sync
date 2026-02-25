package handlers

import (
	"net/http"
	"time"
	"agri-sync-backend/internal/models"
	"agri-sync-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type WalletSummary struct {
	TotalPending float64 `json:"total_pending"`
	TotalPaid    float64 `json:"total_paid"`
	TotalOverall float64 `json:"total_overall"`
	Currency     string  `json:"currency"` // hardcoded for now
	UpdatedAt    string  `json:"updated_at"`
}

func GetFarmerHistory(c *gin.Context, repo *repository.CollectionRepository) {
	roleVal, exists := c.Get("role")
	if !exists || roleVal != "farmer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "This endpoint is only available to farmers"})
		return
	}

	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}
	farmerID := userIDVal.(string)

	collections, err := repo.ListByFarmer(farmerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve history: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"farmer_id":    farmerID,
		"collections":  collections,
		"count":        len(collections),
		"retrieved_at": time.Now().UTC().Format(time.RFC3339),
	})
}

func GetFarmerWallet(c *gin.Context, repo *repository.CollectionRepository) {
	roleVal, exists := c.Get("role")
	if !exists || roleVal != "farmer" {
		c.JSON(http.StatusForbidden, gin.H{"error": "This endpoint is only available to farmers"})
		return
	}

	userIDVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}
	farmerID := userIDVal.(string)

	collections, err := repo.ListByFarmer(farmerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate wallet: " + err.Error()})
		return
	}

	var pending, paid float64
	for _, col := range collections {
		value := col.WeightKg * col.PricePerKg
		switch col.Status {
		case models.StatusPending, models.StatusVerified:
			pending += value
		case models.StatusPaid:
			paid += value
		}
	}

	summary := WalletSummary{
		TotalPending: pending,
		TotalPaid:    paid,
		TotalOverall: pending + paid,
		Currency:     "USD", // can be made configurable later
		UpdatedAt:    time.Now().UTC().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, gin.H{
		"farmer_id": farmerID,
		"wallet":    summary,
	})
}