package models

import "time"

type TransactionStatus string

const (
	StatusPending TransactionStatus = "pending"
	StatusVerified TransactionStatus = "verified"
	StatusPaid TransactionStatus = "paid"
)

type Collection struct {
	ID          string    `json:"id" db:"id"` // UUID generated on client

	FarmerID    string    `json:"farmer_id" db:"farmer_id"`
	CollectorID string    `json:"collector_id" db:"collector_id"`

	CropType    string    `json:"crop_type" db:"crop_type"`   // tea, coffee, milk
	WeightKg    float64   `json:"weight_kg" db:"weight_kg"`
	PricePerKg  float64   `json:"price_per_kg" db:"price_per_kg"`

	Verified        bool   `json:"verified" db:"verified"` // digital handshake complete
	// FarmerSignature string `json:"farmer_signature" db:"farmer_signature"`
	// CollectorSignature string `json:"collector_signature" db:"collector_signature"`
	Status          TransactionStatus `json:"status" db:"status"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Version int `json:"version" db:"version"`
}