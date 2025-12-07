package admin

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test database setup helper
func setupTestDB(t *testing.T) *pgxpool.Pool {
	dbURL := "postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres"

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	require.NoError(t, err)

	// Test connection
	err = pool.Ping(ctx)
	require.NoError(t, err)

	t.Cleanup(func() {
		pool.Close()
	})

	return pool
}

// TestGetDashboardSummary tests dashboard summary retrieval
func TestGetDashboardSummary(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	summary, err := repo.GetDashboardSummary(ctx)
	require.NoError(t, err)
	assert.NotNil(t, summary)
	assert.GreaterOrEqual(t, summary.ActiveUsers, 0)
	assert.GreaterOrEqual(t, summary.ActiveProviders, 0)
	assert.GreaterOrEqual(t, summary.ActiveCouriers, 0)
	assert.GreaterOrEqual(t, summary.TotalRevenue, 0.0)
}

// TestGetDailyAnalytics tests daily analytics retrieval
func TestGetDailyAnalytics(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	analytics, err := repo.GetDailyAnalytics(ctx, 10, 0)
	require.NoError(t, err)
	assert.NotNil(t, analytics)
	assert.LessOrEqual(t, len(analytics), 10)

	if len(analytics) > 0 {
		assert.NotEmpty(t, analytics[0].AnalyticsDate)
		assert.GreaterOrEqual(t, analytics[0].TotalOrders, 0)
		assert.GreaterOrEqual(t, analytics[0].TotalRevenue, 0.0)
	}
}

// TestGetProviders tests provider retrieval
func TestGetProviders(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	providers, err := repo.GetProviders(ctx, 10, 0)
	require.NoError(t, err)
	assert.NotNil(t, providers)
	assert.GreaterOrEqual(t, len(providers), 0)

	if len(providers) > 0 {
		assert.NotEmpty(t, providers[0].Name)
		assert.NotEmpty(t, providers[0].ID)
		assert.NotEmpty(t, providers[0].Email)
	}
}

// TestGetAdminSettings tests admin settings retrieval
func TestGetAdminSettings(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	settings, err := repo.GetAdminSettings(ctx)
	require.NoError(t, err)
	assert.NotNil(t, settings)
	assert.Greater(t, len(settings), 0)

	// Verify specific settings exist
	settingKeys := make(map[string]bool)
	for _, s := range settings {
		settingKeys[s.SettingKey] = true
	}

	assert.True(t, settingKeys["currency"], "currency setting should exist")
	assert.True(t, settingKeys["platform_commission_percentage"], "platform_commission_percentage setting should exist")
}

// TestGetAdminSetting tests retrieving a specific setting
func TestGetAdminSetting(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	setting, err := repo.GetAdminSetting(ctx, "currency")
	require.NoError(t, err)
	assert.NotNil(t, setting)
	assert.Equal(t, "currency", setting.SettingKey)
	assert.NotEmpty(t, setting.SettingValue)
}

// TestUpdateAdminSetting tests updating a setting
func TestUpdateAdminSetting(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	testDesc := "Test description"
	req := UpdateAdminSettingRequest{
		SettingValue: "TEST_VALUE",
		Description:  &testDesc,
	}

	err := repo.UpdateAdminSetting(ctx, "test_setting_key", req)
	// This might fail if the key doesn't exist, which is expected
	// The test is mainly to ensure the function works without panicking
	_ = err // Silently handle error for non-existent key

	// Try updating an existing setting
	req.SettingValue = "ZMW"
	err = repo.UpdateAdminSetting(ctx, "currency", req)
	require.NoError(t, err)

	// Verify the update
	setting, err := repo.GetAdminSetting(ctx, "currency")
	require.NoError(t, err)
	assert.Equal(t, "ZMW", setting.SettingValue)
}

// TestGetTransactionFees tests transaction fee retrieval
func TestGetTransactionFees(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	fees, err := repo.GetTransactionFees(ctx)
	require.NoError(t, err)
	assert.NotNil(t, fees)
	assert.Greater(t, len(fees), 0)

	// Verify expected fee types exist
	feeTypes := make(map[string]bool)
	for _, f := range fees {
		feeTypes[f.FeeType] = true
		assert.True(t, f.IsActive, "fee should be active")
		assert.GreaterOrEqual(t, f.Percentage+f.FixedAmount, 0.0, "fee should be positive")
	}

	assert.True(t, feeTypes["platform_commission"], "platform_commission fee should exist")
}

// TestGetCouriers tests courier retrieval
func TestGetCouriers(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	couriers, err := repo.GetCouriers(ctx, 10, 0)
	require.NoError(t, err)
	assert.NotNil(t, couriers)

	if len(couriers) > 0 {
		assert.NotEmpty(t, couriers[0].Name)
		assert.NotEmpty(t, couriers[0].ID)
	}
}

// TestGetProviderCylinderPricing tests cylinder pricing retrieval
func TestGetProviderCylinderPricing(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	// Get first provider
	providers, err := repo.GetProviders(ctx, 1, 0)
	require.NoError(t, err)
	require.Greater(t, len(providers), 0)

	// Get cylinder pricing for that provider
	pricing, err := repo.GetProviderCylinderPricing(ctx, providers[0].ID)
	require.NoError(t, err)
	assert.NotNil(t, pricing)
	assert.Greater(t, len(pricing), 0)

	// Verify pricing structure
	for _, p := range pricing {
		assert.NotEmpty(t, p.CylinderType)
		assert.Greater(t, p.RefillPrice, 0.0)
		assert.Greater(t, p.BuyPrice, 0.0)
	}
}

// TestGetProviderInventory tests inventory retrieval
func TestGetProviderInventory(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	// Get first provider
	providers, err := repo.GetProviders(ctx, 1, 0)
	require.NoError(t, err)
	require.Greater(t, len(providers), 0)

	// Get inventory for that provider
	inventory, err := repo.GetProviderInventory(ctx, providers[0].ID)
	require.NoError(t, err)
	assert.NotNil(t, inventory)
	assert.Greater(t, len(inventory), 0)

	// Verify inventory structure
	for _, inv := range inventory {
		assert.NotEmpty(t, inv.CylinderType)
		assert.GreaterOrEqual(t, inv.Stock, 0)
		assert.Greater(t, inv.Price, 0.0)
	}
}

// TestGetProviderMetrics tests metrics retrieval
func TestGetProviderMetrics(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	// Get first provider
	providers, err := repo.GetProviders(ctx, 1, 0)
	require.NoError(t, err)
	require.Greater(t, len(providers), 0)

	// Get metrics for that provider
	metrics, err := repo.GetProviderMetrics(ctx, providers[0].ID, 7)
	require.NoError(t, err)
	assert.NotNil(t, metrics)

	if len(metrics) > 0 {
		assert.GreaterOrEqual(t, metrics[0].OrdersCount, 0)
		assert.GreaterOrEqual(t, metrics[0].Revenue, 0.0)
		assert.GreaterOrEqual(t, metrics[0].CompletedOrders, 0)
	}
}

// TestGetAvailableCylinderProviders tests finding providers by cylinder type
func TestGetAvailableCylinderProviders(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	// Lusaka center coordinates
	latitude := -12.9165
	longitude := 28.2949
	radiusKm := 20.0

	providers, err := repo.GetAvailableCylinderProviders(ctx, "5KG", latitude, longitude, radiusKm)
	// This might return 0 providers if none are within radius, which is acceptable
	assert.NoError(t, err)
	assert.NotNil(t, providers)

	if len(providers) > 0 {
		for _, p := range providers {
			assert.NotEmpty(t, p.ProviderID)
			assert.NotEmpty(t, p.ProviderName)
			assert.Greater(t, p.Rating, 0.0)
			assert.Greater(t, len(p.Cylinders), 0)

			// Verify cylinder info
			for _, cyl := range p.Cylinders {
				assert.NotEmpty(t, cyl.CylinderType)
				assert.Greater(t, cyl.RefillPrice, 0.0)
				assert.Greater(t, cyl.BuyPrice, 0.0)
				assert.GreaterOrEqual(t, cyl.Stock, 0)
			}
		}
	}
}

// TestProviderStatusUpdate tests provider status updates
func TestProviderStatusUpdate(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	pool := setupTestDB(t)
	repo := NewRepository(pool)
	ctx := context.Background()

	// Get first provider
	providers, err := repo.GetProviders(ctx, 1, 0)
	require.NoError(t, err)
	require.Greater(t, len(providers), 0)

	providerID := providers[0].ID

	// Update provider status
	testReason := "Test deactivation"
	req := UpdateProviderStatusRequest{
		IsActive:           false,
		IsVerified:         false,
		DeactivationReason: &testReason,
	}

	err = repo.UpdateProviderStatus(ctx, providerID, req)
	require.NoError(t, err)

	// Verify the update
	status, err := repo.GetProviderStatus(ctx, providerID)
	require.NoError(t, err)
	assert.False(t, status.IsActive)
	assert.False(t, status.IsVerified)
	assert.NotNil(t, status.DeactivationReason)

	// Restore original state
	req.IsActive = true
	req.IsVerified = true
	err = repo.UpdateProviderStatus(ctx, providerID, req)
	require.NoError(t, err)
}

// BenchmarkGetDashboardSummary benchmarks dashboard summary retrieval
func BenchmarkGetDashboardSummary(b *testing.B) {
	pool := setupTestDB(&testing.T{})
	repo := NewRepository(pool)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = repo.GetDashboardSummary(ctx)
	}
}

// BenchmarkGetProviders benchmarks provider retrieval
func BenchmarkGetProviders(b *testing.B) {
	pool := setupTestDB(&testing.T{})
	repo := NewRepository(pool)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = repo.GetProviders(ctx, 10, 0)
	}
}

// BenchmarkGetAdminSettings benchmarks settings retrieval
func BenchmarkGetAdminSettings(b *testing.B) {
	pool := setupTestDB(&testing.T{})
	repo := NewRepository(pool)
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = repo.GetAdminSettings(ctx)
	}
}
