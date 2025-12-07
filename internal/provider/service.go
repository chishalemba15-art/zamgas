package provider

import (
	"context"
	"database/sql"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/internal/order"
)

type Service struct {
	db           *sql.DB
	orderService *order.Service
}

type Price struct {
	ProviderID   string  `json:"provider_id"`
	CylinderType string  `json:"cylinder_type"`
	RefillPrice  float64 `json:"refill_price"`
	BuyPrice     float64 `json:"buy_price"`
}

// ProviderImage for storing images in SQLite
type ProviderImage struct {
	ID          uuid.UUID `json:"id"`
	ProviderID  uuid.UUID `json:"provider_id"`
	ImageName   string    `json:"image_name"`
	ImageData   []byte    `json:"image_data"`
	ContentType string    `json:"content_type"`
	UploadedAt  time.Time `json:"uploaded_at"`
}

func NewService(db *sql.DB) *Service {
	return &Service{
		db: db,
	}
}

func (s *Service) GetProviderOrders(providerID uuid.UUID) ([]order.Order, error) {
	return s.orderService.GetProviderOrders(providerID)
}

func (s *Service) AcceptOrder(providerID uuid.UUID, orderID uuid.UUID) error {
	// Use the order service method to accept the order
	return s.orderService.AcceptOrder(providerID, orderID)
}

func (s *Service) DenyOrder(providerID uuid.UUID, orderID uuid.UUID) error {
	// Reject the order when no alternative provider is available
	return s.orderService.RejectOrder(orderID)
}

func (s *Service) FindPriceByProviderAndCylinderType(providerID string, cylinderType string) (*Price, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var refillPrice, buyPrice float64

	query := `
		SELECT refill_price, buy_price
		FROM cylinder_pricing
		WHERE provider_id = $1 AND cylinder_type = $2
		LIMIT 1
	`

	err := s.db.QueryRowContext(ctx, query, providerID, cylinderType).Scan(&refillPrice, &buyPrice)
	if err != nil {
		return nil, fmt.Errorf("no price found for provider %s and cylinder type %s", providerID, cylinderType)
	}

	return &Price{
		ProviderID:   providerID,
		CylinderType: cylinderType,
		RefillPrice:  refillPrice,
		BuyPrice:     buyPrice,
	}, nil
}

func (s *Service) UploadProviderImage(providerID string, src io.Reader, fileHeader *multipart.FileHeader) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate a unique filename
	filename := fmt.Sprintf("provider_%s_%s%s",
		providerID,
		uuid.New().String(),
		filepath.Ext(fileHeader.Filename),
	)

	// Define upload path
	uploadPath := filepath.Join("uploads", "providers", filename)

	// Create destination file
	dst, err := os.Create(uploadPath)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	// Copy file contents
	_, err = io.Copy(dst, src)
	if err != nil {
		return fmt.Errorf("failed to copy file contents: %v", err)
	}

	// Update provider record with image path
	query := `
		UPDATE users
		SET profile_image = $1, updated_at = $2
		WHERE id = $3
	`

	result, err := s.db.ExecContext(ctx, query, uploadPath, time.Now(), providerID)
	if err != nil {
		return fmt.Errorf("failed to update provider profile image: %v", err)
	}

	// Return custom error if no document was modified
	if rowsAffected, _ := result.RowsAffected(); rowsAffected == 0 {
		return fmt.Errorf("no provider found with ID %s", providerID)
	}

	return nil
}

func (s *Service) GetProviderById(providerID string) (*Provider, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT id, name, phone_number, rating, profile_image, created_at, updated_at
		FROM users
		WHERE id = $1 AND user_type = 'provider'
	`

	var provider Provider
	var name, phone, profileImage string
	var rating float64

	err := s.db.QueryRowContext(ctx, query, providerID).Scan(
		&provider.ID, &name, &phone, &rating, &profileImage, &provider.CreatedAt, &provider.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("provider not found with ID %s", providerID)
	}

	provider.Name = name
	provider.Phone = phone
	provider.Rating = rating
	provider.ProfileImage = profileImage

	return &provider, nil
}
