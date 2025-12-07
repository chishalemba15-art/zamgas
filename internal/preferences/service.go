package preferences

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

var (
	ErrPreferencesNotFound = errors.New("preferences not found")
)

type UserPreferences struct {
	ID                    uuid.UUID  `json:"id"`
	UserID                uuid.UUID  `json:"user_id"`
	PreferredCylinderType *string    `json:"preferred_cylinder_type,omitempty"`
	PreferredLatitude     *float64   `json:"preferred_latitude,omitempty"`
	PreferredLongitude    *float64   `json:"preferred_longitude,omitempty"`
	PreferredAddress      *string    `json:"preferred_address,omitempty"`
	DeliveryRadiusKm      *int       `json:"delivery_radius_km,omitempty"`
	CreatedAt             string     `json:"created_at"`
	UpdatedAt             string     `json:"updated_at"`
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// GetUserPreferences retrieves preferences for a user
func (s *Service) GetUserPreferences(userID uuid.UUID) (*UserPreferences, error) {
	query := `
		SELECT id, user_id, preferred_cylinder_type, preferred_latitude,
		       preferred_longitude, preferred_address, delivery_radius_km,
		       created_at, updated_at
		FROM user_preferences
		WHERE user_id = $1
	`

	prefs := &UserPreferences{}
	err := s.db.QueryRowContext(context.Background(), query, userID).Scan(
		&prefs.ID,
		&prefs.UserID,
		&prefs.PreferredCylinderType,
		&prefs.PreferredLatitude,
		&prefs.PreferredLongitude,
		&prefs.PreferredAddress,
		&prefs.DeliveryRadiusKm,
		&prefs.CreatedAt,
		&prefs.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrPreferencesNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	return prefs, nil
}

// UpsertUserPreferences creates or updates user preferences
func (s *Service) UpsertUserPreferences(userID uuid.UUID, prefs *UserPreferences) (*UserPreferences, error) {
	query := `
		INSERT INTO user_preferences (user_id, preferred_cylinder_type, preferred_latitude, preferred_longitude, preferred_address, delivery_radius_km)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			preferred_cylinder_type = COALESCE(EXCLUDED.preferred_cylinder_type, user_preferences.preferred_cylinder_type),
			preferred_latitude = COALESCE(EXCLUDED.preferred_latitude, user_preferences.preferred_latitude),
			preferred_longitude = COALESCE(EXCLUDED.preferred_longitude, user_preferences.preferred_longitude),
			preferred_address = COALESCE(EXCLUDED.preferred_address, user_preferences.preferred_address),
			delivery_radius_km = COALESCE(EXCLUDED.delivery_radius_km, user_preferences.delivery_radius_km),
			updated_at = NOW()
		RETURNING id, user_id, preferred_cylinder_type, preferred_latitude, preferred_longitude, preferred_address, delivery_radius_km, created_at, updated_at
	`

	result := &UserPreferences{}
	err := s.db.QueryRowContext(
		context.Background(),
		query,
		userID,
		prefs.PreferredCylinderType,
		prefs.PreferredLatitude,
		prefs.PreferredLongitude,
		prefs.PreferredAddress,
		prefs.DeliveryRadiusKm,
	).Scan(
		&result.ID,
		&result.UserID,
		&result.PreferredCylinderType,
		&result.PreferredLatitude,
		&result.PreferredLongitude,
		&result.PreferredAddress,
		&result.DeliveryRadiusKm,
		&result.CreatedAt,
		&result.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to upsert preferences: %w", err)
	}

	return result, nil
}

// UpdateCylinderPreference updates only the cylinder type preference
func (s *Service) UpdateCylinderPreference(userID uuid.UUID, cylinderType string) error {
	query := `
		INSERT INTO user_preferences (user_id, preferred_cylinder_type)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET
			preferred_cylinder_type = $2,
			updated_at = NOW()
	`

	_, err := s.db.ExecContext(context.Background(), query, userID, cylinderType)
	if err != nil {
		return fmt.Errorf("failed to update cylinder preference: %w", err)
	}

	return nil
}

// UpdateLocationPreference updates only the location preferences
func (s *Service) UpdateLocationPreference(userID uuid.UUID, latitude, longitude float64, address string) error {
	query := `
		INSERT INTO user_preferences (user_id, preferred_latitude, preferred_longitude, preferred_address)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO UPDATE SET
			preferred_latitude = $2,
			preferred_longitude = $3,
			preferred_address = $4,
			updated_at = NOW()
	`

	_, err := s.db.ExecContext(context.Background(), query, userID, latitude, longitude, address)
	if err != nil {
		return fmt.Errorf("failed to update location preference: %w", err)
	}

	return nil
}
