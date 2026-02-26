package server

import (
	"database/sql"
	"net/http"
	"time"
	"agri-sync-backend/internal/auth"
	"agri-sync-backend/internal/handler"
	"agri-sync-backend/internal/repository"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	r := gin.Default()

	// Custom CORS so browser preflight allows Authorization header
	corsConfig := cors.Config{
		// allow only local dev origin when sending credentials
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// ensure preflight gets a short-circuit response (cors middleware usually handles this,
	// but adding an explicit handler can help if some middleware runs before it)
	r.OPTIONS("/*path", func(c *gin.Context) {
		c.AbortWithStatus(http.StatusNoContent)
	})

	// Repositories
	farmerRepo := repository.NewFarmerRepository(db)
	collectorRepo := repository.NewCollectorRepository(db)
	collectionRepo := repository.NewCollectionRepository(db)

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"version": "0.1.0",
			"db":      "connected",
		})
	})

	// Public signup routes
	r.POST("/farmers", func(c *gin.Context) {
		handlers.CreateFarmer(c, farmerRepo)
	})
	r.POST("/collectors", func(c *gin.Context) {
		handlers.CreateCollector(c, collectorRepo)
	})

	// Auth (now with repos passed)
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", func(c *gin.Context) {
			handlers.Login(c, farmerRepo, collectorRepo)
		})
	}

	// Protected
	protected := r.Group("/")
	protected.Use(auth.JWTAuthMiddleware())
	{
		// protected.GET("/me", handlers.GetMe)

		// Collections
		protected.POST("/collections", func(c *gin.Context) {
			handlers.CreateCollection(c, collectionRepo)
		})
		protected.GET("/collections", func(c *gin.Context) {
			handlers.ListCollections(c, collectionRepo)
		})
		protected.GET("/collections/:id", func(c *gin.Context) {
			handlers.GetCollection(c, collectionRepo)
		})
		protected.PATCH("/collections/:id/status", func(c *gin.Context) {
			handlers.UpdateCollectionStatus(c, collectionRepo)
		})

		// Farmer-specific endpoints
		protected.GET("/farmer/history", func(c *gin.Context) {
			handlers.GetFarmerHistory(c, collectionRepo)
		})
		protected.GET("/farmer/wallet", func(c *gin.Context) {
			handlers.GetFarmerWallet(c, collectionRepo)
		})

		// Profile endpoints
		protected.GET("/farmers/:id", func(c *gin.Context) {
			handlers.GetFarmerProfile(c, farmerRepo)
		})
		protected.GET("/collectors/:id", func(c *gin.Context) {
			handlers.GetCollectorProfile(c, collectorRepo)
		})
	}

	return r
}