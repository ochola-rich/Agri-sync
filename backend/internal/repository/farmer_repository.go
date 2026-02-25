package repository

import (
	"database/sql"
	"time"
	"errors"
	"agri-sync-backend/internal/models"
	"fmt"
)

type FarmerRepository struct {
	db *sql.DB
}

// Constructor
func NewFarmerRepository(db *sql.DB) *FarmerRepository {
	return &FarmerRepository{db: db}
}

// -------------------------
// CREATE
// -------------------------
func (r *FarmerRepository) Create(f *models.Farmer) error {
	now := time.Now().UTC()
	f.CreatedAt = now
	f.UpdatedAt = now
	f.Version = 1

	_, err := r.db.Exec(`
		INSERT INTO farmers (id, name, phone, password_hash, version, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		f.ID, f.Name, f.Phone, f.PasswordHash, f.Version, f.CreatedAt.Format(time.RFC3339), f.UpdatedAt.Format(time.RFC3339),
	)
	return err
}

// -------------------------
// READ
// -------------------------
func (r *FarmerRepository) GetByID(id string) (*models.Farmer, error) {
	row := r.db.QueryRow(`
		SELECT id, name, phone, password_hash, version, created_at, updated_at
		FROM farmers WHERE id = ?`, id)

	var f models.Farmer
	var createdAt, updatedAt string
	err := row.Scan(&f.ID, &f.Name, &f.Phone, &f.PasswordHash, &f.Version, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	f.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	f.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	return &f, nil
}

// -------------------------
// UPDATE (idempotent with version)
// -------------------------
func (r *FarmerRepository) Update(f *models.Farmer) error {
	// Increment version
	f.Version++
	f.UpdatedAt = time.Now().UTC()

	_, err := r.db.Exec(`
		UPDATE farmers 
		SET name = ?, phone = ?, version = ?, updated_at = ?
		WHERE id = ?`,
		f.Name, f.Phone, f.Version, f.UpdatedAt.Format(time.RFC3339), f.ID,
	)
	return err
}

// -------------------------
// DELETE
// -------------------------
func (r *FarmerRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM farmers WHERE id = ?`, id)
	return err
}


func (r *FarmerRepository) GetByPhone(phone string) (*models.Farmer, error) {
    row := r.db.QueryRow(`
        SELECT id, name, phone, password_hash, version, created_at, updated_at
        FROM farmers WHERE phone = $1`, phone)

    var f models.Farmer
    var createdAtStr, updatedAtStr string   // ← change to string

    err := row.Scan(
        &f.ID,
        &f.Name,
        &f.Phone,
        &f.PasswordHash,
        &f.Version,
        &createdAtStr,   // ← scan as string
        &updatedAtStr,
    )
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, errors.New("farmer not found")
        }
        return nil, err
    }

    // Manually parse the strings to time.Time
    f.CreatedAt, err = time.Parse(time.RFC3339, createdAtStr)
    if err != nil {
        return nil, fmt.Errorf("failed to parse created_at: %w", err)
    }

    f.UpdatedAt, err = time.Parse(time.RFC3339, updatedAtStr)
    if err != nil {
        return nil, fmt.Errorf("failed to parse updated_at: %w", err)
    }

    return &f, nil
}