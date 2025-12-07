package main

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
)

// Cylinder pricing per type in Kwacha (ZMW)
// Base: 5KG = 200 ZMW refill
var cylinderPrices = map[string]map[string]float64{
	"3KG": {
		"refill": 120,
		"buy":    400,
	},
	"5KG": {
		"refill": 200,
		"buy":    750,
	},
	"12KG": {
		"refill": 480,
		"buy":    1800,
	},
	"15KG": {
		"refill": 600,
		"buy":    2200,
	},
	"20KG": {
		"refill": 800,
		"buy":    3000,
	},
}

// Provider pricing variations (percentage variance from base prices)
var priceVariations = []float64{-0.10, -0.05, 0, 0.05, 0.10, 0.15}

func (s *SeedData) seedCylinderPricing(ctx context.Context) error {
	fmt.Println("Seeding cylinder pricing for providers...")

	cylinderTypes := []string{"3KG", "5KG", "12KG", "15KG", "20KG"}

	for providerIdx, provider := range s.providers {
		// Each provider has slightly different prices
		priceVariation := priceVariations[providerIdx%len(priceVariations)]

		for _, cylinderType := range cylinderTypes {
			basePrice := cylinderPrices[cylinderType]["refill"]
			adjustedRefillPrice := basePrice * (1 + priceVariation)
			adjustedBuyPrice := cylinderPrices[cylinderType]["buy"] * (1 + priceVariation)

			_, err := s.db.Exec(ctx,
				`INSERT INTO cylinder_pricing (id, provider_id, cylinder_type, refill_price, buy_price, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (provider_id, cylinder_type) DO UPDATE SET
				refill_price = $4, buy_price = $5, updated_at = $7`,
				uuid.New(), provider.ID, cylinderType, adjustedRefillPrice, adjustedBuyPrice,
				time.Now(), time.Now(),
			)
			if err != nil {
				return fmt.Errorf("failed to insert cylinder pricing: %w", err)
			}
		}
	}

	fmt.Printf("✓ Seeded cylinder pricing for %d providers\n", len(s.providers))
	return nil
}

func (s *SeedData) seedProviderInventory(ctx context.Context) error {
	fmt.Println("Seeding provider inventory...")

	cylinderTypes := []string{"3KG", "5KG", "12KG", "15KG", "20KG"}
	stockLevels := []int{50, 75, 100, 150, 200}

	for providerIdx, provider := range s.providers {
		for cylinderIdx, cylinderType := range cylinderTypes {
			stock := stockLevels[cylinderIdx]
			// Vary stock by provider
			stock = stock + (providerIdx%5)*10

			price := cylinderPrices[cylinderType]["refill"]
			priceVariation := priceVariations[providerIdx%len(priceVariations)]
			adjustedPrice := price * (1 + priceVariation)

			_, err := s.db.Exec(ctx,
				`INSERT INTO inventory (id, provider_id, cylinder_type, stock, price, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (provider_id, cylinder_type) DO UPDATE SET
				stock = $4, price = $5, updated_at = $7`,
				uuid.New(), provider.ID, cylinderType, stock, adjustedPrice,
				time.Now(), time.Now(),
			)
			if err != nil {
				return fmt.Errorf("failed to insert inventory: %w", err)
			}
		}
	}

	fmt.Printf("✓ Seeded inventory for %d providers\n", len(s.providers))
	return nil
}

func (s *SeedData) seedUserPreferences(ctx context.Context) error {
	fmt.Println("Seeding user preferences...")

	cylinderTypes := []string{"3KG", "5KG", "12KG", "15KG", "20KG"}

	for userIdx, usr := range s.users {
		// Assign preferred cylinder type
		cylinderType := cylinderTypes[userIdx%len(cylinderTypes)]

		// Use user's current location as preference
		lat := usr.Latitude
		lon := usr.Longitude
		address := fmt.Sprintf("%s, Lusaka", sampleAddresses[userIdx%len(sampleAddresses)])

		_, err := s.db.Exec(ctx,
			`INSERT INTO user_preferences (id, user_id, preferred_cylinder_type, preferred_latitude, preferred_longitude, preferred_address, delivery_radius_km, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (user_id) DO UPDATE SET
			preferred_cylinder_type = $3, preferred_latitude = $4, preferred_longitude = $5, preferred_address = $6, updated_at = $9`,
			uuid.New(), usr.ID, cylinderType, lat, lon, address, 10,
			time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert user preference: %w", err)
		}
	}

	fmt.Printf("✓ Seeded preferences for %d customers\n", len(s.users))
	return nil
}

func (s *SeedData) seedProviderStatus(ctx context.Context) error {
	fmt.Println("Seeding provider status...")

	for _, provider := range s.providers {
		isActive := true
		isVerified := true
		verificationDate := time.Now().Add(-30 * 24 * time.Hour)
		rating := 4.0 + float64((provider.Rating % 2))

		_, err := s.db.Exec(ctx,
			`INSERT INTO provider_status (id, provider_id, is_active, is_verified, verification_date, avg_rating, total_orders, total_revenue, response_time_minutes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			ON CONFLICT (provider_id) DO UPDATE SET
			is_active = $3, is_verified = $4, avg_rating = $6, updated_at = $11`,
			uuid.New(), provider.ID, isActive, isVerified, verificationDate, rating, 0, 0.0, 15,
			time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert provider status: %w", err)
		}
	}

	fmt.Printf("✓ Seeded status for %d providers\n", len(s.providers))
	return nil
}

func (s *SeedData) seedCourierStatus(ctx context.Context) error {
	fmt.Println("Seeding courier status...")

	for _, courier := range s.couriers {
		isActive := true
		isVerified := true
		isAvailable := true
		verificationDate := time.Now().Add(-20 * 24 * time.Hour)
		rating := 5.0

		_, err := s.db.Exec(ctx,
			`INSERT INTO courier_status (id, courier_id, is_active, is_verified, verification_date, avg_rating, total_deliveries, total_earnings, avg_delivery_time_minutes, is_available, last_location_update, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			ON CONFLICT (courier_id) DO UPDATE SET
			is_active = $3, is_verified = $4, avg_rating = $6, is_available = $10, updated_at = $13`,
			uuid.New(), courier.ID, isActive, isVerified, verificationDate, rating, 0, 0.0, 20, isAvailable, time.Now(),
			time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert courier status: %w", err)
		}
	}

	fmt.Printf("✓ Seeded status for %d couriers\n", len(s.couriers))
	return nil
}

func (s *SeedData) seedTransactionFees(ctx context.Context) error {
	fmt.Println("Seeding transaction fees...")

	fees := []struct {
		feeType     string
		percentage  float64
		fixedAmount float64
		description string
	}{
		{"platform_commission", 5.0, 0, "5% platform commission on all orders"},
		{"delivery_fee", 0, 5000, "Fixed 5000 ZMW delivery fee"},
		{"service_charge", 2.5, 0, "2.5% service charge"},
		{"transaction_fee", 1.0, 0, "1% transaction processing fee"},
	}

	for _, fee := range fees {
		_, err := s.db.Exec(ctx,
			`INSERT INTO transaction_fees (id, fee_type, percentage, fixed_amount, is_active, description, effective_from, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			uuid.New(), fee.feeType, fee.percentage, fee.fixedAmount, true, fee.description,
			time.Now(), time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert transaction fee: %w", err)
		}
	}

	fmt.Printf("✓ Seeded %d transaction fee types\n", len(fees))
	return nil
}

func (s *SeedData) seedAdminSettings(ctx context.Context) error {
	fmt.Println("Seeding admin settings...")

	settings := []struct {
		key         string
		value       string
		dataType    string
		description string
	}{
		{"currency", "ZMW", "string", "Platform currency"},
		{"currency_symbol", "ZK", "string", "Currency symbol"},
		{"min_order_value", "5000", "integer", "Minimum order value in ZMW"},
		{"max_delivery_radius", "25", "integer", "Maximum delivery radius in kilometers"},
		{"platform_commission_percentage", "5", "decimal", "Default platform commission percentage"},
		{"refund_window_hours", "24", "integer", "Hours within which refunds are allowed"},
		{"payment_gateway", "pawapay", "string", "Payment gateway provider"},
		{"support_email", "support@lpgfinder.zm", "string", "Support email address"},
		{"support_phone", "+260971234567", "string", "Support phone number"},
	}

	for _, setting := range settings {
		_, err := s.db.Exec(ctx,
			`INSERT INTO admin_settings (id, setting_key, setting_value, data_type, description, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (setting_key) DO UPDATE SET
			setting_value = $3, updated_at = $7`,
			uuid.New(), setting.key, setting.value, setting.dataType, setting.description,
			time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert admin setting: %w", err)
		}
	}

	fmt.Printf("✓ Seeded %d admin settings\n", len(settings))
	return nil
}

func (s *SeedData) seedDailyAnalytics(ctx context.Context) error {
	fmt.Println("Seeding daily analytics...")

	// Create analytics for the last 30 days
	for daysAgo := 29; daysAgo >= 0; daysAgo-- {
		analyticsDate := time.Now().AddDate(0, 0, -daysAgo)

		totalOrders := 10 + (daysAgo % 20)
		completedOrders := totalOrders - (daysAgo % 5)
		activeOrders := totalOrders - completedOrders
		totalRevenue := float64(completedOrders) * 50000 // Average order value

		_, err := s.db.Exec(ctx,
			`INSERT INTO daily_analytics (id, analytics_date, total_orders, completed_orders, pending_orders, total_revenue, total_transactions, active_providers, active_couriers, active_customers, avg_order_value, avg_delivery_time_minutes, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			ON CONFLICT (analytics_date) DO UPDATE SET
			total_orders = $3, completed_orders = $4, pending_orders = $5, total_revenue = $6, updated_at = $14`,
			uuid.New(), analyticsDate.Format("2006-01-02"), totalOrders, completedOrders, activeOrders,
			totalRevenue, completedOrders, len(s.providers), len(s.couriers), len(s.users),
			totalRevenue/float64(totalOrders), 20, time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert daily analytics: %w", err)
		}
	}

	fmt.Println("✓ Seeded daily analytics for 30 days")
	return nil
}

func (s *SeedData) seedProviderMetrics(ctx context.Context) error {
	fmt.Println("Seeding provider metrics...")

	for _, provider := range s.providers {
		// Create metrics for last 7 days
		for daysAgo := 6; daysAgo >= 0; daysAgo-- {
			metricsDate := time.Now().AddDate(0, 0, -daysAgo)
			ordersCount := 2 + (daysAgo % 4)
			revenue := float64(ordersCount) * 50000
			completedOrders := ordersCount - (daysAgo % 2)

			_, err := s.db.Exec(ctx,
				`INSERT INTO provider_metrics (id, provider_id, metric_date, orders_count, revenue, completed_orders, avg_rating, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				ON CONFLICT (provider_id, metric_date) DO UPDATE SET
				orders_count = $4, revenue = $5, completed_orders = $6`,
				uuid.New(), provider.ID, metricsDate.Format("2006-01-02"), ordersCount, revenue, completedOrders,
				4.0+float64(provider.Rating%2), time.Now(),
			)
			if err != nil {
				return fmt.Errorf("failed to insert provider metrics: %w", err)
			}
		}
	}

	fmt.Printf("✓ Seeded metrics for %d providers\n", len(s.providers))
	return nil
}

func seedAdminData(pool *pgxpool.Pool, ctx context.Context, providers, users, couriers []*user.User) error {
	seed := &SeedData{
		db:        pool,
		providers: providers,
		users:     users,
		couriers:  couriers,
	}

	fmt.Println("\n📊 Seeding admin data...")

	if err := seed.seedCylinderPricing(ctx); err != nil {
		return fmt.Errorf("failed to seed cylinder pricing: %w", err)
	}

	if err := seed.seedProviderInventory(ctx); err != nil {
		return fmt.Errorf("failed to seed inventory: %w", err)
	}

	if err := seed.seedUserPreferences(ctx); err != nil {
		return fmt.Errorf("failed to seed user preferences: %w", err)
	}

	if err := seed.seedProviderStatus(ctx); err != nil {
		return fmt.Errorf("failed to seed provider status: %w", err)
	}

	if err := seed.seedCourierStatus(ctx); err != nil {
		return fmt.Errorf("failed to seed courier status: %w", err)
	}

	if err := seed.seedTransactionFees(ctx); err != nil {
		return fmt.Errorf("failed to seed transaction fees: %w", err)
	}

	if err := seed.seedAdminSettings(ctx); err != nil {
		return fmt.Errorf("failed to seed admin settings: %w", err)
	}

	if err := seed.seedDailyAnalytics(ctx); err != nil {
		return fmt.Errorf("failed to seed daily analytics: %w", err)
	}

	if err := seed.seedProviderMetrics(ctx); err != nil {
		return fmt.Errorf("failed to seed provider metrics: %w", err)
	}

	fmt.Println("✨ Admin data seeding completed!")
	return nil
}
