/**
 * Test Data Generation Script
 * Generates sample providers, users, couriers, and orders for testing and display
 *
 * Usage:
 *   go run ./cmd/seed/main.go -providers 5 -users 10 -couriers 3 -orders 15
 */

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/yakumwamba/lpg-delivery-system/internal/order"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
	"golang.org/x/crypto/bcrypt"
)

var (
	numProviders = flag.Int("providers", 30, "Number of providers to create (default: 30)")
	numUsers     = flag.Int("users", 50, "Number of customer users to create (default: 50)")
	numCouriers  = flag.Int("couriers", 15, "Number of couriers to create (default: 15)")
	numOrders    = flag.Int("orders", 100, "Number of orders to create (default: 100)")
	clean        = flag.Bool("clean", false, "Delete all test data before seeding")
)

type SeedData struct {
	db        *pgxpool.Pool
	providers []*user.User
	users     []*user.User
	couriers  []*user.User
	orders    []*order.Order
}

var (
	// Realistic LPG provider names in Lusaka with multiple outlets
	providerNames = []string{
		"Nafta Gas Zambia", "Nafta Gas - Woodlands", "Nafta Gas - Kabulonga",
		"Zesco Energy Solutions", "Zesco Energy - Lusaka Center", "Zesco Energy - East Park",
		"Liquid Gas Africa", "LGA - Kamwala", "LGA - Longacres",
		"SafGas Limited", "SafGas - Chelston", "SafGas - Chilenje",
		"Global LPG Services", "Global LPG - Emmasdale", "Global LPG - Ridgeway",
		"Petrogaz Zambia", "Petrogaz - Northrise", "Petrogaz - CBD",
		"Energy Distributors Ltd", "Energy Distributors - Avondale", "Energy Distributors - Kayards",
		"Premier Gas Solutions", "Premier Gas - Mtendere", "Premier Gas - Chawama",
		"Apex Gas Ltd", "Apex Gas - Lusaka North", "Apex Gas - South Lusaka",
		"Union Cylinders", "Union Cylinders - Libala", "Union Cylinders - Northmead",
	}

	sampleNames = []string{
		"John Doe", "Jane Smith", "Ahmed Hassan", "Sarah Johnson",
		"Michael Brown", "Emily Davis", "David Wilson", "Lisa Anderson",
		"James Martinez", "Jennifer Taylor", "Robert Garcia", "Maria Rodriguez",
		"Chanda Mulenga", "Simone Banda", "Mutale Nkosi", "Patricia Chileshe",
		"Jacob Phiri", "Blessing Siwale", "Mulenga Kawimbe", "Naomi Mukuka",
	}

	sampleEmails = []string{
		"john@example.com", "jane@example.com", "ahmed@example.com",
		"sarah@example.com", "michael@example.com", "emily@example.com",
		"david@example.com", "lisa@example.com", "james@example.com",
		"jennifer@example.com", "robert@example.com", "maria@example.com",
	}

	samplePhones = []string{
		"+260971123456", "+260971234567", "+260971345678",
		"+260971456789", "+260971567890", "+260971678901",
		"+260977789012", "+260977890123", "+260977901234",
		"+260966012345", "+260966123457", "+260966234568",
	}

	sampleAddresses = []string{
		"Plot 123, Kabulonga Road, Lusaka",
		"Woodlands Complex, Lusaka",
		"Kamwala Market Street, Lusaka",
		"Chelston Avenue, Lusaka",
		"Northrise Industrial Park, Lusaka",
		"Cairo Road, CBD, Lusaka",
		"Emmasdale Shopping Centre, Lusaka",
		"Avondale Main Street, Lusaka",
		"Mtendere Housing Unit, Lusaka",
		"Ridgeway Mall, Lusaka",
		"Longacres Business Park, Lusaka",
		"Libala Extension, Lusaka",
	}

	sampleCylinderTypes = []order.CylinderType{
		order.CylinderType3KG,
		order.CylinderType5KG,
		order.CylinderType12KG,
		order.CylinderType15KG,
		order.CylinderType20KG,
	}

	sampleOrderStatuses = []order.OrderStatus{
		order.OrderStatusPending,
		order.OrderStatusAccepted,
		order.OrderStatusInTransit,
		order.OrderStatusDelivered,
	}

	samplePaymentStatuses = []order.PaymentStatus{
		order.PaymentStatusPending,
		order.PaymentStatusPaid,
	}
)

func main() {
	flag.Parse()

	// Load .env file
	envPath := filepath.Join(".", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: Could not load .env file: %v\n", err)
	}

	// Get database URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	// Connect to database with longer timeout for large datasets
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("🌱 Starting test data generation...")

	seed := &SeedData{db: pool}

	// Clean existing data if requested
	if *clean {
		if err := seed.cleanData(ctx); err != nil {
			log.Fatalf("Failed to clean data: %v\n", err)
		}
		fmt.Println("✓ Cleaned existing test data")
	}

	// Create admin user first (OLD - creates in users table)
	if err := seed.createAdminUser(ctx); err != nil {
		log.Fatalf("Failed to create admin user: %v\n", err)
	}
	fmt.Println("✓ Created admin user (admin@lpgfinder.com)")

	// Create separate admin user in admin_users table (NEW)
	if err := seedAdminUser(pool, ctx); err != nil {
		log.Fatalf("Failed to seed admin in admin_users table: %v\n", err)
	}

	// Generate test data
	if err := seed.createProviders(ctx, *numProviders); err != nil {
		log.Fatalf("Failed to create providers: %v\n", err)
	}
	fmt.Printf("✓ Created %d providers\n", *numProviders)

	if err := seed.createUsers(ctx, *numUsers); err != nil {
		log.Fatalf("Failed to create users: %v\n", err)
	}
	fmt.Printf("✓ Created %d customers\n", *numUsers)

	if err := seed.createCouriers(ctx, *numCouriers); err != nil {
		log.Fatalf("Failed to create couriers: %v\n", err)
	}
	fmt.Printf("✓ Created %d couriers\n", *numCouriers)

	if err := seed.createOrders(ctx, *numOrders); err != nil {
		log.Fatalf("Failed to create orders: %v\n", err)
	}
	fmt.Printf("✓ Created %d orders\n", *numOrders)

	// Seed admin data (pricing, inventory, status, analytics, etc.)
	if err := seedAdminData(pool, ctx, seed.providers, seed.users, seed.couriers); err != nil {
		log.Fatalf("Failed to seed admin data: %v\n", err)
	}

	fmt.Println("\n✨ Test data generation completed!")
	fmt.Printf("\nSummary:\n")
	fmt.Printf("  Providers: %d\n", len(seed.providers))
	fmt.Printf("  Customers: %d\n", len(seed.users))
	fmt.Printf("  Couriers: %d\n", len(seed.couriers))
	fmt.Printf("  Orders: %d\n", len(seed.orders))
}

func (s *SeedData) cleanData(ctx context.Context) error {
	// Delete orders first (foreign key constraint)
	_, err := s.db.Exec(ctx, "DELETE FROM orders")
	if err != nil {
		return fmt.Errorf("failed to delete orders: %w", err)
	}

	// Delete users
	_, err = s.db.Exec(ctx, "DELETE FROM users WHERE user_type IN ('provider', 'courier', 'customer')")
	if err != nil {
		return fmt.Errorf("failed to delete users: %w", err)
	}

	return nil
}

// Create a single admin user for dashboard access
func (s *SeedData) createAdminUser(ctx context.Context) error {
	// Hash password for 'admin123'
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	adminUser := &user.User{
		ID:            uuid.MustParse("a0000000-0000-0000-0000-000000000001"),
		Email:         "admin@lpgfinder.com",
		Password:      string(hashedPassword),
		Name:          "Admin User",
		PhoneNumber:   "+260 000 000000",
		UserType:      user.UserTypeProvider, // Use provider type for admin (can be managed via admin_users table)
		Rating:        5,
		PhoneVerified: true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Try to insert, but if email already exists, just update the password
	_, err = s.db.Exec(ctx,
		`INSERT INTO users (id, email, password, name, phone_number, user_type, rating, phone_verified, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 ON CONFLICT (email) DO UPDATE SET
		 	password = $3, updated_at = $10`,
		adminUser.ID, adminUser.Email, adminUser.Password, adminUser.Name, adminUser.PhoneNumber,
		adminUser.UserType, adminUser.Rating, adminUser.PhoneVerified, adminUser.CreatedAt, adminUser.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create/update admin user: %w", err)
	}

	return nil
}

func (s *SeedData) createProviders(ctx context.Context, count int) error {
	// Use realistic provider names or generate if count exceeds available names
	for i := 0; i < count; i++ {
		var providerName string
		if i < len(providerNames) {
			providerName = providerNames[i]
		} else {
			providerName = fmt.Sprintf("Gas Provider %d", i+1)
		}

		email := fmt.Sprintf("provider%d@example.com", i+1)
		// Generate unique phone numbers (Zambian format)
		phone := fmt.Sprintf("+260971100%03d", i)

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}

		newUser := &user.User{
			ID:            uuid.New(),
			Email:         email,
			Password:      string(hashedPassword),
			Name:          providerName,
			PhoneNumber:   phone,
			UserType:      user.UserTypeProvider,
			Rating:        4 + i%2,
			PhoneVerified: true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		// Set location for providers within Lusaka
		// Lusaka center: -12.9165, 28.2949
		// Spread across ~15km radius
		baseLat := -12.9165
		baseLon := 28.2949
		lat := baseLat + (float64(i%10) * 0.015) - 0.075
		lon := baseLon + (float64(i/10) * 0.015) - 0.030
		newUser.Latitude = &lat
		newUser.Longitude = &lon

		// Insert into database
		_, err = s.db.Exec(ctx,
			`INSERT INTO users (id, email, password, name, phone_number, user_type, latitude, longitude, rating, phone_verified, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			newUser.ID, newUser.Email, newUser.Password, newUser.Name, newUser.PhoneNumber,
			newUser.UserType, newUser.Latitude, newUser.Longitude, newUser.Rating, newUser.PhoneVerified,
			newUser.CreatedAt, newUser.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert provider: %w", err)
		}

		s.providers = append(s.providers, newUser)
	}

	return nil
}

func (s *SeedData) createUsers(ctx context.Context, count int) error {
	for i := 0; i < count; i++ {
		name := sampleNames[i%len(sampleNames)]
		email := fmt.Sprintf("user%d@example.com", i+1)
		// Generate unique phone numbers for users (Zambian format)
		phone := fmt.Sprintf("+260977200%03d", i)

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}

		newUser := &user.User{
			ID:            uuid.New(),
			Email:         email,
			Password:      string(hashedPassword),
			Name:          name,
			PhoneNumber:   phone,
			UserType:      user.UserTypeCustomer,
			PhoneVerified: true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		// Set location for customers within Lusaka
		// Lusaka center: -12.9165, 28.2949
		baseLat := -12.9165
		baseLon := 28.2949
		lat := baseLat + (float64(i%8) * 0.02) - 0.070
		lon := baseLon + (float64(i/8) * 0.02) - 0.040
		newUser.Latitude = &lat
		newUser.Longitude = &lon

		// Insert into database
		_, err = s.db.Exec(ctx,
			`INSERT INTO users (id, email, password, name, phone_number, user_type, latitude, longitude, phone_verified, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			newUser.ID, newUser.Email, newUser.Password, newUser.Name, newUser.PhoneNumber,
			newUser.UserType, newUser.Latitude, newUser.Longitude, newUser.PhoneVerified,
			newUser.CreatedAt, newUser.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert user: %w", err)
		}

		s.users = append(s.users, newUser)
	}

	return nil
}

func (s *SeedData) createCouriers(ctx context.Context, count int) error {
	for i := 0; i < count; i++ {
		courierName := fmt.Sprintf("Courier %d", i+1)
		email := fmt.Sprintf("courier%d@example.com", i+1)
		// Generate unique phone numbers for couriers (Zambian format)
		phone := fmt.Sprintf("+260966300%03d", i)

		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}

		newUser := &user.User{
			ID:            uuid.New(),
			Email:         email,
			Password:      string(hashedPassword),
			Name:          courierName,
			PhoneNumber:   phone,
			UserType:      user.UserTypeCourier,
			Rating:        5,
			PhoneVerified: true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		// Set location for couriers within Lusaka
		// Lusaka center: -12.9165, 28.2949
		baseLat := -12.9165
		baseLon := 28.2949
		lat := baseLat + (float64(i) * 0.030) - 0.030
		lon := baseLon + (float64(i) * 0.030) - 0.030
		newUser.Latitude = &lat
		newUser.Longitude = &lon

		// Insert into database
		_, err = s.db.Exec(ctx,
			`INSERT INTO users (id, email, password, name, phone_number, user_type, latitude, longitude, rating, phone_verified, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
			newUser.ID, newUser.Email, newUser.Password, newUser.Name, newUser.PhoneNumber,
			newUser.UserType, newUser.Latitude, newUser.Longitude, newUser.Rating, newUser.PhoneVerified,
			newUser.CreatedAt, newUser.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert courier: %w", err)
		}

		s.couriers = append(s.couriers, newUser)
	}

	return nil
}

func (s *SeedData) createOrders(ctx context.Context, count int) error {
	for i := 0; i < count; i++ {
		// Pick random user, provider, and courier
		usr := s.users[i%len(s.users)]
		provider := s.providers[i%len(s.providers)]
		var courier *user.User
		if i%2 == 0 && len(s.couriers) > 0 {
			courier = s.couriers[i%len(s.couriers)]
		}

		cylinderType := sampleCylinderTypes[i%len(sampleCylinderTypes)]
		quantity := (i % 3) + 1
		pricePerUnit := 45000.0 // TZS
		totalPrice := pricePerUnit * float64(quantity)
		deliveryFee := 5000.0
		serviceCharge := totalPrice * 0.05
		grandTotal := totalPrice + deliveryFee + serviceCharge

		status := sampleOrderStatuses[i%len(sampleOrderStatuses)]
		paymentStatus := samplePaymentStatuses[i%len(samplePaymentStatuses)]

		newOrder := &order.Order{
			ID:              uuid.New(),
			UserID:          usr.ID,
			ProviderID:      &provider.ID,
			CourierID:       nil,
			Status:          status,
			CylinderType:    cylinderType,
			Quantity:        quantity,
			PricePerUnit:    pricePerUnit,
			TotalPrice:      totalPrice,
			DeliveryFee:     deliveryFee,
			ServiceCharge:   serviceCharge,
			GrandTotal:      grandTotal,
			DeliveryAddress: sampleAddresses[(i*2)%len(sampleAddresses)],
			DeliveryMethod:  "delivery",
			PaymentMethod:   "mobile-money",
			PaymentStatus:   paymentStatus,
			CreatedAt:       time.Now().Add(-time.Duration(i*2) * time.Hour),
			UpdatedAt:       time.Now(),
		}

		// Set location info if courier exists
		if courier != nil && courier.Latitude != nil && courier.Longitude != nil {
			newOrder.CurrentLatitude = courier.Latitude
			newOrder.CurrentLongitude = courier.Longitude
			newOrder.CurrentAddress = &newOrder.DeliveryAddress
		}

		// Set courier ID if available
		var courierID *uuid.UUID
		if courier != nil {
			courierID = &courier.ID
			newOrder.CourierID = courierID
		}

		// Insert into database
		_, err := s.db.Exec(ctx,
			`INSERT INTO orders (id, user_id, provider_id, courier_id, status, cylinder_type, quantity,
			 price_per_unit, total_price, delivery_fee, service_charge, grand_total,
			 delivery_address, delivery_method, payment_method, payment_status,
			 current_latitude, current_longitude, current_address, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
			newOrder.ID, newOrder.UserID, newOrder.ProviderID, courierID, newOrder.Status,
			newOrder.CylinderType, newOrder.Quantity, newOrder.PricePerUnit, newOrder.TotalPrice,
			newOrder.DeliveryFee, newOrder.ServiceCharge, newOrder.GrandTotal,
			newOrder.DeliveryAddress, newOrder.DeliveryMethod, newOrder.PaymentMethod,
			newOrder.PaymentStatus, newOrder.CurrentLatitude, newOrder.CurrentLongitude,
			newOrder.CurrentAddress, newOrder.CreatedAt, newOrder.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert order: %w", err)
		}

		s.orders = append(s.orders, newOrder)
	}

	return nil
}
