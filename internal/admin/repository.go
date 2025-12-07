package admin

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	// Dashboard
	GetDashboardSummary(ctx context.Context) (*DashboardSummary, error)
	GetDailyAnalytics(ctx context.Context, limit int, offset int) ([]DailyAnalytics, error)

	// Provider Management
	GetProviders(ctx context.Context, limit int, offset int) ([]ProviderWithStatus, error)
	GetProviderStatus(ctx context.Context, providerID uuid.UUID) (*ProviderStatus, error)
	UpdateProviderStatus(ctx context.Context, providerID uuid.UUID, req UpdateProviderStatusRequest) error

	// Courier Management
	GetCouriers(ctx context.Context, limit int, offset int) ([]CourierWithStatus, error)
	GetCourierStatus(ctx context.Context, courierID uuid.UUID) (*CourierStatus, error)
	UpdateCourierStatus(ctx context.Context, courierID uuid.UUID, req UpdateCourierStatusRequest) error

	// Settings
	GetAdminSettings(ctx context.Context) ([]AdminSetting, error)
	GetAdminSetting(ctx context.Context, key string) (*AdminSetting, error)
	UpdateAdminSetting(ctx context.Context, key string, req UpdateAdminSettingRequest) error

	// Transaction Fees
	GetTransactionFees(ctx context.Context) ([]TransactionFee, error)

	// User Preferences
	GetUserPreferences(ctx context.Context, userID uuid.UUID) (*UserPreferences, error)

	// Cylinder Pricing
	GetProviderCylinderPricing(ctx context.Context, providerID uuid.UUID) ([]CylinderPricing, error)
	GetAvailableCylinderProviders(ctx context.Context, cylinderType string, latitude, longitude, radiusKm float64) ([]ProviderCylinderInfo, error)

	// Inventory
	GetProviderInventory(ctx context.Context, providerID uuid.UUID) ([]Inventory, error)

	// Provider Metrics
	GetProviderMetrics(ctx context.Context, providerID uuid.UUID, days int) ([]ProviderMetrics, error)
}

type repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &repository{pool: pool}
}

// GetDashboardSummary retrieves overall dashboard statistics
func (r *repository) GetDashboardSummary(ctx context.Context) (*DashboardSummary, error) {
	summary := &DashboardSummary{}

	err := r.pool.QueryRow(ctx,
		`SELECT
			(SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
			(SELECT COUNT(*) FROM users WHERE user_type = 'provider' AND is_active = true) as active_providers,
			(SELECT COUNT(*) FROM users WHERE user_type = 'courier' AND is_active = true) as active_couriers,
			(SELECT COUNT(*) FROM orders WHERE status = 'delivered') as completed_orders,
			(SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'accepted', 'in-transit')) as active_orders,
			COALESCE((SELECT SUM(grand_total) FROM orders WHERE status = 'delivered'), 0) as total_revenue,
			COALESCE((SELECT AVG(rating) FROM users WHERE user_type = 'provider' AND is_active = true), 0) as avg_provider_rating`,
	).Scan(
		&summary.ActiveUsers,
		&summary.ActiveProviders,
		&summary.ActiveCouriers,
		&summary.CompletedOrders,
		&summary.ActiveOrders,
		&summary.TotalRevenue,
		&summary.AvgProviderRating,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard summary: %w", err)
	}

	summary.CreatedAt = ctx.Value("timestamp").(interface{}).(time.Time)
	return summary, nil
}

// GetDailyAnalytics retrieves daily analytics data
func (r *repository) GetDailyAnalytics(ctx context.Context, limit int, offset int) ([]DailyAnalytics, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, analytics_date, total_orders, completed_orders, pending_orders,
				total_revenue, total_transactions, active_providers, active_couriers, active_customers,
				avg_order_value, avg_delivery_time_minutes, created_at, updated_at
		 FROM daily_analytics
		 ORDER BY analytics_date DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get daily analytics: %w", err)
	}
	defer rows.Close()

	var analytics []DailyAnalytics
	for rows.Next() {
		var a DailyAnalytics
		if err := rows.Scan(
			&a.ID, &a.AnalyticsDate, &a.TotalOrders, &a.CompletedOrders, &a.PendingOrders,
			&a.TotalRevenue, &a.TotalTransactions, &a.ActiveProviders, &a.ActiveCouriers, &a.ActiveCustomers,
			&a.AvgOrderValue, &a.AvgDeliveryTimeMinutes, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan daily analytics: %w", err)
		}
		analytics = append(analytics, a)
	}

	return analytics, nil
}

// GetProviders retrieves all providers with status
func (r *repository) GetProviders(ctx context.Context, limit int, offset int) ([]ProviderWithStatus, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT u.id, u.name, u.email, u.phone_number, u.latitude, u.longitude,
				ps.is_active, ps.is_verified, ps.avg_rating, ps.total_orders, ps.total_revenue, ps.response_time_minutes,
				u.created_at
		 FROM users u
		 LEFT JOIN provider_status ps ON u.id = ps.provider_id
		 WHERE u.user_type = 'provider'
		 ORDER BY u.created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get providers: %w", err)
	}
	defer rows.Close()

	var providers []ProviderWithStatus
	for rows.Next() {
		var p ProviderWithStatus
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Email, &p.PhoneNumber, &p.Latitude, &p.Longitude,
			&p.IsActive, &p.IsVerified, &p.AvgRating, &p.TotalOrders, &p.TotalRevenue, &p.ResponseTimeMinutes,
			&p.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan provider: %w", err)
		}
		providers = append(providers, p)
	}

	return providers, nil
}

// GetProviderStatus retrieves status for a specific provider
func (r *repository) GetProviderStatus(ctx context.Context, providerID uuid.UUID) (*ProviderStatus, error) {
	var ps ProviderStatus

	err := r.pool.QueryRow(ctx,
		`SELECT id, provider_id, is_active, is_verified, verification_date, avg_rating,
				total_orders, total_revenue, response_time_minutes, deactivation_reason, deactivated_at,
				created_at, updated_at
		 FROM provider_status
		 WHERE provider_id = $1`,
		providerID,
	).Scan(
		&ps.ID, &ps.ProviderID, &ps.IsActive, &ps.IsVerified, &ps.VerificationDate, &ps.AvgRating,
		&ps.TotalOrders, &ps.TotalRevenue, &ps.ResponseTimeMinutes, &ps.DeactivationReason, &ps.DeactivatedAt,
		&ps.CreatedAt, &ps.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get provider status: %w", err)
	}

	return &ps, nil
}

// UpdateProviderStatus updates provider status
func (r *repository) UpdateProviderStatus(ctx context.Context, providerID uuid.UUID, req UpdateProviderStatusRequest) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE provider_status
		 SET is_active = $1, is_verified = $2, deactivation_reason = $3, updated_at = NOW()
		 WHERE provider_id = $4`,
		req.IsActive, req.IsVerified, req.DeactivationReason, providerID,
	)
	if err != nil {
		return fmt.Errorf("failed to update provider status: %w", err)
	}

	// Also update users table
	_, err = r.pool.Exec(ctx,
		`UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`,
		req.IsActive, providerID,
	)

	return err
}

// GetCouriers retrieves all couriers with status
func (r *repository) GetCouriers(ctx context.Context, limit int, offset int) ([]CourierWithStatus, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT u.id, u.name, u.email, u.phone_number, u.latitude, u.longitude,
				cs.is_active, cs.is_verified, cs.avg_rating, cs.total_deliveries, cs.total_earnings, cs.is_available,
				u.created_at
		 FROM users u
		 LEFT JOIN courier_status cs ON u.id = cs.courier_id
		 WHERE u.user_type = 'courier'
		 ORDER BY u.created_at DESC
		 LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get couriers: %w", err)
	}
	defer rows.Close()

	var couriers []CourierWithStatus
	for rows.Next() {
		var c CourierWithStatus
		if err := rows.Scan(
			&c.ID, &c.Name, &c.Email, &c.PhoneNumber, &c.Latitude, &c.Longitude,
			&c.IsActive, &c.IsVerified, &c.AvgRating, &c.TotalDeliveries, &c.TotalEarnings, &c.IsAvailable,
			&c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan courier: %w", err)
		}
		couriers = append(couriers, c)
	}

	return couriers, nil
}

// GetCourierStatus retrieves status for a specific courier
func (r *repository) GetCourierStatus(ctx context.Context, courierID uuid.UUID) (*CourierStatus, error) {
	var cs CourierStatus

	err := r.pool.QueryRow(ctx,
		`SELECT id, courier_id, is_active, is_verified, verification_date, avg_rating,
				total_deliveries, total_earnings, avg_delivery_time_minutes, is_available, last_location_update,
				created_at, updated_at
		 FROM courier_status
		 WHERE courier_id = $1`,
		courierID,
	).Scan(
		&cs.ID, &cs.CourierID, &cs.IsActive, &cs.IsVerified, &cs.VerificationDate, &cs.AvgRating,
		&cs.TotalDeliveries, &cs.TotalEarnings, &cs.AvgDeliveryTimeMinutes, &cs.IsAvailable, &cs.LastLocationUpdate,
		&cs.CreatedAt, &cs.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get courier status: %w", err)
	}

	return &cs, nil
}

// UpdateCourierStatus updates courier status
func (r *repository) UpdateCourierStatus(ctx context.Context, courierID uuid.UUID, req UpdateCourierStatusRequest) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE courier_status
		 SET is_active = $1, is_verified = $2, is_available = $3, updated_at = NOW()
		 WHERE courier_id = $4`,
		req.IsActive, req.IsVerified, req.IsAvailable, courierID,
	)
	if err != nil {
		return fmt.Errorf("failed to update courier status: %w", err)
	}

	// Also update users table
	_, err = r.pool.Exec(ctx,
		`UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`,
		req.IsActive, courierID,
	)

	return err
}

// GetAdminSettings retrieves all settings
func (r *repository) GetAdminSettings(ctx context.Context) ([]AdminSetting, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, setting_key, setting_value, data_type, description, created_at, updated_at
		 FROM admin_settings
		 ORDER BY setting_key ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get admin settings: %w", err)
	}
	defer rows.Close()

	var settings []AdminSetting
	for rows.Next() {
		var s AdminSetting
		if err := rows.Scan(
			&s.ID, &s.SettingKey, &s.SettingValue, &s.DataType, &s.Description, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan admin setting: %w", err)
		}
		settings = append(settings, s)
	}

	return settings, nil
}

// GetAdminSetting retrieves a specific setting
func (r *repository) GetAdminSetting(ctx context.Context, key string) (*AdminSetting, error) {
	var s AdminSetting

	err := r.pool.QueryRow(ctx,
		`SELECT id, setting_key, setting_value, data_type, description, created_at, updated_at
		 FROM admin_settings
		 WHERE setting_key = $1`,
		key,
	).Scan(
		&s.ID, &s.SettingKey, &s.SettingValue, &s.DataType, &s.Description, &s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get admin setting: %w", err)
	}

	return &s, nil
}

// UpdateAdminSetting updates a specific setting
func (r *repository) UpdateAdminSetting(ctx context.Context, key string, req UpdateAdminSettingRequest) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE admin_settings
		 SET setting_value = $1, description = $2, updated_at = NOW()
		 WHERE setting_key = $3`,
		req.SettingValue, req.Description, key,
	)
	return err
}

// GetTransactionFees retrieves all active transaction fees
func (r *repository) GetTransactionFees(ctx context.Context) ([]TransactionFee, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, fee_type, percentage, fixed_amount, is_active, description, effective_from, effective_until,
				created_at, updated_at
		 FROM transaction_fees
		 WHERE is_active = true
		 ORDER BY fee_type ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction fees: %w", err)
	}
	defer rows.Close()

	var fees []TransactionFee
	for rows.Next() {
		var f TransactionFee
		if err := rows.Scan(
			&f.ID, &f.FeeType, &f.Percentage, &f.FixedAmount, &f.IsActive, &f.Description, &f.EffectiveFrom, &f.EffectiveUntil,
			&f.CreatedAt, &f.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan transaction fee: %w", err)
		}
		fees = append(fees, f)
	}

	return fees, nil
}

// GetUserPreferences retrieves preferences for a user
func (r *repository) GetUserPreferences(ctx context.Context, userID uuid.UUID) (*UserPreferences, error) {
	var up UserPreferences

	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, preferred_cylinder_type, preferred_latitude, preferred_longitude, preferred_address,
				delivery_radius_km, created_at, updated_at
		 FROM user_preferences
		 WHERE user_id = $1`,
		userID,
	).Scan(
		&up.ID, &up.UserID, &up.PreferredCylinderType, &up.PreferredLatitude, &up.PreferredLongitude, &up.PreferredAddress,
		&up.DeliveryRadiusKm, &up.CreatedAt, &up.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get user preferences: %w", err)
	}

	return &up, nil
}

// GetProviderCylinderPricing retrieves cylinder pricing for a provider
func (r *repository) GetProviderCylinderPricing(ctx context.Context, providerID uuid.UUID) ([]CylinderPricing, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, provider_id, cylinder_type, refill_price, buy_price, created_at, updated_at
		 FROM cylinder_pricing
		 WHERE provider_id = $1
		 ORDER BY cylinder_type ASC`,
		providerID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get provider cylinder pricing: %w", err)
	}
	defer rows.Close()

	var pricing []CylinderPricing
	for rows.Next() {
		var cp CylinderPricing
		if err := rows.Scan(
			&cp.ID, &cp.ProviderID, &cp.CylinderType, &cp.RefillPrice, &cp.BuyPrice, &cp.CreatedAt, &cp.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan cylinder pricing: %w", err)
		}
		pricing = append(pricing, cp)
	}

	return pricing, nil
}

// GetAvailableCylinderProviders retrieves providers with a specific cylinder type within radius
func (r *repository) GetAvailableCylinderProviders(ctx context.Context, cylinderType string, latitude, longitude, radiusKm float64) ([]ProviderCylinderInfo, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT
			u.id, u.name, u.latitude, u.longitude, u.rating,
			cp.cylinder_type, cp.refill_price, cp.buy_price, i.stock
		 FROM users u
		 JOIN cylinder_pricing cp ON u.id = cp.provider_id
		 JOIN inventory i ON u.id = i.provider_id AND cp.cylinder_type = i.cylinder_type
		 WHERE u.user_type = 'provider'
			 AND u.is_active = true
			 AND cp.cylinder_type = $1
			 AND i.stock > 0
			 AND (6371 * acos(cos(radians($2)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($3)) + sin(radians($2)) * sin(radians(u.latitude)))) <= $4
		 ORDER BY u.rating DESC, (6371 * acos(cos(radians($2)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians($3)) + sin(radians($2)) * sin(radians(u.latitude)))) ASC`,
		cylinderType, latitude, longitude, radiusKm,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get available providers: %w", err)
	}
	defer rows.Close()

	providerMap := make(map[uuid.UUID]*ProviderCylinderInfo)

	for rows.Next() {
		var providerID uuid.UUID
		var name string
		var lat, lon *float64
		var rating float64
		var cylInfo ProviderCylinderDetail

		if err := rows.Scan(
			&providerID, &name, &lat, &lon, &rating,
			&cylInfo.CylinderType, &cylInfo.RefillPrice, &cylInfo.BuyPrice, &cylInfo.Stock,
		); err != nil {
			return nil, fmt.Errorf("failed to scan provider cylinder info: %w", err)
		}

		if _, exists := providerMap[providerID]; !exists {
			providerMap[providerID] = &ProviderCylinderInfo{
				ProviderID:   providerID,
				ProviderName: name,
				Latitude:     lat,
				Longitude:    lon,
				Rating:       rating,
				Cylinders:    []ProviderCylinderDetail{},
			}
		}

		providerMap[providerID].Cylinders = append(providerMap[providerID].Cylinders, cylInfo)
	}

	var providers []ProviderCylinderInfo
	for _, p := range providerMap {
		providers = append(providers, *p)
	}

	return providers, nil
}

// GetProviderInventory retrieves inventory for a provider
func (r *repository) GetProviderInventory(ctx context.Context, providerID uuid.UUID) ([]Inventory, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, provider_id, cylinder_type, stock, price, created_at, updated_at
		 FROM inventory
		 WHERE provider_id = $1
		 ORDER BY cylinder_type ASC`,
		providerID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get provider inventory: %w", err)
	}
	defer rows.Close()

	var inventory []Inventory
	for rows.Next() {
		var inv Inventory
		if err := rows.Scan(
			&inv.ID, &inv.ProviderID, &inv.CylinderType, &inv.Stock, &inv.Price, &inv.CreatedAt, &inv.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan inventory: %w", err)
		}
		inventory = append(inventory, inv)
	}

	return inventory, nil
}

// GetProviderMetrics retrieves recent metrics for a provider
func (r *repository) GetProviderMetrics(ctx context.Context, providerID uuid.UUID, days int) ([]ProviderMetrics, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, provider_id, metric_date, orders_count, revenue, completed_orders, avg_rating, created_at
		 FROM provider_metrics
		 WHERE provider_id = $1 AND metric_date >= CURRENT_DATE - INTERVAL '1 day' * $2
		 ORDER BY metric_date DESC`,
		providerID, days,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get provider metrics: %w", err)
	}
	defer rows.Close()

	var metrics []ProviderMetrics
	for rows.Next() {
		var pm ProviderMetrics
		if err := rows.Scan(
			&pm.ID, &pm.ProviderID, &pm.MetricDate, &pm.OrdersCount, &pm.Revenue, &pm.CompletedOrders, &pm.AvgRating, &pm.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan provider metrics: %w", err)
		}
		metrics = append(metrics, pm)
	}

	return metrics, nil
}
