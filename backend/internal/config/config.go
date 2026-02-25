package config

import (
	"log"
	"os"
)

type Config struct {
	DBPath string
}

// LoadConfig reads environment variables or sets defaults
func LoadConfig() *Config {
	dbPath := os.Getenv("AGRISYNC_DB_PATH")
	if dbPath == "" {
		log.Println("⚠️ AGRISYNC_DB_PATH not set, using default ./data/agrisync.db")
		dbPath = "./data/agrisync.db"
	}

	return &Config{
		DBPath: dbPath,
	}
}
