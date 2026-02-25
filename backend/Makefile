# Makefile for AgriSync Backend
# Place this in the backend/ folder

# Path to SQLite DB
# DB_PATH := /home/frawuor/agri/data/agrisync.db

# Default DB path
DB_PATH ?= ./data/agrisync.db
MIGRATIONS_DIR := ./internal/database/migrations

# -----------------------
# Migrate commands
# -----------------------
migrate-up:
	@echo "⬆️ Running migrations..."
	go run cmd/migrate/main.go

migrate-down:
	@echo "⬇️ Rolling back last migration..."
	go run cmd/migrate/main.go -action=down

migrate-status:
	@echo "📋 Migration status:"
	go run cmd/migrate/main.go -action=status

# -----------------------
# Run backend server
# -----------------------
run:
	@echo "🚀 Starting backend..."
	go run cmd/api/main.go

# -----------------------
# Clean (optional)
# -----------------------
clean:
	@echo "🧹 Removing SQLite DB..."
	rm -f $(DB_PATH)