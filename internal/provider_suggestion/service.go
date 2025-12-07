package provider_suggestion

import (
	"github.com/yakumwamba/lpg-delivery-system/internal/location"
	"github.com/yakumwamba/lpg-delivery-system/internal/provider"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

type Service struct {
	db              *database.Client
	providerService *provider.Service
}

func NewService(db *database.Client, providerService *provider.Service) *Service {
	return &Service{
		db:              db,
		providerService: providerService,
	}
}

func (s *Service) SuggestBestProvider(cylinderSize string, userLocation location.Location) (*provider.Provider, error) {
	// Implementation for suggesting the best provider
	// Consider factors like number of reviews, rating, and proximity
	return nil, nil
}
