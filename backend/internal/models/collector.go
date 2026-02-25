package models

import "time"

type Collector struct {
	ID        string    `json:"id" db:"id"` // UUID
	Name      string    `json:"name" db:"name"`
	Phone     string    `json:"phone" db:"phone"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Version   int       `json:"version" db:"version"`

	PasswordHash string `json:"-" db:"password_hash"` // hashed password
}