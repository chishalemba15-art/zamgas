package order

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/internal/courier"
	"github.com/yakumwamba/lpg-delivery-system/internal/location"
)

type Service struct {
	db             *sql.DB
	courierService *courier.Service
}

func NewService(db *sql.DB) *Service {
	return &Service{
		db:             db,
		courierService: courier.NewService(db),
	}
}

func (s *Service) CreateOrder(order *Order) (*Order, error) {
	// Validate order
	if err := s.validateOrder(order); err != nil {
		return nil, fmt.Errorf("invalid order: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now()
	order.CreatedAt = now
	order.UpdatedAt = now

	if order.ID == uuid.Nil {
		order.ID = uuid.New()
	}

	query := `
		INSERT INTO orders (
			id, user_id, provider_id, courier_id, status, courier_status, cylinder_type,
			quantity, price_per_unit, total_price, delivery_fee, service_charge,
			grand_total, delivery_address, delivery_method, payment_method,
			payment_status, current_latitude, current_longitude, current_address,
			ride_link, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
		RETURNING id, created_at, updated_at
	`

	var providerIDStr sql.NullString
	if order.ProviderID != nil {
		providerIDStr = sql.NullString{String: order.ProviderID.String(), Valid: true}
	}

	var courierIDStr sql.NullString
	if order.CourierID != nil {
		courierIDStr = sql.NullString{String: order.CourierID.String(), Valid: true}
	}

	var orderIDStr string
	err := s.db.QueryRowContext(ctx, query,
		order.ID.String(), order.UserID.String(), providerIDStr, courierIDStr, order.Status, order.CourierStatus,
		order.CylinderType, order.Quantity, order.PricePerUnit, order.TotalPrice,
		order.DeliveryFee, order.ServiceCharge, order.GrandTotal, order.DeliveryAddress,
		order.DeliveryMethod, order.PaymentMethod, order.PaymentStatus,
		order.CurrentLatitude, order.CurrentLongitude, order.CurrentAddress,
		order.RideLink, order.CreatedAt, order.UpdatedAt,
	).Scan(&orderIDStr, &order.CreatedAt, &order.UpdatedAt)

	if err == nil {
		order.ID, _ = uuid.Parse(orderIDStr)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, nil
}

func (s *Service) validateOrder(order *Order) error {
	if order.UserID == uuid.Nil {
		return errors.New("user ID is required")
	}
	if order.ProviderID == nil || *order.ProviderID == uuid.Nil {
		return errors.New("provider ID is required")
	}
	if order.CylinderType == "" {
		return errors.New("cylinder type is required")
	}
	if order.Quantity <= 0 {
		return errors.New("quantity must be greater than 0")
	}
	if order.PricePerUnit <= 0 {
		return errors.New("price per unit must be greater than 0")
	}
	if order.GrandTotal <= 0 {
		return errors.New("grand total must be greater than 0")
	}

	return nil
}

func (s *Service) GetUserOrders(userID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT o.id, o.user_id, o.provider_id, o.courier_id, 
			COALESCE(c.name, '') as courier_name, COALESCE(c.phone_number, '') as courier_phone,
			o.status, COALESCE(o.courier_status, 'pending'), o.cylinder_type,
			o.quantity, o.price_per_unit, o.total_price, o.delivery_fee, o.service_charge,
			o.grand_total, o.delivery_address, o.delivery_method, o.payment_method,
			o.payment_status, o.current_latitude, o.current_longitude, COALESCE(o.current_address, ''),
			COALESCE(o.ride_link, ''), o.created_at, o.updated_at
		FROM orders o
		LEFT JOIN users c ON o.courier_id = c.id
		WHERE o.user_id = $1
		ORDER BY o.created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, userID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get user orders: %w", err)
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var order Order
		var orderIDStr, userIDStr string
		var providerIDStr, courierIDStr sql.NullString

		err := rows.Scan(
			&orderIDStr, &userIDStr, &providerIDStr, &courierIDStr,
			&order.CourierName, &order.CourierPhone,
			&order.Status, &order.CourierStatus, &order.CylinderType, &order.Quantity, &order.PricePerUnit,
			&order.TotalPrice, &order.DeliveryFee, &order.ServiceCharge, &order.GrandTotal,
			&order.DeliveryAddress, &order.DeliveryMethod, &order.PaymentMethod,
			&order.PaymentStatus, &order.CurrentLatitude, &order.CurrentLongitude,
			&order.CurrentAddress, &order.RideLink, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}

		order.ID, _ = uuid.Parse(orderIDStr)
		order.UserID, _ = uuid.Parse(userIDStr)
		if providerIDStr.Valid {
			parsed, _ := uuid.Parse(providerIDStr.String)
			order.ProviderID = &parsed
		}
		if courierIDStr.Valid {
			parsed, _ := uuid.Parse(courierIDStr.String)
			order.CourierID = &parsed
		}

		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating orders: %w", err)
	}

	return orders, nil
}

func (s *Service) GetAllProviders() ([]uuid.UUID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `SELECT id FROM users WHERE user_type = 'provider'`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get providers: %w", err)
	}
	defer rows.Close()

	var providerIDs []uuid.UUID
	for rows.Next() {
		var idStr string
		if err := rows.Scan(&idStr); err != nil {
			return nil, fmt.Errorf("failed to scan provider ID: %w", err)
		}
		id, _ := uuid.Parse(idStr)
		providerIDs = append(providerIDs, id)
	}

	return providerIDs, nil
}

func (s *Service) GetProviderOrders(providerID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, provider_id, courier_id, status, COALESCE(courier_status, 'pending'), cylinder_type,
			quantity, price_per_unit, total_price, delivery_fee, service_charge,
			grand_total, delivery_address, delivery_method, payment_method,
			payment_status, current_latitude, current_longitude, current_address,
			ride_link, created_at, updated_at
		FROM orders
		WHERE provider_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, providerID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get provider orders: %w", err)
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var order Order
		var orderIDStr, userIDStr string
		var providerIDStr, courierIDStr sql.NullString

		err := rows.Scan(
			&orderIDStr, &userIDStr, &providerIDStr, &courierIDStr,
			&order.Status, &order.CourierStatus, &order.CylinderType, &order.Quantity, &order.PricePerUnit,
			&order.TotalPrice, &order.DeliveryFee, &order.ServiceCharge, &order.GrandTotal,
			&order.DeliveryAddress, &order.DeliveryMethod, &order.PaymentMethod,
			&order.PaymentStatus, &order.CurrentLatitude, &order.CurrentLongitude,
			&order.CurrentAddress, &order.RideLink, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}

		order.ID, _ = uuid.Parse(orderIDStr)
		order.UserID, _ = uuid.Parse(userIDStr)
		if providerIDStr.Valid {
			parsed, _ := uuid.Parse(providerIDStr.String)
			order.ProviderID = &parsed
		}
		if courierIDStr.Valid {
			parsed, _ := uuid.Parse(courierIDStr.String)
			order.CourierID = &parsed
		}

		orders = append(orders, order)
	}

	return orders, nil
}

func (s *Service) AcceptOrder(providerID uuid.UUID, orderID uuid.UUID) error {
	if orderID == uuid.Nil {
		return fmt.Errorf("cannot accept order with empty ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		UPDATE orders
		SET status = $1, provider_id = $2, updated_at = $3
		WHERE id = $4 AND status = $5
	`

	result, err := s.db.ExecContext(ctx, query, OrderStatusAccepted, providerID.String(), time.Now(), orderID.String(), OrderStatusPending)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	if rowsAffected, _ := result.RowsAffected(); rowsAffected == 0 {
		return fmt.Errorf("order not found or already accepted")
	}

	// AUTO-ASSIGN COURIER
	// Get provider location for courier assignment
	providerLat, providerLng, err := s.getProviderLocation(providerID)
	if err == nil && providerLat != nil && providerLng != nil {
		// Find best available courier
		courierID, err := s.courierService.FindBestCourier(*providerLat, *providerLng)
		if err == nil && courierID != nil {
			// Assign courier to order
			err = s.courierService.AssignCourierToOrder(orderID, *courierID)
			if err != nil {
				// Log error but don't fail order acceptance
				fmt.Printf("Warning: Failed to auto-assign courier: %v\n", err)
			}
		} else {
			// Log that no courier was available
			fmt.Printf("Info: No available courier found for order %s\n", orderID.String())
		}
	}

	return nil
}

func (s *Service) RejectOrder(orderID uuid.UUID) error {
	return s.updateOrderStatus(orderID, OrderStatusRejected)
}

func (s *Service) GetCourierOrders(courierID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		SELECT id, user_id, provider_id, courier_id, status, COALESCE(courier_status, 'pending'), cylinder_type,
			quantity, price_per_unit, total_price, delivery_fee, service_charge,
			grand_total, delivery_address, delivery_method, payment_method,
			payment_status, current_latitude, current_longitude, COALESCE(current_address, ''),
			COALESCE(ride_link, ''), created_at, updated_at
		FROM orders
		WHERE courier_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query, courierID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get courier orders: %w", err)
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var order Order
		var orderIDStr, userIDStr string
		var providerIDStr, courierIDStr sql.NullString

		err := rows.Scan(
			&orderIDStr, &userIDStr, &providerIDStr, &courierIDStr,
			&order.Status, &order.CourierStatus, &order.CylinderType, &order.Quantity, &order.PricePerUnit,
			&order.TotalPrice, &order.DeliveryFee, &order.ServiceCharge, &order.GrandTotal,
			&order.DeliveryAddress, &order.DeliveryMethod, &order.PaymentMethod,
			&order.PaymentStatus, &order.CurrentLatitude, &order.CurrentLongitude,
			&order.CurrentAddress, &order.RideLink, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}

		order.ID, _ = uuid.Parse(orderIDStr)
		order.UserID, _ = uuid.Parse(userIDStr)
		if providerIDStr.Valid {
			parsed, _ := uuid.Parse(providerIDStr.String)
			order.ProviderID = &parsed
		}
		if courierIDStr.Valid {
			parsed, _ := uuid.Parse(courierIDStr.String)
			order.CourierID = &parsed
		}

		orders = append(orders, order)
	}

	return orders, nil
}

func (s *Service) UpdateOrderStatus(orderID uuid.UUID, status OrderStatus, courierID uuid.UUID) error {
	return s.updateOrderStatus(orderID, status)
}

func (s *Service) GetOrderByID(orderID uuid.UUID) (*Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var order Order
	query := `
		SELECT id, user_id, provider_id, courier_id, status, COALESCE(courier_status, 'pending'), cylinder_type,
			quantity, price_per_unit, total_price, delivery_fee, service_charge,
			grand_total, delivery_address, delivery_method, payment_method,
			payment_status, current_latitude, current_longitude, COALESCE(current_address, ''),
			COALESCE(ride_link, ''), created_at, updated_at
		FROM orders
		WHERE id = $1
	`

	var orderIDStr, userIDStr string
	var providerIDStr, courierIDStr sql.NullString

	err := s.db.QueryRowContext(ctx, query, orderID.String()).Scan(
		&orderIDStr, &userIDStr, &providerIDStr, &courierIDStr,
		&order.Status, &order.CourierStatus, &order.CylinderType, &order.Quantity, &order.PricePerUnit,
		&order.TotalPrice, &order.DeliveryFee, &order.ServiceCharge, &order.GrandTotal,
		&order.DeliveryAddress, &order.DeliveryMethod, &order.PaymentMethod,
		&order.PaymentStatus, &order.CurrentLatitude, &order.CurrentLongitude,
		&order.CurrentAddress, &order.RideLink, &order.CreatedAt, &order.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	order.ID, _ = uuid.Parse(orderIDStr)
	order.UserID, _ = uuid.Parse(userIDStr)
	if providerIDStr.Valid {
		parsed, _ := uuid.Parse(providerIDStr.String)
		order.ProviderID = &parsed
	}
	if courierIDStr.Valid {
		parsed, _ := uuid.Parse(courierIDStr.String)
		order.CourierID = &parsed
	}

	return &order, nil
}

// Helper function to update order status
func (s *Service) updateOrderStatus(orderID uuid.UUID, status OrderStatus) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// When marking as delivered, also update courier_status to 'completed'
	var query string
	var args []interface{}

	if status == OrderStatusDelivered {
		query = `
			UPDATE orders
			SET status = $1, courier_status = 'completed', updated_at = $2
			WHERE id = $3
		`
		args = []interface{}{status, time.Now(), orderID.String()}
	} else {
		query = `
			UPDATE orders
			SET status = $1, updated_at = $2
			WHERE id = $3
		`
		args = []interface{}{status, time.Now(), orderID.String()}
	}

	result, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	if rowsAffected, _ := result.RowsAffected(); rowsAffected == 0 {
		return fmt.Errorf("order not found or status not changed")
	}

	return nil
}

func (s *Service) UpdateOrderPaymentStatus(orderID uuid.UUID, status PaymentStatus) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		UPDATE orders
		SET payment_status = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := s.db.ExecContext(ctx, query, status, time.Now(), orderID.String())
	if err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	return nil
}

func (s *Service) AcceptCourierAssignment(orderID uuid.UUID, courierID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		UPDATE orders
		SET courier_status = 'accepted', status = $1, updated_at = $2
		WHERE id = $3 AND courier_id = $4
	`

	result, err := s.db.ExecContext(ctx, query, OrderStatusInTransit, time.Now(), orderID.String(), courierID.String())
	if err != nil {
		return fmt.Errorf("failed to accept assignment: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("order not found or courier mismatch")
	}

	return nil
}

func (s *Service) DeclineCourierAssignment(orderID uuid.UUID, courierID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Reset courier assignment so it can be reassigned
	query := `
		UPDATE orders
		SET courier_id = NULL, courier_status = NULL, status = $1, updated_at = $2
		WHERE id = $3 AND courier_id = $4
	`

	result, err := s.db.ExecContext(ctx, query, OrderStatusAccepted, time.Now(), orderID.String(), courierID.String())
	if err != nil {
		return fmt.Errorf("failed to decline assignment: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return fmt.Errorf("order not found or courier mismatch")
	}

	return nil
}

func (s *Service) AdminAssignCourier(orderID uuid.UUID, courierID uuid.UUID) error {
	// Use existing logic which sets status to 'pending'
	return s.courierService.AssignCourierToOrder(orderID, courierID)
}

func (s *Service) UpdateOrderLocation(orderID uuid.UUID, location *location.Location) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		UPDATE orders
		SET current_latitude = $1, current_longitude = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := s.db.ExecContext(ctx, query, location.Latitude, location.Longitude, time.Now(), orderID.String())
	if err != nil {
		return fmt.Errorf("failed to update order location: %w", err)
	}

	return nil
}

func (s *Service) GetBestProviderForUser(userID uuid.UUID, latitude float64, longitude float64) (*uuid.UUID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find the provider with the highest rating from user's previous orders
	query := `
		SELECT u.id, u.rating
		FROM users u
		INNER JOIN orders o ON u.id = o.provider_id
		WHERE o.user_id = $1 AND u.user_type = 'provider'
		GROUP BY u.id, u.rating
		ORDER BY u.rating DESC, COUNT(o.id) DESC
		LIMIT 1
	`

	var providerIDStr string
	var rating int

	err := s.db.QueryRowContext(ctx, query, userID.String()).Scan(&providerIDStr, &rating)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no providers found for user")
		}
		return nil, fmt.Errorf("failed to get best provider: %w", err)
	}

	providerID, _ := uuid.Parse(providerIDStr)
	return &providerID, nil
}

// getProviderLocation retrieves provider's latitude and longitude
func (s *Service) getProviderLocation(providerID uuid.UUID) (*float64, *float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT latitude, longitude FROM users WHERE id = $1 AND user_type = 'provider'`

	var lat, lng sql.NullFloat64
	err := s.db.QueryRowContext(ctx, query, providerID.String()).Scan(&lat, &lng)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil, fmt.Errorf("provider not found")
		}
		return nil, nil, fmt.Errorf("failed to get provider location: %w", err)
	}

	if !lat.Valid || !lng.Valid {
		return nil, nil, fmt.Errorf("provider location not set")
	}

	return &lat.Float64, &lng.Float64, nil
}
