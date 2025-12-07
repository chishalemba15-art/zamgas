package examples

// This file shows how to integrate Supabase REST API client into main.go
// It demonstrates dual-mode support: PostgreSQL when available, Supabase REST API as fallback

import (
	"log"
	"os"

	"github.com/yakumwamba/lpg-delivery-system/internal/auth"
	"github.com/yakumwamba/lpg-delivery-system/internal/inventory"
	"github.com/yakumwamba/lpg-delivery-system/internal/location"
	"github.com/yakumwamba/lpg-delivery-system/internal/order"
	"github.com/yakumwamba/lpg-delivery-system/internal/payment"
	"github.com/yakumwamba/lpg-delivery-system/internal/provider"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

// MainIntegrationExample shows how to modify main.go to support both PostgreSQL and Supabase REST API
func MainIntegrationExample() {
	// Try to load .env file
	// ... (existing .env loading code)

	// Get configuration from environment
	databaseURL := os.Getenv("DATABASE_URL")
	supabaseURL := os.Getenv("SUPABASE_URL")
	port := os.Getenv("PORT")
	jwtSecret := os.Getenv("JWT_SECRET")

	// Initialize database connection with fallback logic
	var userService *user.Service
	var orderService *order.Service
	var inventoryService *inventory.Service
	var locationService *location.Service
	var providerService *provider.Service
	var authService *auth.Service

	// Try PostgreSQL first
	log.Println("🔄 Attempting to connect to database...")
	pgPool, err := database.ConnectPostgres(databaseURL)

	if err != nil {
		log.Printf("⚠️  PostgreSQL connection failed: %v", err)
		log.Println("💡 Falling back to Supabase REST API...")

		// Fallback to Supabase REST API
		supabaseClient, err := database.ConnectSupabase()
		if err != nil {
			log.Fatalf("❌ Failed to connect to Supabase REST API: %v", err)
		}

		log.Println("✓ Connected via Supabase REST API")

		// Initialize services with Supabase client
		// NOTE: You'll need to create these constructor methods in your service files
		userService = user.NewServiceWithSupabase(supabaseClient)
		orderService = order.NewServiceWithSupabase(supabaseClient)
		inventoryService = inventory.NewServiceWithSupabase(supabaseClient)
		locationService = location.NewServiceWithSupabase(supabaseClient)
		providerService = provider.NewServiceWithSupabase(supabaseClient)
		authService = auth.NewServiceWithSupabase(supabaseClient, userService, jwtSecret)

	} else {
		defer pgPool.Close()
		log.Println("✓ Connected via PostgreSQL")

		// Initialize services with PostgreSQL
		userService = user.NewService(pgPool)
		orderService = order.NewService(pgPool)
		inventoryService = inventory.NewService(pgPool)
		locationService = location.NewService(pgPool)
		providerService = provider.NewService(pgPool)
		authService = auth.NewService(pgPool, userService, jwtSecret)
	}

	// Rest of your main.go code (Gin router setup, etc.)
	// ...
}

// Alternative: Supabase-Only Implementation
// If you want to use only Supabase REST API without fallback
func MainSupabaseOnlyExample() {
	// Load .env file
	// ... (existing .env loading code)

	// Get configuration
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		log.Fatal("SUPABASE_URL environment variable is required")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	// Connect to Supabase REST API
	log.Println("🔄 Connecting to Supabase REST API...")
	supabaseClient, err := database.ConnectSupabase()
	if err != nil {
		log.Fatalf("❌ Failed to connect to Supabase: %v", err)
	}
	log.Println("✓ Connected to Supabase REST API")

	// Initialize all services
	userService := user.NewServiceWithSupabase(supabaseClient)
	orderService := order.NewServiceWithSupabase(supabaseClient)
	inventoryService := inventory.NewServiceWithSupabase(supabaseClient)
	locationService := location.NewServiceWithSupabase(supabaseClient)
	providerService := provider.NewServiceWithSupabase(supabaseClient)
	authService := auth.NewServiceWithSupabase(supabaseClient, userService, jwtSecret)

	// Initialize other clients (PawaPay, Twilio, etc.)
	// ... (existing code)

	// Set up Gin router
	// ... (existing code)

	// Start server
	log.Printf("🚀 Server starting on port %s", port)
	// router.Run(":8080")
	_ = userService
	_ = orderService
	_ = inventoryService
	_ = locationService
	_ = providerService
	_ = authService
}

// Helper: Initialize Supabase with Custom Configuration
func InitializeSupabaseWithConfig(useServiceRole bool) (*database.SupabaseClient, error) {
	config := database.SupabaseConfig{
		URL:            os.Getenv("SUPABASE_URL"),
		AnonKey:        os.Getenv("SUPABASE_ANON_KEY"),
		ServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		UseServiceRole: useServiceRole,
	}

	client := database.NewSupabaseClient(config)

	// Test connection
	err := database.SupabaseHealthCheck(client)
	if err != nil {
		return nil, err
	}

	return client, nil
}
