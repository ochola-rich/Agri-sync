package main

import (
	"flag"
	"fmt"
	"log"

	"agri-sync-backend/internal/config"
	"agri-sync-backend/internal/database"
)

func main() {
	action := flag.String("action", "up", "migration action: up, down, status")
	flag.Parse()

	cfg := config.LoadConfig()

	db, err := database.ConnectSQLite(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to connect DB: %v", err)
	}

	fmt.Println("Using DB at:", cfg.DBPath)

	switch *action {
	case "up":
		if err := database.RunMigrations(db, "./internal/database/migrations"); err != nil {
			log.Fatalf("Migration up failed: %v", err)
		}
		log.Println("✅ Migrations applied")
	case "down":
		if err := database.RunMigrationsDown(db, "./internal/database/migrations"); err != nil {
			log.Fatalf("Migration down failed: %v", err)
		}
		log.Println("⬇️ Migration rolled back")
	case "status":
		version, dirty, err := database.MigrationStatus(db, "./internal/database/migrations")
		if err != nil {
			log.Fatalf("Migration status failed: %v", err)
		}
		log.Printf("Current version: %d, dirty: %v\n", version, dirty)
	default:
		log.Fatalf("Unknown action: %s", *action)
	}
}
