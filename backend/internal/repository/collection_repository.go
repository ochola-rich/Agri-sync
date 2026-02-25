package repository

import (
	"database/sql"
	"time"

	"agri-sync-backend/internal/models"
)

type CollectionRepository struct {
	db *sql.DB
}

func NewCollectionRepository(db *sql.DB) *CollectionRepository {
	return &CollectionRepository{db: db}
}

// CREATE
func (r *CollectionRepository) Create(c *models.Collection) error {
	now := time.Now().UTC()
	c.CreatedAt = now
	c.UpdatedAt = now
	c.Version = 1

	_, err := r.db.Exec(`
		INSERT INTO collections
		(id, farmer_id, collector_id, crop_type, weight_kg, price_per_kg, version, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		c.ID, c.FarmerID, c.CollectorID, c.CropType, c.WeightKg, c.PricePerKg, c.Version,
		c.CreatedAt.Format(time.RFC3339), c.UpdatedAt.Format(time.RFC3339),
	)
	return err
}

// READ
func (r *CollectionRepository) GetByID(id string) (*models.Collection, error) {
	row := r.db.QueryRow(`
		SELECT id, farmer_id, collector_id, crop_type, weight_kg, price_per_kg,
		       version, created_at, updated_at
		FROM collections WHERE id = ?`, id)

	var c models.Collection
	var createdAt, updatedAt string

	err := row.Scan(&c.ID, &c.FarmerID, &c.CollectorID, &c.CropType, &c.WeightKg, &c.PricePerKg,
		&c.Version, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	c.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	c.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	return &c, nil
}

// UPDATE
func (r *CollectionRepository) Update(c *models.Collection) error {
	c.Version++
	c.UpdatedAt = time.Now().UTC()

	_, err := r.db.Exec(`
		UPDATE collections
		SET farmer_id = ?, collector_id = ?, crop_type = ?, weight_kg = ?, price_per_kg = ?, version = ?, updated_at = ?
		WHERE id = ?`,
		c.FarmerID, c.CollectorID, c.CropType, c.WeightKg, c.PricePerKg, c.Version,
		c.UpdatedAt.Format(time.RFC3339), c.ID,
	)
	return err
}

// DELETE
func (r *CollectionRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM collections WHERE id = ?`, id)
	return err
}
