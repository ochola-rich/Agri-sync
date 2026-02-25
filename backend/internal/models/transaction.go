package models

import "time"

type TransactionStatus string

const (
	StatusPending   TransactionStatus = "pending"
	StatusVerified  TransactionStatus = "verified"
	StatusPaid      TransactionStatus = "paid"
)

type Transaction struct {
	ID           string            `json:"id"`
	FarmerID     string            `json:"farmerId"`
	CollectorID  string            `json:"collectorId"`
	Crop         string            `json:"crop"`
	WeightKg     float64           `json:"weightKg"`
	UnitPrice    float64           `json:"unitPrice"`    // per kg
	TotalValue   float64           `json:"totalValue"`   // calculated
	Status       TransactionStatus `json:"status"`
	CreatedAt    time.Time         `json:"createdAt"`
	LastModified time.Time         `json:"lastModified"` // for future last-write-wins
}