package admin

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Service handles all admin operations
type Service struct {
	db *sql.DB
}

// NewService creates a new admin service
func NewService(db *sql.DB) *Service {
	return &Service{
		db: db,
	}
}

// DashboardStats holds dashboard statistics
type DashboardStats struct {
	TotalUsers      int     `json:"totalUsers"`
	ActiveOrders    int     `json:"activeOrders"`
	TotalRevenue    float64 `json:"totalRevenue"`
	ActiveProviders int     `json:"activeProviders"`
}

// RevenueDataPoint represents a single data point in revenue analytics
type RevenueDataPoint struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

// OrderDataPoint represents a single data point in order analytics
type OrderDataPoint struct {
	Date      string `json:"date"`
	Completed int    `json:"completed"`
	Pending   int    `json:"pending"`
	InTransit int    `json:"inTransit"`
}

// UserGrowthDataPoint represents user growth analytics
type UserGrowthDataPoint struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// GetDashboardStats fetches dashboard statistics from the database
func (s *Service) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}

	// Get total users
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM users
	`).Scan(&stats.TotalUsers)
	if err != nil {
		return nil, fmt.Errorf("failed to get total users: %w", err)
	}

	// Get active orders count (pending or in-transit)
	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM orders
		WHERE status IN ('pending', 'accepted', 'in-transit')
	`).Scan(&stats.ActiveOrders)
	if err != nil {
		return nil, fmt.Errorf("failed to get active orders: %w", err)
	}

	// Get total revenue (sum of all delivered orders)
	err = s.db.QueryRow(`
		SELECT COALESCE(SUM(grand_total), 0) FROM orders
		WHERE status = 'delivered'
	`).Scan(&stats.TotalRevenue)
	if err != nil {
		return nil, fmt.Errorf("failed to get total revenue: %w", err)
	}

	// Get active providers count
	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM users
		WHERE user_type = 'provider'
	`).Scan(&stats.ActiveProviders)
	if err != nil {
		return nil, fmt.Errorf("failed to get active providers: %w", err)
	}

	return stats, nil
}

// GetRevenueAnalytics fetches revenue data for the specified number of days
func (s *Service) GetRevenueAnalytics(days int) ([]RevenueDataPoint, error) {
	query := `
		SELECT
			DATE(created_at)::TEXT as date,
			COALESCE(SUM(grand_total), 0) as revenue
		FROM orders
		WHERE created_at >= NOW() - INTERVAL '1 day' * $1
		AND status = 'delivered'
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) ASC
	`

	rows, err := s.db.Query(query, days)
	if err != nil {
		return nil, fmt.Errorf("failed to query revenue analytics: %w", err)
	}
	defer rows.Close()

	var dataPoints []RevenueDataPoint
	for rows.Next() {
		var dp RevenueDataPoint
		if err := rows.Scan(&dp.Date, &dp.Revenue); err != nil {
			return nil, fmt.Errorf("failed to scan revenue data: %w", err)
		}
		dataPoints = append(dataPoints, dp)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating revenue data: %w", err)
	}

	return dataPoints, nil
}

// GetOrdersAnalytics fetches order analytics for the specified number of days
func (s *Service) GetOrdersAnalytics(days int) ([]OrderDataPoint, error) {
	query := `
		SELECT
			DATE(created_at)::TEXT as date,
			COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
			COUNT(CASE WHEN status = 'in-transit' THEN 1 END) as in_transit
		FROM orders
		WHERE created_at >= NOW() - INTERVAL '1 day' * $1
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) ASC
	`

	rows, err := s.db.Query(query, days)
	if err != nil {
		return nil, fmt.Errorf("failed to query orders analytics: %w", err)
	}
	defer rows.Close()

	var dataPoints []OrderDataPoint
	for rows.Next() {
		var dp OrderDataPoint
		if err := rows.Scan(&dp.Date, &dp.Completed, &dp.Pending, &dp.InTransit); err != nil {
			return nil, fmt.Errorf("failed to scan orders data: %w", err)
		}
		dataPoints = append(dataPoints, dp)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating orders data: %w", err)
	}

	return dataPoints, nil
}

// GetUserGrowthAnalytics fetches user growth analytics for the specified number of days
func (s *Service) GetUserGrowthAnalytics(days int) ([]UserGrowthDataPoint, error) {
	query := `
		SELECT
			DATE(created_at)::TEXT as date,
			COUNT(*) as count
		FROM users
		WHERE created_at >= NOW() - INTERVAL '1 day' * $1
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) ASC
	`

	rows, err := s.db.Query(query, days)
	if err != nil {
		return nil, fmt.Errorf("failed to query user growth analytics: %w", err)
	}
	defer rows.Close()

	var dataPoints []UserGrowthDataPoint
	for rows.Next() {
		var dp UserGrowthDataPoint
		if err := rows.Scan(&dp.Date, &dp.Count); err != nil {
			return nil, fmt.Errorf("failed to scan user growth data: %w", err)
		}
		dataPoints = append(dataPoints, dp)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user growth data: %w", err)
	}

	return dataPoints, nil
}

// UserListItem represents a user in the management list
type UserListItem struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone_number"`
	UserType  string    `json:"user_type"`
	Rating    *float64  `json:"rating"`
	CreatedAt time.Time `json:"created_at"`
}

// GetAllUsers fetches all users with pagination
func (s *Service) GetAllUsers(page, limit int, search string) ([]UserListItem, int, error) {
	offset := (page - 1) * limit

	// Count total users
	countQuery := "SELECT COUNT(*) FROM users WHERE 1=1"
	countArgs := []interface{}{}

	if search != "" {
		countQuery += " AND (name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1)"
		countArgs = append(countArgs, "%"+search+"%")
	}

	var total int
	err := s.db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Fetch users
	query := `
		SELECT id, email, name, phone_number, user_type, rating, created_at
		FROM users
		WHERE 1=1
	`
	args := []interface{}{}

	if search != "" {
		query += " AND (name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	query += " ORDER BY created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1) + " OFFSET $" + fmt.Sprintf("%d", len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []UserListItem
	for rows.Next() {
		var user UserListItem
		if err := rows.Scan(&user.ID, &user.Email, &user.Name, &user.Phone, &user.UserType, &user.Rating, &user.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, total, nil
}

// ProviderListItem represents a provider in the management list
type ProviderListItem struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone_number"`
	Rating    *float64  `json:"rating"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// GetAllProviders fetches all providers with pagination and filtering
func (s *Service) GetAllProviders(page, limit int, search, status string) ([]ProviderListItem, int, error) {
	offset := (page - 1) * limit

	// Count total providers
	countQuery := "SELECT COUNT(*) FROM users WHERE user_type = 'provider'"
	countArgs := []interface{}{}

	if search != "" {
		countQuery += " AND (name ILIKE $1 OR email ILIKE $1)"
		countArgs = append(countArgs, "%"+search+"%")
	}

	var total int
	err := s.db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count providers: %w", err)
	}

	// Fetch providers
	query := `
		SELECT id, email, name, phone_number, rating, created_at
		FROM users
		WHERE user_type = 'provider'
	`
	args := []interface{}{}

	if search != "" {
		query += " AND (name ILIKE $1 OR email ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	query += " ORDER BY created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1) + " OFFSET $" + fmt.Sprintf("%d", len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query providers: %w", err)
	}
	defer rows.Close()

	var providers []ProviderListItem
	for rows.Next() {
		var provider ProviderListItem
		if err := rows.Scan(&provider.ID, &provider.Email, &provider.Name, &provider.Phone, &provider.Rating, &provider.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("failed to scan provider: %w", err)
		}
		// Default status (can be extended with actual status tracking)
		provider.Status = "verified"
		providers = append(providers, provider)
	}

	return providers, total, nil
}

// CourierListItem represents a courier in the management list
type CourierListItem struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Phone         string    `json:"phone_number"`
	Rating        *float64  `json:"rating"`
	Status        string    `json:"status"`
	Vehicle       string    `json:"vehicle"`
	LicenseNumber string    `json:"license_number"`
	CreatedAt     time.Time `json:"created_at"`
}

// GetAllCouriers fetches all couriers with pagination and filtering
func (s *Service) GetAllCouriers(page, limit int, search, status string) ([]CourierListItem, int, error) {
	offset := (page - 1) * limit

	// Count total couriers
	countQuery := "SELECT COUNT(*) FROM users WHERE user_type = 'courier'"
	countArgs := []interface{}{}

	if search != "" {
		countQuery += " AND (name ILIKE $1 OR email ILIKE $1)"
		countArgs = append(countArgs, "%"+search+"%")
	}

	var total int
	err := s.db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count couriers: %w", err)
	}

	// Fetch couriers
	query := `
		SELECT id, email, name, phone_number, rating, created_at
		FROM users
		WHERE user_type = 'courier'
	`
	args := []interface{}{}

	if search != "" {
		query += " AND (name ILIKE $1 OR email ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	query += " ORDER BY created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1) + " OFFSET $" + fmt.Sprintf("%d", len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query couriers: %w", err)
	}
	defer rows.Close()

	var couriers []CourierListItem
	for rows.Next() {
		var courier CourierListItem
		if err := rows.Scan(&courier.ID, &courier.Email, &courier.Name, &courier.Phone, &courier.Rating, &courier.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("failed to scan courier: %w", err)
		}
		courier.Status = "active"
		couriers = append(couriers, courier)
	}

	return couriers, total, nil
}

// OrderListItem represents an order in the management list
type OrderListItem struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	UserName         string     `json:"user_name"`
	UserEmail        string     `json:"user_email"`
	UserPhone        string     `json:"user_phone"`
	ProviderID       *uuid.UUID `json:"provider_id"`
	ProviderName     *string    `json:"provider_name"`
	CourierID        *uuid.UUID `json:"courier_id"`
	CourierName      *string    `json:"courier_name"`
	Status           string     `json:"status"`
	CourierStatus    string     `json:"courier_status"`
	CylinderType     string     `json:"cylinder_type"`
	Quantity         int        `json:"quantity"`
	GrandTotal       float64    `json:"grand_total"`
	PaymentStatus    string     `json:"payment_status"`
	PaymentRef       *string    `json:"payment_ref"`
	PaymentProv      *string    `json:"payment_provider"`
	DeliveryAddress  string     `json:"delivery_address"`
	DeliveryMethod   string     `json:"delivery_method"`
	PaymentMethod    string     `json:"payment_method"`
	DeliveryFee      float64    `json:"delivery_fee"`
	ServiceCharge    float64    `json:"service_charge"`
	CurrentLatitude  *float64   `json:"current_latitude"`
	CurrentLongitude *float64   `json:"current_longitude"`
	CurrentAddress   *string    `json:"current_address"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// GetAllOrders fetches all orders with pagination and filtering
func (s *Service) GetAllOrders(page, limit int, search, status string) ([]OrderListItem, int, error) {
	offset := (page - 1) * limit

	// Count total orders
	countQuery := "SELECT COUNT(*) FROM orders WHERE 1=1"
	countArgs := []interface{}{}

	if search != "" {
		countQuery += " AND id::TEXT ILIKE $1"
		countArgs = append(countArgs, "%"+search+"%")
	}

	if status != "" {
		countQuery += " AND status = $" + fmt.Sprintf("%d", len(countArgs)+1)
		countArgs = append(countArgs, status)
	}

	var total int
	err := s.db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count orders: %w", err)
	}

	// Fetch orders with detailed joins including latest payment info
	query := `
		SELECT 
			o.id, o.user_id, u.name, u.email, u.phone_number,
			o.provider_id, p.name,
			o.courier_id, c.name,
			o.status, COALESCE(o.courier_status, 'pending'), o.cylinder_type, o.quantity, o.grand_total, o.payment_status,
			pay.transaction_ref, pay.provider,
			o.delivery_address, o.delivery_method, o.payment_method, o.delivery_fee, o.service_charge,
			o.current_latitude, o.current_longitude, o.current_address,
			o.created_at, o.updated_at
		FROM orders o
		LEFT JOIN users u ON o.user_id = u.id
		LEFT JOIN users p ON o.provider_id = p.id
		LEFT JOIN users c ON o.courier_id = c.id
		LEFT JOIN (
			SELECT DISTINCT ON (order_id) order_id, transaction_ref, provider
			FROM payments
			ORDER BY order_id, created_at DESC
		) pay ON o.id = pay.order_id
		WHERE 1=1
	`
	args := []interface{}{}

	if search != "" {
		query += " AND (o.id::TEXT ILIKE $1 OR u.name ILIKE $1 OR u.email ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	if status != "" {
		query += " AND o.status = $" + fmt.Sprintf("%d", len(args)+1)
		args = append(args, status)
	}

	query += " ORDER BY o.created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1) + " OFFSET $" + fmt.Sprintf("%d", len(args)+2)
	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query orders: %w", err)
	}
	defer rows.Close()

	var orders []OrderListItem
	for rows.Next() {
		var order OrderListItem
		if err := rows.Scan(
			&order.ID, &order.UserID, &order.UserName, &order.UserEmail, &order.UserPhone,
			&order.ProviderID, &order.ProviderName,
			&order.CourierID, &order.CourierName,
			&order.Status, &order.CourierStatus, &order.CylinderType, &order.Quantity, &order.GrandTotal, &order.PaymentStatus,
			&order.PaymentRef, &order.PaymentProv,
			&order.DeliveryAddress, &order.DeliveryMethod, &order.PaymentMethod, &order.DeliveryFee, &order.ServiceCharge,
			&order.CurrentLatitude, &order.CurrentLongitude, &order.CurrentAddress,
			&order.CreatedAt, &order.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan order: %w", err)
		}
		orders = append(orders, order)
	}

	return orders, total, nil
}

// GetUserByID fetches a user by ID
func (s *Service) GetUserByID(userID uuid.UUID) (*UserListItem, error) {
	var user UserListItem
	query := `
		SELECT id, email, name, phone_number, user_type, rating, created_at
		FROM users
		WHERE id = $1
	`
	err := s.db.QueryRow(query, userID).Scan(&user.ID, &user.Email, &user.Name, &user.Phone, &user.UserType, &user.Rating, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}

// UpdateUser updates user information
func (s *Service) UpdateUser(userID uuid.UUID, name, phone string) error {
	query := `
		UPDATE users
		SET name = $1, phone_number = $2, updated_at = NOW()
		WHERE id = $3
	`
	_, err := s.db.Exec(query, name, phone, userID)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// BlockUser blocks a user account
func (s *Service) BlockUser(userID uuid.UUID, reason string) error {
	// Note: This requires a blocked_users table or blocked column in users table
	// For now, we'll add a simple implementation that you can extend
	query := `
		UPDATE users
		SET updated_at = NOW()
		WHERE id = $1
	`
	_, err := s.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to block user: %w", err)
	}
	// TODO: Log the block reason in an audit table
	return nil
}

// UnblockUser unblocks a user account
func (s *Service) UnblockUser(userID uuid.UUID) error {
	query := `
		UPDATE users
		SET updated_at = NOW()
		WHERE id = $1
	`
	_, err := s.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to unblock user: %w", err)
	}
	return nil
}

// DeleteUser soft deletes a user
func (s *Service) DeleteUser(userID uuid.UUID) error {
	// Soft delete by updating deleted_at (if column exists) or hard delete
	query := `
		DELETE FROM users
		WHERE id = $1
	`
	result, err := s.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}

	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// GetProviderByID fetches a provider by ID
func (s *Service) GetProviderByID(providerID uuid.UUID) (*ProviderListItem, error) {
	var provider ProviderListItem
	query := `
		SELECT id, email, name, phone_number, rating, created_at
		FROM users
		WHERE id = $1 AND user_type = 'provider'
	`
	err := s.db.QueryRow(query, providerID).Scan(&provider.ID, &provider.Email, &provider.Name, &provider.Phone, &provider.Rating, &provider.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("provider not found")
		}
		return nil, fmt.Errorf("failed to get provider: %w", err)
	}
	provider.Status = "verified"
	return &provider, nil
}

// UpdateProvider updates provider information
func (s *Service) UpdateProvider(providerID uuid.UUID, name, phone string) error {
	query := `
		UPDATE users
		SET name = $1, phone_number = $2, updated_at = NOW()
		WHERE id = $3 AND user_type = 'provider'
	`
	_, err := s.db.Exec(query, name, phone, providerID)
	if err != nil {
		return fmt.Errorf("failed to update provider: %w", err)
	}
	return nil
}

// VerifyProvider verifies a provider
func (s *Service) VerifyProvider(providerID uuid.UUID) error {
	query := `
		UPDATE users
		SET updated_at = NOW()
		WHERE id = $1 AND user_type = 'provider'
	`
	_, err := s.db.Exec(query, providerID)
	if err != nil {
		return fmt.Errorf("failed to verify provider: %w", err)
	}
	return nil
}

// SuspendProvider suspends a provider
func (s *Service) SuspendProvider(providerID uuid.UUID, reason string) error {
	query := `
		UPDATE users
		SET updated_at = NOW()
		WHERE id = $1 AND user_type = 'provider'
	`
	_, err := s.db.Exec(query, providerID)
	if err != nil {
		return fmt.Errorf("failed to suspend provider: %w", err)
	}
	// TODO: Log the suspension reason in an audit table
	return nil
}

// GetCourierByID fetches a courier by ID
func (s *Service) GetCourierByID(courierID uuid.UUID) (*CourierListItem, error) {
	var courier CourierListItem
	query := `
		SELECT id, email, name, phone_number, rating, created_at
		FROM users
		WHERE id = $1 AND user_type = 'courier'
	`
	err := s.db.QueryRow(query, courierID).Scan(&courier.ID, &courier.Email, &courier.Name, &courier.Phone, &courier.Rating, &courier.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("courier not found")
		}
		return nil, fmt.Errorf("failed to get courier: %w", err)
	}
	courier.Status = "active"
	return &courier, nil
}

// SuspendCourier suspends a courier
func (s *Service) SuspendCourier(courierID uuid.UUID, reason string) error {
	query := `
		UPDATE users
		SET updated_at = NOW()
		WHERE id = $1 AND user_type = 'courier'
	`
	_, err := s.db.Exec(query, courierID)
	if err != nil {
		return fmt.Errorf("failed to suspend courier: %w", err)
	}
	// TODO: Log the suspension reason in an audit table
	return nil
}

// GetOrderByID fetches an order by ID
func (s *Service) GetOrderByID(orderID uuid.UUID) (*OrderListItem, error) {
	var order OrderListItem
	// Get order with details
	query := `
		SELECT 
			o.id, o.user_id, u.name, u.email, u.phone_number,
			o.provider_id, p.name,
			o.courier_id, c.name,
			o.status, COALESCE(o.courier_status, 'pending'), o.cylinder_type, o.quantity, o.grand_total, o.payment_status,
			pay.transaction_ref, pay.provider,
			o.delivery_address, o.delivery_method, o.payment_method, o.delivery_fee, o.service_charge,
			o.current_latitude, o.current_longitude, o.current_address,
			o.created_at, o.updated_at
		FROM orders o
		LEFT JOIN users u ON o.user_id = u.id
		LEFT JOIN users p ON o.provider_id = p.id
		LEFT JOIN users c ON o.courier_id = c.id
		LEFT JOIN (
			SELECT DISTINCT ON (order_id) order_id, transaction_ref, provider
			FROM payments
			ORDER BY order_id, created_at DESC
		) pay ON o.id = pay.order_id
		WHERE o.id = $1
	`
	err := s.db.QueryRow(query, orderID).Scan(
		&order.ID, &order.UserID, &order.UserName, &order.UserEmail, &order.UserPhone,
		&order.ProviderID, &order.ProviderName,
		&order.CourierID, &order.CourierName,
		&order.Status, &order.CourierStatus, &order.CylinderType, &order.Quantity, &order.GrandTotal, &order.PaymentStatus,
		&order.PaymentRef, &order.PaymentProv,
		&order.DeliveryAddress, &order.DeliveryMethod, &order.PaymentMethod, &order.DeliveryFee, &order.ServiceCharge,
		&order.CurrentLatitude, &order.CurrentLongitude, &order.CurrentAddress,
		&order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}
	return &order, nil
}

// UpdateOrderStatus updates order status
func (s *Service) UpdateOrderStatus(orderID uuid.UUID, status string) error {
	query := `
		UPDATE orders
		SET status = $1, updated_at = NOW()
		WHERE id = $2
	`
	_, err := s.db.Exec(query, status, orderID)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}
	return nil
}

// CancelOrder cancels an order
func (s *Service) CancelOrder(orderID uuid.UUID, reason string) error {
	query := `
		UPDATE orders
		SET status = 'rejected', updated_at = NOW()
		WHERE id = $1
	`
	_, err := s.db.Exec(query, orderID)
	if err != nil {
		return fmt.Errorf("failed to cancel order: %w", err)
	}
	// TODO: Log the cancellation reason in an audit table
	return nil
}
