package main

import (
	"fmt"
	"log"

	"agri-sync-backend/internal/config"
	"agri-sync-backend/internal/database"
	"agri-sync-backend/internal/server"
)

func main() {
	// router := server.SetupRouter(db)

	// log.Println("agri-sync-backend API starting on :8080")
	// if err := router.Run(":8080"); err != nil {
	// 	log.Fatalf("Failed to start server: %v", err)
	// }

	cfg := config.LoadConfig()

	// -------------------------
	// 1️⃣ Connect to SQLite
	// -------------------------
	migrationsDir := "./internal/database/migrations"      // folder with your .up.sql / .down.sql files

	db, err := database.ConnectSQLite(cfg.DBPath)
	if err != nil {
		log.Fatalf("DB connection failed: %v", err)
	}
	defer db.Close()

	fmt.Println("Using DB at:", cfg.DBPath)

	// -------------------------
	// 2️⃣ Run migrations
	// -------------------------
	if err := database.RunMigrations(db, migrationsDir); err != nil {
		log.Fatalf("Migrations failed: %v", err)
	}

	// -------------------------
	// 3️⃣ Placeholder: Initialize repositories & services
	// -------------------------
	// Example:
	// farmerRepo := repository.NewFarmerRepository(db)
	// collectorRepo := repository.NewCollectorRepository(db)
	// collectionRepo := repository.NewCollectionRepository(db)
	//
	// farmerService := service.NewFarmerService(farmerRepo)
	// ...
	// TODO: wire handlers and HTTP server here

	log.Println("✅ Database ready, services can be initialized here")

	router := server.SetupRouter(db)

	log.Println("AgriSync API starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}