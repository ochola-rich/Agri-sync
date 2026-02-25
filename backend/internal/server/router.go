package server

import (
	"net/http"
	"agri-sync-backend/internal/auth"
	"agri-sync-backend/internal/handler"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Enable CORS so React/PWA on localhost:3000 (or elsewhere) can call us
	r.Use(cors.Default())

	// Public routes
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"version": "0.1.0",
			"service": "agri-sync-backend-api",
		})
	})

	// Auth routes
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", handlers.Login)
	}

	// Protected routes
	protected := r.Group("/")
	
	protected.Use(auth.JWTAuthMiddleware())
	{
		protected.GET("/me", handlers.GetMe)
	}
	// Transactions
	protected.POST("/transactions", handlers.CreateTransaction)
	protected.GET("/transactions", handlers.ListTransactions)
	protected.GET("/transactions/:id", handlers.GetTransaction)
	protected.PATCH("/transactions/:id/status", handlers.UpdateTransactionStatus)

	return r
}