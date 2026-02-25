package main

import (
	"fmt"
	"log"
	"time"

	"agri-sync-backend/internal/database"
	"agri-sync-backend/internal/models"
	"agri-sync-backend/internal/repository"
	"agri-sync-backend/internal/config"
)

func main() {

	cfg := config.LoadConfig()

	// 1️⃣ Connect to SQLite
	db, err := database.ConnectSQLite(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to connect DB: %v", err)
	}

	fmt.Println("Using DB at:", cfg.DBPath)

	// 2️⃣ Create repositories
	farmerRepo := repository.NewFarmerRepository(db)
	collectorRepo := repository.NewCollectorRepository(db)
	collectionRepo := repository.NewCollectionRepository(db)

	// --------------------------
	// 3️⃣ Test Farmer CRUD
	// --------------------------
	farmer := &models.Farmer{
		ID:           "uuid-farmer-123",
		Name:         "Alice",
		Phone:        "+254700000000",
		PasswordHash: "password123", // dummy password for testing
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Version:      1,
	}

	if err := farmerRepo.Create(farmer); err != nil {
		log.Fatalf("Create farmer failed: %v", err)
	}
	fmt.Println("✅ Farmer created")

	gotFarmer, _ := farmerRepo.GetByID(farmer.ID)
	fmt.Printf("👀 Got farmer: %+v\n", gotFarmer)

	farmer.Phone = "+254711111111"
	farmer.UpdatedAt = time.Now()
	_ = farmerRepo.Update(farmer)
	fmt.Println("✏️ Farmer updated")

	_ = farmerRepo.Delete(farmer.ID)
	fmt.Println("🗑️ Farmer deleted")

	// --------------------------
	// 4️⃣ Test Collector CRUD
	// --------------------------
	collector := &models.Collector{
		ID:           "uuid-collector-456",
		Name:         "Bob",
		Phone:        "+254722222222",
		PasswordHash: "collectorpw", // dummy password
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		Version:      1,
	}

	_ = collectorRepo.Create(collector)
	fmt.Println("✅ Collector created")

	gotCollector, _ := collectorRepo.GetByID(collector.ID)
	fmt.Printf("👀 Got collector: %+v\n", gotCollector)

	collector.Phone = "+254733333333"
	collector.UpdatedAt = time.Now()
	_ = collectorRepo.Update(collector)
	fmt.Println("✏️ Collector updated")

	_ = collectorRepo.Delete(collector.ID)
	fmt.Println("🗑️ Collector deleted")

	// --------------------------
	// 5️⃣ Test Collection CRUD
	// --------------------------
	_ = farmerRepo.Create(farmer)   // recreate for FK
	_ = collectorRepo.Create(collector) // recreate for FK

	collection := &models.Collection{
		ID:          "uuid-collection-789",
		FarmerID:    farmer.ID,
		CollectorID: collector.ID,
		CropType:    "Tea",
		WeightKg:    12.5,
		PricePerKg:  250,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	_ = collectionRepo.Create(collection)
	fmt.Println("✅ Collection created")

	gotCollection, _ := collectionRepo.GetByID(collection.ID)
	fmt.Printf("👀 Got collection: %+v\n", gotCollection)

	collection.WeightKg = 15
	collection.UpdatedAt = time.Now()
	_ = collectionRepo.Update(collection)
	fmt.Println("✏️ Collection updated")

	_ = collectionRepo.Delete(collection.ID)
	fmt.Println("🗑️ Collection deleted")

	// Cleanup
	_ = farmerRepo.Delete(farmer.ID)
	_ = collectorRepo.Delete(collector.ID)
}