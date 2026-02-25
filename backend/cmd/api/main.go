package main

import (
	"log"
	"agri-sync-backend/internal/server"
)

func main() {
	router := server.SetupRouter()

	log.Println("agri-sync-backend API starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}