package handlers

import (
	"net/http"
	"agri-sync-backend/internal/auth"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	UserID string `json:"userId" binding:"required"`
	Role   string `json:"role" binding:"required,oneof=farmer collector admin"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In real app: validate credentials against DB
	// Here: dummy — accept anything
	token, err := auth.GenerateJWT(req.UserID, req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"userId":  req.UserID,
		"role":    req.Role,
		"message": "Login successful (mock)",
	})
}

func GetMe(c *gin.Context) {
	userID, _ := c.Get("userId")
	role, _ := c.Get("role")

	c.JSON(http.StatusOK, gin.H{
		"userId": userID,
		"role":   role,
		"message": "Protected route - you are authenticated",
	})
}