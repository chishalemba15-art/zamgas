package provider

import (
	"time"

	"github.com/google/uuid"
)

type Provider struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Address      string    `json:"address"`
	Phone        string    `json:"phone"`
	Rating       float64   `json:"rating"`
	Reviews      []string  `json:"reviews"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	ProfileImage string    `json:"profile_image"`
}
