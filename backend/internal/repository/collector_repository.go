package repository

import (
	"database/sql"
	"time"

	"agri-sync-backend/internal/models"
)

type CollectorRepository struct {
	db *sql.DB
}

func NewCollectorRepository(db *sql.DB) *CollectorRepository {
	return &CollectorRepository{db: db}
}

// CREATE
func (r *CollectorRepository) Create(c *models.Collector) error {
	now := time.Now().UTC()
	c.CreatedAt = now
	c.UpdatedAt = now
	c.Version = 1

	_, err := r.db.Exec(`
		INSERT INTO collectors (id, name, phone, password_hash, version, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.Phone, c.PasswordHash, c.Version,
		c.CreatedAt.Format(time.RFC3339), c.UpdatedAt.Format(time.RFC3339),
	)
	return err
}

// READ
func (r *CollectorRepository) GetByID(id string) (*models.Collector, error) {
	row := r.db.QueryRow(`
		SELECT id, name, phone, password_hash, version, created_at, updated_at
		FROM collectors WHERE id = ?`, id)

	var c models.Collector
	var createdAt, updatedAt string
	err := row.Scan(&c.ID, &c.Name, &c.Phone, &c.PasswordHash, &c.Version, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	c.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	c.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	return &c, nil
}

// UPDATE (idempotent)
func (r *CollectorRepository) Update(c *models.Collector) error {
	c.Version++
	c.UpdatedAt = time.Now().UTC()

	_, err := r.db.Exec(`
		UPDATE collectors 
		SET name = ?, phone = ?, version = ?, updated_at = ?
		WHERE id = ?`,
		c.Name, c.Phone, c.Version, c.UpdatedAt.Format(time.RFC3339), c.ID,
	)
	return err
}

// DELETE
func (r *CollectorRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM collectors WHERE id = ?`, id)
	return err
}
