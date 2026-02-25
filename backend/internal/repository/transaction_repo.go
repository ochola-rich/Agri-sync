package repository

import (
	"errors"
	"sync"
	"time"
	"agri-sync-backend/internal/models"

	"github.com/google/uuid"
)

type TransactionRepo struct {
	mu           sync.RWMutex
	transactions map[string]*models.Transaction // key = transaction ID
}

var repo *TransactionRepo

func init() {
	repo = &TransactionRepo{
		transactions: make(map[string]*models.Transaction),
	}
}

func GetTransactionRepo() *TransactionRepo {
	return repo
}

func (r *TransactionRepo) Create(tx *models.Transaction) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if tx.ID == "" {
		tx.ID = uuid.New().String()
	}
	now := time.Now()
	tx.CreatedAt = now
	tx.LastModified = now
	if tx.Status == "" {
		tx.Status = models.StatusPending
	}
	if tx.TotalValue == 0 && tx.WeightKg > 0 && tx.UnitPrice > 0 {
		tx.TotalValue = tx.WeightKg * tx.UnitPrice
	}

	r.transactions[tx.ID] = tx
	return nil
}

func (r *TransactionRepo) GetByID(id string) (*models.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	tx, exists := r.transactions[id]
	if !exists {
		return nil, errors.New("transaction not found")
	}
	return tx, nil
}

func (r *TransactionRepo) ListByFarmer(farmerID string) ([]*models.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []*models.Transaction
	for _, tx := range r.transactions {
		if tx.FarmerID == farmerID {
			list = append(list, tx)
		}
	}
	return list, nil
}

func (r *TransactionRepo) ListAll() ([]*models.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]*models.Transaction, 0, len(r.transactions))
	for _, tx := range r.transactions {
		list = append(list, tx)
	}
	return list, nil
}

func (r *TransactionRepo) UpdateStatus(id string, newStatus models.TransactionStatus) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	tx, exists := r.transactions[id]
	if !exists {
		return errors.New("transaction not found")
	}

	tx.Status = newStatus
	tx.LastModified = time.Now()
	return nil
}