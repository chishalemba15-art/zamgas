package admin

import (
	"time"

	"github.com/google/uuid"
)

// Dashboard Analytics Summary
type DashboardSummary struct {
	ActiveUsers          int     `json:"active_users"`
	ActiveProviders      int     `json:"active_providers"`
	ActiveCouriers       int     `json:"active_couriers"`
	CompletedOrders      int     `json:"completed_orders"`
	ActiveOrders         int     `json:"active_orders"`
	TotalRevenue         float64 `json:"total_revenue"`
	AvgProviderRating    float64 `json:"avg_provider_rating"`
	CreatedAt            time.Time `json:"created_at"`
}

// Daily Analytics
type DailyAnalytics struct {
	ID                    uuid.UUID `json:"id"`
	AnalyticsDate         time.Time `json:"analytics_date"`
	TotalOrders           int       `json:"total_orders"`
	CompletedOrders       int       `json:"completed_orders"`
	PendingOrders         int       `json:"pending_orders"`
	TotalRevenue          float64   `json:"total_revenue"`
	TotalTransactions     int       `json:"total_transactions"`
	ActiveProviders       int       `json:"active_providers"`
	ActiveCouriers        int       `json:"active_couriers"`
	ActiveCustomers       int       `json:"active_customers"`
	AvgOrderValue         float64   `json:"avg_order_value"`
	AvgDeliveryTimeMinutes int      `json:"avg_delivery_time_minutes"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// Provider Status & Management
type ProviderStatus struct {
	ID                 uuid.UUID `json:"id"`
	ProviderID         uuid.UUID `json:"provider_id"`
	IsActive           bool      `json:"is_active"`
	IsVerified         bool      `json:"is_verified"`
	VerificationDate   *time.Time `json:"verification_date"`
	AvgRating          float64   `json:"avg_rating"`
	TotalOrders        int       `json:"total_orders"`
	TotalRevenue       float64   `json:"total_revenue"`
	ResponseTimeMinutes *int     `json:"response_time_minutes"`
	DeactivationReason *string   `json:"deactivation_reason"`
	DeactivatedAt      *time.Time `json:"deactivated_at"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// Courier Status & Performance
type CourierStatus struct {
	ID                    uuid.UUID `json:"id"`
	CourierID             uuid.UUID `json:"courier_id"`
	IsActive              bool      `json:"is_active"`
	IsVerified            bool      `json:"is_verified"`
	VerificationDate      *time.Time `json:"verification_date"`
	AvgRating             float64   `json:"avg_rating"`
	TotalDeliveries       int       `json:"total_deliveries"`
	TotalEarnings         float64   `json:"total_earnings"`
	AvgDeliveryTimeMinutes *int     `json:"avg_delivery_time_minutes"`
	IsAvailable           bool      `json:"is_available"`
	LastLocationUpdate    *time.Time `json:"last_location_update"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// User Preferences
type UserPreferences struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"user_id"`
	PreferredCylinderType *string  `json:"preferred_cylinder_type"`
	PreferredLatitude   *float64  `json:"preferred_latitude"`
	PreferredLongitude  *float64  `json:"preferred_longitude"`
	PreferredAddress    *string   `json:"preferred_address"`
	DeliveryRadiusKm    int       `json:"delivery_radius_km"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// Transaction Fees Configuration
type TransactionFee struct {
	ID             uuid.UUID `json:"id"`
	FeeType        string    `json:"fee_type"` // platform_commission, delivery_fee, service_charge, transaction_fee
	Percentage     float64   `json:"percentage"`
	FixedAmount    float64   `json:"fixed_amount"`
	IsActive       bool      `json:"is_active"`
	Description    *string   `json:"description"`
	EffectiveFrom  time.Time `json:"effective_from"`
	EffectiveUntil *time.Time `json:"effective_until"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Admin Settings
type AdminSetting struct {
	ID          uuid.UUID `json:"id"`
	SettingKey  string    `json:"setting_key"`
	SettingValue string    `json:"setting_value"`
	DataType    string    `json:"data_type"` // string, integer, decimal, boolean
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Provider Metrics
type ProviderMetrics struct {
	ID               uuid.UUID `json:"id"`
	ProviderID       uuid.UUID `json:"provider_id"`
	MetricDate       time.Time `json:"metric_date"`
	OrdersCount      int       `json:"orders_count"`
	Revenue          float64   `json:"revenue"`
	CompletedOrders  int       `json:"completed_orders"`
	AvgRating        *float64  `json:"avg_rating"`
	CreatedAt        time.Time `json:"created_at"`
}

// Provider with Status & Metrics
type ProviderWithStatus struct {
	ID                   uuid.UUID `json:"id"`
	Name                 string    `json:"name"`
	Email                string    `json:"email"`
	PhoneNumber          string    `json:"phone_number"`
	Latitude             *float64  `json:"latitude"`
	Longitude            *float64  `json:"longitude"`
	IsActive             bool      `json:"is_active"`
	IsVerified           bool      `json:"is_verified"`
	AvgRating            float64   `json:"avg_rating"`
	TotalOrders          int       `json:"total_orders"`
	TotalRevenue         float64   `json:"total_revenue"`
	ResponseTimeMinutes  *int      `json:"response_time_minutes"`
	CreatedAt            time.Time `json:"created_at"`
}

// Courier with Status & Performance
type CourierWithStatus struct {
	ID                   uuid.UUID `json:"id"`
	Name                 string    `json:"name"`
	Email                string    `json:"email"`
	PhoneNumber          string    `json:"phone_number"`
	Latitude             *float64  `json:"latitude"`
	Longitude            *float64  `json:"longitude"`
	IsActive             bool      `json:"is_active"`
	IsVerified           bool      `json:"is_verified"`
	AvgRating            float64   `json:"avg_rating"`
	TotalDeliveries      int       `json:"total_deliveries"`
	TotalEarnings        float64   `json:"total_earnings"`
	IsAvailable          bool      `json:"is_available"`
	CreatedAt            time.Time `json:"created_at"`
}

// Request/Response Structs
type UpdateProviderStatusRequest struct {
	IsActive bool    `json:"is_active"`
	IsVerified bool  `json:"is_verified"`
	DeactivationReason *string `json:"deactivation_reason"`
}

type UpdateCourierStatusRequest struct {
	IsActive bool `json:"is_active"`
	IsVerified bool `json:"is_verified"`
	IsAvailable bool `json:"is_available"`
}

type UpdateAdminSettingRequest struct {
	SettingValue string `json:"setting_value" binding:"required"`
	Description *string `json:"description"`
}

type AdminResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   *string     `json:"error,omitempty"`
}

type AnalyticsFilterRequest struct {
	StartDate *string `json:"start_date"`
	EndDate   *string `json:"end_date"`
	Limit     *int    `json:"limit"`
	Offset    *int    `json:"offset"`
}

type CylinderPricing struct {
	ID           uuid.UUID `json:"id"`
	ProviderID   uuid.UUID `json:"provider_id"`
	CylinderType string    `json:"cylinder_type"`
	RefillPrice  float64   `json:"refill_price"`
	BuyPrice     float64   `json:"buy_price"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Inventory struct {
	ID           uuid.UUID `json:"id"`
	ProviderID   uuid.UUID `json:"provider_id"`
	CylinderType string    `json:"cylinder_type"`
	Stock        int       `json:"stock"`
	Price        float64   `json:"price"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ProviderCylinderInfo struct {
	ProviderID   uuid.UUID              `json:"provider_id"`
	ProviderName string                 `json:"provider_name"`
	Latitude     *float64               `json:"latitude"`
	Longitude    *float64               `json:"longitude"`
	Rating       float64                `json:"rating"`
	Cylinders    []ProviderCylinderDetail `json:"cylinders"`
}

type ProviderCylinderDetail struct {
	CylinderType string  `json:"cylinder_type"`
	RefillPrice  float64 `json:"refill_price"`
	BuyPrice     float64 `json:"buy_price"`
	Stock        int     `json:"stock"`
}
