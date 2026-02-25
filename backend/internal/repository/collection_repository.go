package repository

import (
	"database/sql"
	"errors"
	"time"

	"agri-sync-backend/internal/models"
)

type CollectionRepository struct {
	db *sql.DB
}

func NewCollectionRepository(db *sql.DB) *CollectionRepository {
	return &CollectionRepository{db: db}
}

// ── Your original CREATE ──
func (r *CollectionRepository) Create(c *models.Collection) error {
	now := time.Now().UTC()
	c.CreatedAt = now
	c.UpdatedAt = now
	c.Version = 1

	_, err := r.db.Exec(`
		INSERT INTO collections
		(id, farmer_id, collector_id, crop_type, weight_kg, price_per_kg, version, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		c.ID, c.FarmerID, c.CollectorID, c.CropType, c.WeightKg, c.PricePerKg, c.Version,
		c.CreatedAt, c.UpdatedAt,
	)
	return err
}

// ── Your original READ ──
func (r *CollectionRepository) GetByID(id string) (*models.Collection, error) {
	row := r.db.QueryRow(`
		SELECT id, farmer_id, collector_id, crop_type, weight_kg, price_per_kg,
		       version, created_at, updated_at
		FROM collections WHERE id = $1`, id)

	var c models.Collection
	var createdAt, updatedAt time.Time

	err := row.Scan(&c.ID, &c.FarmerID, &c.CollectorID, &c.CropType, &c.WeightKg, &c.PricePerKg,
		&c.Version, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("collection not found")
		}
		return nil, err
	}

	c.CreatedAt = createdAt
	c.UpdatedAt = updatedAt
	return &c, nil
}

// ── Your original UPDATE ──
func (r *CollectionRepository) Update(c *models.Collection) error {
	c.Version++
	c.UpdatedAt = time.Now().UTC()

	_, err := r.db.Exec(`
		UPDATE collections
		SET farmer_id = $1, collector_id = $2, crop_type = $3, weight_kg = $4, price_per_kg = $5, version = $6, updated_at = $7
		WHERE id = $8`,
		c.FarmerID, c.CollectorID, c.CropType, c.WeightKg, c.PricePerKg, c.Version,
		c.UpdatedAt, c.ID,
	)
	return err
}

// ── Your original DELETE ──
func (r *CollectionRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM collections WHERE id = $1`, id)
	return err
}

// ── Added helpers (needed for endpoints) ──

func (r *CollectionRepository) ListByFarmer(farmerID string) ([]*models.Collection, error) {
	rows, err := r.db.Query(`
		SELECT id, farmer_id, collector_id, crop_type, weight_kg, price_per_kg,
		       version, created_at, updated_at
		FROM collections WHERE farmer_id = $1
		ORDER BY created_at DESC`, farmerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Collection
	for rows.Next() {
		var c models.Collection
		var createdAt, updatedAt time.Time
		err := rows.Scan(&c.ID, &c.FarmerID, &c.CollectorID, &c.CropType, &c.WeightKg, &c.PricePerKg,
			&c.Version, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}
		c.CreatedAt = createdAt
		c.UpdatedAt = updatedAt
		list = append(list, &c)
	}
	return list, rows.Err()
}

func (r *CollectionRepository) ListAll() ([]*models.Collection, error) {
	rows, err := r.db.Query(`
		SELECT id, farmer_id, collector_id, crop_type, weight_kg, price_per_kg,
		       version, created_at, updated_at
		FROM collections
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Collection
	for rows.Next() {
		var c models.Collection
		var createdAt, updatedAt time.Time
		err := rows.Scan(&c.ID, &c.FarmerID, &c.CollectorID, &c.CropType, &c.WeightKg, &c.PricePerKg,
			&c.Version, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}
		c.CreatedAt = createdAt
		c.UpdatedAt = updatedAt
		list = append(list, &c)
	}
	return list, rows.Err()
}

func (r *CollectionRepository) UpdateStatus(id string, status models.TransactionStatus) error {
	_, err := r.db.Exec(`
		UPDATE collections
		SET status = $1, updated_at = NOW()
		WHERE id = $2`,
		status, id,
	)
	return err
}