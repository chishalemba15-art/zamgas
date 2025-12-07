package location

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Location struct {
	ID        uuid.UUID
	CourierID uuid.UUID
	Latitude  float64
	Longitude float64
	CreatedAt time.Time
	StreetName string
	UpdatedAt time.Time
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) UpdateLocation(location *Location) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	location.CreatedAt = time.Now()

	query := `
		INSERT INTO locations (id, courier_id, latitude, longitude, street_name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := s.db.ExecContext(ctx, query, location.ID.String(), location.CourierID.String(), location.Latitude, location.Longitude, location.StreetName, location.CreatedAt, location.UpdatedAt)
	return err
}

func (s *Service) GetLocationsByCourierID(courierID uuid.UUID) ([]Location, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT id, courier_id, latitude, longitude, street_name, created_at, updated_at
		FROM locations
		WHERE courier_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, courierID.String())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var locations []Location
	for rows.Next() {
		var loc Location
		var locIDStr, courierIDStr string
		err := rows.Scan(&locIDStr, &courierIDStr, &loc.Latitude, &loc.Longitude, &loc.StreetName, &loc.CreatedAt, &loc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		loc.ID, _ = uuid.Parse(locIDStr)
		loc.CourierID, _ = uuid.Parse(courierIDStr)
		locations = append(locations, loc)
	}

	return locations, rows.Err()
}
