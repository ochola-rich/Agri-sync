package database

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3" // SQLite driver
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// ConnectSQLite opens a SQLite database and returns the *sql.DB instance.
func ConnectSQLite(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open SQLite DB: %w", err)
	}

	// Enable foreign key enforcement
	if _, err := db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	return db, nil
}

// RunMigrations runs SQL migrations from the given folder
func RunMigrations(db *sql.DB, migrationsDir string) error {
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migrate driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", filepath.ToSlash(migrationsDir)),
		"sqlite3", driver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("✅ Migrations applied successfully")
	return nil
}

func RunMigrationsDown(db *sql.DB, migrationsDir string) error {
    driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
    if err != nil {
        return fmt.Errorf("failed to create migrate driver: %w", err)
    }

    m, err := migrate.NewWithDatabaseInstance(
        fmt.Sprintf("file://%s", filepath.ToSlash(migrationsDir)),
        "sqlite3", driver)
    if err != nil {
        return fmt.Errorf("failed to create migrate instance: %w", err)
    }

    if err := m.Steps(-1); err != nil && err != migrate.ErrNoChange {
        return fmt.Errorf("migration down failed: %w", err)
    }

    return nil
}

func MigrationStatus(db *sql.DB, migrationsDir string) (version uint, dirty bool, err error) {
    driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
    if err != nil {
        return 0, false, fmt.Errorf("failed to create migrate driver: %w", err)
    }

    m, err := migrate.NewWithDatabaseInstance(
        fmt.Sprintf("file://%s", filepath.ToSlash(migrationsDir)),
        "sqlite3", driver)
    if err != nil {
        return 0, false, fmt.Errorf("failed to create migrate instance: %w", err)
    }

    version, dirty, err = m.Version()
    if err != nil && err != migrate.ErrNilVersion {
        return 0, false, fmt.Errorf("failed to get migration version: %w", err)
    }

    return version, dirty, nil
}