package handlers

import (
	"net/http"
	// "time"
	"agri-sync-backend/internal/models"
	"agri-sync-backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type CreateTransactionRequest struct {
	FarmerID  string  `json:"farmerId" binding:"required"`
	Crop      string  `json:"crop" binding:"required"`
	WeightKg  float64 `json:"weightKg" binding:"required,gt=0"`
	UnitPrice float64 `json:"unitPrice" binding:"required,gt=0"`
}

func CreateTransaction(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "collector" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only collectors and admins can create transactions"})
		return
	}

	collectorID, _ := c.Get("userId") // from JWT

	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := &models.Transaction{
		FarmerID:    req.FarmerID,
		CollectorID: collectorID.(string),
		Crop:        req.Crop,
		WeightKg:    req.WeightKg,
		UnitPrice:   req.UnitPrice,
	}

	if err := repository.GetTransactionRepo().Create(tx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}

	c.JSON(http.StatusCreated, tx)
}

func GetTransaction(c *gin.Context) {
	id := c.Param("id")
	tx, err := repository.GetTransactionRepo().GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// Simple authorization: farmer can only see their own
	role, _ := c.Get("role")
	userID, _ := c.Get("userId")
	if role == "farmer" && tx.FarmerID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this transaction"})
		return
	}

	c.JSON(http.StatusOK, tx)
}

func ListTransactions(c *gin.Context) {
	role, _ := c.Get("role")
	userID, _ := c.Get("userId")

	var transactions []*models.Transaction
	var err error

	if role == "farmer" {
		transactions, err = repository.GetTransactionRepo().ListByFarmer(userID.(string))
	} else {
		// collectors & admins see all (for demo simplicity)
		transactions, err = repository.GetTransactionRepo().ListAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": transactions})
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=verified paid"`
}

func UpdateTransactionStatus(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can update transaction status"})
		return
	}

	id := c.Param("id")
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := repository.GetTransactionRepo().UpdateStatus(id, models.TransactionStatus(req.Status))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated", "transactionId": id})
}