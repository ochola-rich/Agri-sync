package handlers

import (
	"net/http"
	// "time"
	"agri-sync-backend/internal/models"
	"agri-sync-backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateCollectionRequest struct {
	FarmerID   string  `json:"farmer_id" binding:"required"`
	CropType   string  `json:"crop_type" binding:"required"`
	WeightKg   float64 `json:"weight_kg" binding:"required,gt=0"`
	PricePerKg float64 `json:"price_per_kg" binding:"required,gt=0"`
}

func CreateCollection(c *gin.Context, repo *repository.CollectionRepository) {
	roleVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "role not found"})
		return
	}
	role := roleVal.(string)

	if role != "collector" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only collectors and admins can create collections"})
		return
	}

	collectorIDVal, _ := c.Get("userId")
	collectorID := collectorIDVal.(string)

	var req CreateCollectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := &models.Collection{
		ID:          uuid.New().String(),
		FarmerID:    req.FarmerID,
		CollectorID: collectorID,
		CropType:    req.CropType,
		WeightKg:    req.WeightKg,
		PricePerKg:  req.PricePerKg,
		Status:      models.StatusPending,
		Verified:    false,
	}

	if err := repo.Create(collection); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create collection: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, collection)
}

func GetCollection(c *gin.Context, repo *repository.CollectionRepository) {
	id := c.Param("id")

	collection, err := repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Collection not found or error: " + err.Error()})
		return
	}

	// Authorization: farmer can only see own
	roleVal, _ := c.Get("role")
	userIDVal, _ := c.Get("userId")
	role := roleVal.(string)
	userID := userIDVal.(string)

	if role == "farmer" && collection.FarmerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this collection"})
		return
	}

	c.JSON(http.StatusOK, collection)
}

func ListCollections(c *gin.Context, repo *repository.CollectionRepository) {
	roleVal, _ := c.Get("role")
	userIDVal, _ := c.Get("userId")
	role := roleVal.(string)
	userID := userIDVal.(string)

	var collections []*models.Collection
	var err error

	if role == "farmer" {
		collections, err = repo.ListByFarmer(userID)
	} else {
		collections, err = repo.ListAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list collections: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"collections": collections,
		"count":       len(collections),
	})
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending verified paid"`
}

func UpdateCollectionStatus(c *gin.Context, repo *repository.CollectionRepository) {
	roleVal, _ := c.Get("role")
	if roleVal != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can update collection status"})
		return
	}

	id := c.Param("id")
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repo.UpdateStatus(id, models.TransactionStatus(req.Status))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated", "id": id})
}