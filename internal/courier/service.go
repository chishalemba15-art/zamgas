package courier

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
)

// Courier represents a courier with their current status
type Courier struct {
	ID        uuid.UUID
	Name      string
	Phone     string
	Latitude  *float64
	Longitude *float64
	Rating    int
}

// Service handles courier-related operations
type Service struct {
	db *sql.DB
}

// NewService creates a new courier service
func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// courierCandidate represents a potential courier assignment
type courierCandidate struct {
	ID           uuid.UUID
	Distance     float64
	Rating       int
	ActiveOrders int
}

// FindBestCourier finds the best available courier near a provider
// Uses scoring based on distance, rating, and current workload
func (s *Service) FindBestCourier(providerLat, providerLng float64) (*uuid.UUID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Query to get all couriers with their active order count
	query := `
		SELECT 
			u.id, 
			u.latitude, 
			u.longitude, 
			u.rating,
			(SELECT COUNT(*) 
			 FROM orders 
			 WHERE courier_id = u.id 
			   AND status IN ('accepted', 'in-transit')) as active_orders
		FROM users u
		WHERE u.user_type = 'courier'
			AND u.latitude IS NOT NULL
			AND u.longitude IS NOT NULL
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get couriers: %w", err)
	}
	defer rows.Close()

	var candidates []courierCandidate

	for rows.Next() {
		var idStr string
		var lat, lng sql.NullFloat64
		var rating, activeOrders int

		if err := rows.Scan(&idStr, &lat, &lng, &rating, &activeOrders); err != nil {
			continue
		}

		if !lat.Valid || !lng.Valid {
			continue
		}

		// Calculate distance using Haversine formula
		dist := calculateDistance(providerLat, providerLng, lat.Float64, lng.Float64)

		// Only consider couriers within 10km radius
		if dist > 10.0 {
			continue
		}

		// Skip if courier is too busy (more than 3 active orders)
		if activeOrders >= 3 {
			continue
		}

		id, _ := uuid.Parse(idStr)
		candidates = append(candidates, courierCandidate{
			ID:           id,
			Distance:     dist,
			Rating:       rating,
			ActiveOrders: activeOrders,
		})
	}

	if len(candidates) == 0 {
		return nil, fmt.Errorf("no available couriers found within 10km")
	}

	// Find best courier using scoring algorithm
	bestScore := -1.0
	var bestCourier *uuid.UUID

	for _, c := range candidates {
		// Scoring formula (total: 100 points)
		// - Distance: 40 points (closer is better)
		// - Rating: 30 points (higher is better)
		// - Availability: 30 points (fewer active orders is better)

		distanceScore := (10.0 - c.Distance) / 10.0 * 40.0
		ratingScore := float64(c.Rating) / 5.0 * 30.0
		availabilityScore := float64(3-c.ActiveOrders) / 3.0 * 30.0

		totalScore := distanceScore + ratingScore + availabilityScore

		if totalScore > bestScore {
			bestScore = totalScore
			bestCourier = &c.ID
		}
	}

	return bestCourier, nil
}

// AssignCourierToOrder assigns a courier to an order
func (s *Service) AssignCourierToOrder(orderID, courierID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE orders
		SET courier_id = $1, courier_status = 'pending', updated_at = $2
		WHERE id = $3
	`

	result, err := s.db.ExecContext(ctx, query, courierID.String(), time.Now(), orderID.String())
	if err != nil {
		return fmt.Errorf("failed to assign courier: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// GetCourierByID retrieves courier details by ID
func (s *Service) GetCourierByID(courierID uuid.UUID) (*Courier, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, phone_number, latitude, longitude, rating
		FROM users
		WHERE id = $1 AND user_type = 'courier'
	`

	var courier Courier
	var idStr, name, phone string
	var lat, lng sql.NullFloat64
	var rating int

	err := s.db.QueryRowContext(ctx, query, courierID.String()).Scan(
		&idStr, &name, &phone, &lat, &lng, &rating,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("courier not found")
		}
		return nil, fmt.Errorf("failed to get courier: %w", err)
	}

	courier.ID, _ = uuid.Parse(idStr)
	courier.Name = name
	courier.Phone = phone
	courier.Rating = rating

	if lat.Valid {
		courier.Latitude = &lat.Float64
	}
	if lng.Valid {
		courier.Longitude = &lng.Float64
	}

	return &courier, nil
}

// GetAvailableCouriers returns all couriers within radius with availability info
func (s *Service) GetAvailableCouriers(providerLat, providerLng float64, radiusKm float64) ([]Courier, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT 
			u.id, 
			u.name,
			u.phone_number,
			u.latitude, 
			u.longitude, 
			u.rating,
			(SELECT COUNT(*) 
			 FROM orders 
			 WHERE courier_id = u.id 
			   AND status IN ('accepted', 'in-transit')) as active_orders
		FROM users u
		WHERE u.user_type = 'courier'
			AND u.latitude IS NOT NULL
			AND u.longitude IS NOT NULL
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get couriers: %w", err)
	}
	defer rows.Close()

	var couriers []Courier

	for rows.Next() {
		var idStr, name, phone string
		var lat, lng sql.NullFloat64
		var rating, activeOrders int

		if err := rows.Scan(&idStr, &name, &phone, &lat, &lng, &rating, &activeOrders); err != nil {
			continue
		}

		if !lat.Valid || !lng.Valid {
			continue
		}

		// Calculate distance
		dist := calculateDistance(providerLat, providerLng, lat.Float64, lng.Float64)

		// Only include couriers within radius
		if dist > radiusKm {
			continue
		}

		id, _ := uuid.Parse(idStr)
		courier := Courier{
			ID:        id,
			Name:      name,
			Phone:     phone,
			Latitude:  &lat.Float64,
			Longitude: &lng.Float64,
			Rating:    rating,
		}

		couriers = append(couriers, courier)
	}

	return couriers, nil
}

// calculateDistance computes the distance between two points using the Haversine formula
// Returns distance in kilometers
func calculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadiusKm = 6371.0

	// Convert degrees to radians
	lat1Rad := lat1 * math.Pi / 180.0
	lat2Rad := lat2 * math.Pi / 180.0
	deltaLat := (lat2 - lat1) * math.Pi / 180.0
	deltaLng := (lng2 - lng1) * math.Pi / 180.0

	// Haversine formula
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}
