package inventory

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

type CylinderType string

const (
	CylinderType3KG  CylinderType = "3KG"
	CylinderType5KG  CylinderType = "5KG"
	CylinderType6KG  CylinderType = "6KG"
	CylinderType9KG  CylinderType = "9KG"
	CylinderType12KG CylinderType = "12KG"
	CylinderType13KG CylinderType = "13KG"
	CylinderType14KG CylinderType = "14KG"
	CylinderType15KG CylinderType = "15KG"
	CylinderType18KG CylinderType = "18KG"
	CylinderType19KG CylinderType = "19KG"
	CylinderType20KG CylinderType = "20KG"
	CylinderType45KG CylinderType = "45KG"
	CylinderType48KG CylinderType = "48KG"
)

type InventoryItem struct {
	ID            uuid.UUID    `json:"id"`
	ProviderID    uuid.UUID    `json:"provider_id"`
	CylinderType  CylinderType `json:"cylinder_type"`
	RefillPrice   float64      `json:"refill_price"`
	BuyPrice      float64      `json:"buy_price"`
	StockQuantity int          `json:"stock_quantity"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

func (s *Service) AddInventoryItem(item *InventoryItem) error {
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO cylinder_pricing (id, provider_id, cylinder_type, refill_price, buy_price)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := s.db.ExecContext(ctx, query, item.ID.String(), item.ProviderID.String(), item.CylinderType, item.RefillPrice, item.BuyPrice)
	return err
}

func (s *Service) UpdateInventoryItem(item *InventoryItem) error {
	item.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE cylinder_pricing
		SET refill_price = $1, buy_price = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := s.db.ExecContext(ctx, query, item.RefillPrice, item.BuyPrice, item.UpdatedAt, item.ID.String())
	return err
}

func (s *Service) GetProviderInventory(providerID uuid.UUID) ([]InventoryItem, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, provider_id, cylinder_type, refill_price, buy_price, 0, created_at, updated_at
		FROM cylinder_pricing
		WHERE provider_id = $1
		ORDER BY cylinder_type
	`

	rows, err := s.db.QueryContext(ctx, query, providerID.String())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		var itemIDStr, providerIDStr string
		err := rows.Scan(&itemIDStr, &providerIDStr, &item.CylinderType, &item.RefillPrice, &item.BuyPrice, &item.StockQuantity, &item.CreatedAt, &item.UpdatedAt)
		if err != nil {
			return nil, err
		}
		item.ID, _ = uuid.Parse(itemIDStr)
		item.ProviderID, _ = uuid.Parse(providerIDStr)
		items = append(items, item)
	}

	return items, rows.Err()
}

func (s *Service) GetCylinderPrice(providerID uuid.UUID, cylinderType CylinderType) (float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	trimmedCylinderType := strings.TrimSpace(string(cylinderType))

	var refillPrice, buyPrice float64

	query := `
		SELECT refill_price, buy_price
		FROM cylinder_pricing
		WHERE provider_id = $1 AND cylinder_type = $2
	`

	err := s.db.QueryRowContext(ctx, query, providerID.String(), trimmedCylinderType).Scan(&refillPrice, &buyPrice)

	log.Printf("Cylinder Type: %s, Refill Price: %.2f, Buy Price: %.2f. Provider ID: %s",
		trimmedCylinderType, refillPrice, buyPrice, providerID.String())

	if err != nil {
		return 0, fmt.Errorf("cylinder type %v not found for provider %s", cylinderType, providerID.String())
	}

	// Return the first available price (refill_price or buy_price)
	if refillPrice > 0 {
		return refillPrice, nil
	} else if buyPrice > 0 {
		return buyPrice, nil
	}

	// If neither price is available, return an error
	return 0, fmt.Errorf("no valid price found for cylinder type %s and provider %s",
		trimmedCylinderType, providerID.String())
}

func (s *Service) UpdateStock(providerID uuid.UUID, cylinderType CylinderType, quantity int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE cylinder_pricing
		SET updated_at = $1
		WHERE provider_id = $2 AND cylinder_type = $3
	`

	_, err := s.db.ExecContext(ctx, query, time.Now(), providerID.String(), cylinderType)
	return err
}
