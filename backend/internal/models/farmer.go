package models

import "time"

type Farmer struct {
	ID        string    `json:"id" db:"id"` // UUID (generated on client)
	Name      string    `json:"name" db:"name"`
	Phone     string    `json:"phone" db:"phone"`
	// Location  string    `json:"location" db:"location"` // TODO: Remove this

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	// For conflict resolution
	Version   int       `json:"version" db:"version"`

	PasswordHash string `json:"-" db:"password_hash"` // hashed password
}
