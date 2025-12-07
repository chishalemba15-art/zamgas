package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

const (
	earthRadius = 6371 // Earth's radius in kilometers
)

var cylinderTypes = []string{
	"3KG", "5KG", "6KG", "9KG", "12KG", "13KG", "14KG", "15KG", "18KG", "19KG", "20KG", "45KG", "48KG",
}

// Global variables for Supabase REST API
var (
	supabaseURL    string
	supabaseAPIKey string
)

// Helper to make REST API calls to Supabase
func supabaseRequest(method, table string, data interface{}) error {
	url := fmt.Sprintf("%s/rest/v1/%s", supabaseURL, table)

	var body []byte
	var err error

	if data != nil {
		body, err = json.Marshal(data)
		if err != nil {
			return fmt.Errorf("failed to marshal data: %v", err)
		}
	}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers for Supabase REST API
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", supabaseAPIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", supabaseAPIKey))
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("API error (%d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

type User struct {
	ID               uuid.UUID
	Email            string
	Password         string
	Name             string
	PhoneNumber      string
	UserType         string
	Latitude         float64
	Longitude        float64
	Rating           int
	ExpoPushToken    string
	PhoneVerified    bool
	VerificationTime *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type CylinderPricing struct {
	ID           uuid.UUID
	ProviderID   uuid.UUID
	CylinderType string
	RefillPrice  float64
	BuyPrice     float64
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Load .env file from parent directory
	envPath := filepath.Join("..", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("⚠️  Warning: Could not load .env file from %s: %v\n", envPath, err)
		log.Println("Attempting to use environment variables directly...")
	}

	// Load Supabase credentials
	supabaseURL = os.Getenv("SUPABASE_URL")
	supabaseAPIKey = os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	databaseURL := os.Getenv("DATABASE_URL")

	if supabaseURL == "" || supabaseAPIKey == "" {
		log.Fatal("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are not set.")
	}

	fmt.Println("✅ Loaded Supabase Configuration")
	fmt.Println("")

	// Menu
	showMenu()

	var choice string
	fmt.Print("\nEnter choice (1-4): ")
	fmt.Scanln(&choice)

	dbCtx := context.Background()

	// Try to use REST API first, fall back to PostgreSQL if available
	var pool *pgxpool.Pool
	if databaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		p, err := pgxpool.New(ctx, databaseURL)
		cancel()
		if err == nil {
			// Test the connection actually works
			ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
			pingErr := p.Ping(ctx)
			cancel()
			if pingErr == nil {
				pool = p
				defer pool.Close()
			} else {
				p.Close()
				// Connection failed, will use REST API
			}
		}
	}

	switch choice {
	case "1":
		if pool != nil {
			setupAllData(dbCtx, pool)
		} else {
			setupAllDataAPI()
		}
	case "2":
		if pool != nil {
			createInitialUsers(dbCtx, pool)
		} else {
			createInitialUsersAPI()
		}
	case "3":
		if pool != nil {
			createProviders(dbCtx, pool)
		} else {
			createProvidersAPI()
		}
	case "4":
		if pool != nil {
			resetAllData(dbCtx, pool)
		} else {
			resetAllDataAPI()
		}
	default:
		fmt.Println("❌ Invalid choice")
	}
}

func showMenu() {
	fmt.Println("════════════════════════════════════════")
	fmt.Println("  LPG Delivery System - Data Setup")
	fmt.Println("════════════════════════════════════════")
	fmt.Println("\nOptions:")
	fmt.Println("1) Complete Setup (init users + generate providers)")
	fmt.Println("2) Create Initial Users Only (6 users)")
	fmt.Println("3) Generate Providers Only (10 providers + pricing)")
	fmt.Println("4) Reset All Data (DELETE ALL - destructive)")
	fmt.Println("")
}

func setupAllData(ctx context.Context, pool *pgxpool.Pool) {
	fmt.Println("\n🔄 Starting complete setup...\n")

	// Create initial users
	fmt.Println("📝 Creating initial users...")
	createInitialUsers(ctx, pool)

	// Generate providers
	fmt.Println("\n📝 Generating providers with pricing...")
	createProviders(ctx, pool)

	fmt.Println("\n✅ Setup complete!\n")
	fmt.Println("User Credentials:")
	fmt.Println("  Customers: chanda@example.com, mutale@example.com (password: password123)")
	fmt.Println("  Providers: oryx@example.com, afrox@example.com (password: password123)")
	fmt.Println("  Couriers: themba@example.com, zindaba@example.com (password: password123)")
}

func createInitialUsers(ctx context.Context, pool *pgxpool.Pool) {
	centerLat, centerLon := -15.3875259, 28.3228303 // Lusaka, Zambia

	users := []struct {
		email    string
		name     string
		phone    string
		userType string
	}{
		{
			email:    "chanda@example.com",
			name:     "Chanda Mulenga",
			phone:    "+260977123456",
			userType: "customer",
		},
		{
			email:    "mutale@example.com",
			name:     "Mutale Banda",
			phone:    "+260966987654",
			userType: "customer",
		},
		{
			email:    "oryx@example.com",
			name:     "Oryx Gas Zambia",
			phone:    "+260211123123",
			userType: "provider",
		},
		{
			email:    "afrox@example.com",
			name:     "Afrox Zambia",
			phone:    "+260211456456",
			userType: "provider",
		},
		{
			email:    "themba@example.com",
			name:     "Themba Nyirenda",
			phone:    "+260955789123",
			userType: "courier",
		},
		{
			email:    "zindaba@example.com",
			name:     "Zindaba Phiri",
			phone:    "+260966321654",
			userType: "courier",
		},
	}

	for _, u := range users {
		// Check if user already exists
		var count int
		err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE email = $1", u.email).Scan(&count)
		if err != nil {
			log.Printf("❌ Error checking user: %v", err)
			continue
		}

		if count > 0 {
			fmt.Printf("⏭️  User already exists: %s (%s)\n", u.name, u.userType)
			continue
		}

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Failed to hash password for %s: %v", u.email, err)
			continue
		}

		// Generate random location
		lat, lon := randomLocationNearby(centerLat, centerLon, 50)

		// Insert user
		userID := uuid.New()
		err = insertUser(ctx, pool, userID, u.email, string(hashedPassword), u.name, u.phone, u.userType, lat, lon)
		if err != nil {
			log.Printf("❌ Failed to insert user %s: %v", u.email, err)
			continue
		}

		fmt.Printf("✅ Created user: %s (%s)\n", u.name, u.userType)
	}

	fmt.Println()
}

func createProviders(ctx context.Context, pool *pgxpool.Pool) {
	centerLat, centerLon := -15.3875259, 28.3228303 // Lusaka, Zambia
	numProviders := 10

	for i := 0; i < numProviders; i++ {
		// Generate provider data
		providerID := uuid.New()
		email := fmt.Sprintf("provider%s@example.com", providerID.String()[:8])
		name := fmt.Sprintf("Gas Provider %d", i+1)
		phone := fmt.Sprintf("+26596%06d", rand.Intn(1000000))

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Failed to hash password for provider %d: %v", i+1, err)
			continue
		}

		// Generate random location
		lat, lon := randomLocationNearby(centerLat, centerLon, 50)

		// Insert provider
		err = insertUser(ctx, pool, providerID, email, string(hashedPassword), name, phone, "provider", lat, lon)
		if err != nil {
			log.Printf("❌ Failed to insert provider %d: %v", i+1, err)
			continue
		}

		// Insert cylinder pricing for this provider
		for _, cylinderType := range cylinderTypes {
			basePrice := 50.0 + rand.Float64()*100 // Random price between 50-150
			pricing := CylinderPricing{
				ID:           uuid.New(),
				ProviderID:   providerID,
				CylinderType: cylinderType,
				RefillPrice:  basePrice,
				BuyPrice:     basePrice * 1.3, // 30% markup for purchase
			}

			err := insertCylinderPricing(ctx, pool, &pricing)
			if err != nil {
				log.Printf("❌ Failed to insert pricing for %s: %v", cylinderType, err)
			}
		}

		fmt.Printf("✅ Generated provider %d: %s\n", i+1, name)
	}

	fmt.Println()
}

func resetAllData(ctx context.Context, pool *pgxpool.Pool) {
	fmt.Print("\n⚠️  WARNING: This will DELETE ALL DATA from the database!\n")
	fmt.Print("Type 'yes' to confirm: ")

	var confirm string
	fmt.Scanln(&confirm)

	if confirm != "yes" {
		fmt.Println("❌ Reset cancelled")
		return
	}

	// Delete all data in order (respect foreign keys)
	tables := []string{
		"location_history",
		"provider_images",
		"inventory",
		"payments",
		"orders",
		"cylinder_pricing",
		"users",
	}

	for _, table := range tables {
		result, err := pool.Exec(ctx, fmt.Sprintf("DELETE FROM %s", table))
		if err != nil {
			log.Printf("❌ Failed to delete from %s: %v", table, err)
			continue
		}

		fmt.Printf("✅ Deleted from %s: %d rows\n", table, result.RowsAffected())
	}

	fmt.Println("\n✅ Database reset complete")
}

func insertUser(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID, email, password, name, phone, userType string, latitude, longitude float64) error {
	query := `
		INSERT INTO users (id, email, password, name, phone_number, user_type, latitude, longitude, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
	`

	_, err := pool.Exec(ctx, query, id, email, password, name, phone, userType, latitude, longitude)
	return err
}

func insertCylinderPricing(ctx context.Context, pool *pgxpool.Pool, pricing *CylinderPricing) error {
	query := `
		INSERT INTO cylinder_pricing (id, provider_id, cylinder_type, refill_price, buy_price, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
	`

	_, err := pool.Exec(ctx, query, pricing.ID, pricing.ProviderID, pricing.CylinderType, pricing.RefillPrice, pricing.BuyPrice)
	return err
}

func randomLocationNearby(centerLat, centerLon float64, radiusKm float64) (float64, float64) {
	angle := rand.Float64() * 2 * math.Pi
	distance := rand.Float64() * radiusKm

	// Convert to radians
	centerLatRad := centerLat * math.Pi / 180
	centerLonRad := centerLon * math.Pi / 180

	// Haversine formula
	lat := math.Asin(math.Sin(centerLatRad)*math.Cos(distance/earthRadius) +
		math.Cos(centerLatRad)*math.Sin(distance/earthRadius)*math.Cos(angle))
	lon := centerLonRad + math.Atan2(math.Sin(angle)*math.Sin(distance/earthRadius)*math.Cos(centerLatRad),
		math.Cos(distance/earthRadius)-math.Sin(centerLatRad)*math.Sin(lat))

	return lat * 180 / math.Pi, lon * 180 / math.Pi
}

// ============= REST API Functions =============

func setupAllDataAPI() {
	fmt.Println("\n🔄 Starting complete setup...\n")

	fmt.Println("📝 Creating initial users...")
	createInitialUsersAPI()

	fmt.Println("\n📝 Generating providers with pricing...")
	createProvidersAPI()

	fmt.Println("\n✅ Setup complete!\n")
	fmt.Println("User Credentials:")
	fmt.Println("  Customers: chanda@example.com, mutale@example.com (password: password123)")
	fmt.Println("  Providers: oryx@example.com, afrox@example.com (password: password123)")
	fmt.Println("  Couriers: themba@example.com, zindaba@example.com (password: password123)")
}

func createInitialUsersAPI() {
	centerLat, centerLon := -15.3875259, 28.3228303

	users := []struct {
		email    string
		name     string
		phone    string
		userType string
	}{
		{"chanda@example.com", "Chanda Mulenga", "+260977123456", "customer"},
		{"mutale@example.com", "Mutale Banda", "+260966987654", "customer"},
		{"oryx@example.com", "Oryx Gas Zambia", "+260211123123", "provider"},
		{"afrox@example.com", "Afrox Zambia", "+260211456456", "provider"},
		{"themba@example.com", "Themba Nyirenda", "+260955789123", "courier"},
		{"zindaba@example.com", "Zindaba Phiri", "+260966321654", "courier"},
	}

	for _, u := range users {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Failed to hash password for %s: %v", u.email, err)
			continue
		}

		lat, lon := randomLocationNearby(centerLat, centerLon, 50)

		userData := map[string]interface{}{
			"id":           uuid.New().String(),
			"email":        u.email,
			"password":     string(hashedPassword),
			"name":         u.name,
			"phone_number": u.phone,
			"user_type":    u.userType,
			"latitude":     lat,
			"longitude":    lon,
		}

		err = supabaseRequest("POST", "users", userData)
		if err != nil {
			log.Printf("⏭️  User already exists or error: %s (%s)", u.name, u.userType)
			continue
		}

		fmt.Printf("✅ Created user: %s (%s)\n", u.name, u.userType)
	}

	fmt.Println()
}

func createProvidersAPI() {
	centerLat, centerLon := -15.3875259, 28.3228303
	numProviders := 10

	for i := 0; i < numProviders; i++ {
		providerID := uuid.New()
		email := fmt.Sprintf("provider%s@example.com", providerID.String()[:8])
		name := fmt.Sprintf("Gas Provider %d", i+1)
		phone := fmt.Sprintf("+26596%06d", rand.Intn(1000000))

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Failed to hash password for provider %d: %v", i+1, err)
			continue
		}

		lat, lon := randomLocationNearby(centerLat, centerLon, 50)

		providerData := map[string]interface{}{
			"id":           providerID.String(),
			"email":        email,
			"password":     string(hashedPassword),
			"name":         name,
			"phone_number": phone,
			"user_type":    "provider",
			"latitude":     lat,
			"longitude":    lon,
		}

		err = supabaseRequest("POST", "users", providerData)
		if err != nil {
			log.Printf("❌ Failed to insert provider %d: %v", i+1, err)
			continue
		}

		// Insert cylinder pricing
		for _, cylinderType := range cylinderTypes {
			basePrice := 50.0 + rand.Float64()*100

			pricingData := map[string]interface{}{
				"id":              uuid.New().String(),
				"provider_id":     providerID.String(),
				"cylinder_type":   cylinderType,
				"refill_price":    basePrice,
				"buy_price":       basePrice * 1.3,
			}

			err := supabaseRequest("POST", "cylinder_pricing", pricingData)
			if err != nil {
				log.Printf("❌ Failed to insert pricing for %s: %v", cylinderType, err)
			}
		}

		fmt.Printf("✅ Generated provider %d: %s\n", i+1, name)
	}

	fmt.Println()
}

func resetAllDataAPI() {
	fmt.Print("\n⚠️  WARNING: This will DELETE ALL DATA from the database!\n")
	fmt.Print("Type 'yes' to confirm: ")

	var confirm string
	fmt.Scanln(&confirm)

	if confirm != "yes" {
		fmt.Println("❌ Reset cancelled")
		return
	}

	// Delete using REST API with filters would be complex
	// Instead, show message
	fmt.Println("❌ Bulk reset via REST API requires manual Supabase console access")
	fmt.Println("Please use Supabase console to delete data or use PostgreSQL connection")
}
