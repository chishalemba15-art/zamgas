package examples

// This file demonstrates how to migrate the order service from PostgreSQL to Supabase REST API

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

// Example Order struct (matching your internal/order/model.go structure)
type Order struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	ProviderID       *uuid.UUID `json:"provider_id,omitempty"`
	CourierID        *uuid.UUID `json:"courier_id,omitempty"`
	Status           string     `json:"status"`
	CylinderType     string     `json:"cylinder_type"`
	Quantity         int        `json:"quantity"`
	PricePerUnit     float64    `json:"price_per_unit"`
	TotalPrice       float64    `json:"total_price"`
	DeliveryFee      float64    `json:"delivery_fee"`
	ServiceCharge    float64    `json:"service_charge"`
	GrandTotal       float64    `json:"grand_total"`
	DeliveryAddress  string     `json:"delivery_address"`
	DeliveryMethod   string     `json:"delivery_method"`
	PaymentMethod    string     `json:"payment_method"`
	PaymentStatus    string     `json:"payment_status"`
	CurrentLatitude  *float64   `json:"current_latitude,omitempty"`
	CurrentLongitude *float64   `json:"current_longitude,omitempty"`
	CurrentAddress   *string    `json:"current_address,omitempty"`
	RideLink         *string    `json:"ride_link,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// OrderServiceSupabase demonstrates the Supabase implementation
type OrderServiceSupabase struct {
	client *database.SupabaseClient
}

func NewOrderServiceSupabase(client *database.SupabaseClient) *OrderServiceSupabase {
	return &OrderServiceSupabase{
		client: client,
	}
}

// CreateOrder - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) CreateOrder(order *Order) (*Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now()
	order.CreatedAt = now
	order.UpdatedAt = now

	if order.ID == uuid.Nil {
		order.ID = uuid.New()
	}

	var result []Order
	err := s.client.Insert(ctx, "orders", []Order{*order}, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("no order returned after insert")
	}

	return &result[0], nil
}

// GetUserOrders - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) GetUserOrders(userID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Eq("user_id", userID.String()).
		Order("created_at", false). // descending order
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get user orders: %w", err)
	}

	return orders, nil
}

// GetProviderOrders - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) GetProviderOrders(providerID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Eq("provider_id", providerID.String()).
		Order("created_at", false).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get provider orders: %w", err)
	}

	return orders, nil
}

// GetCourierOrders - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) GetCourierOrders(courierID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Eq("courier_id", courierID.String()).
		Order("created_at", false).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get courier orders: %w", err)
	}

	return orders, nil
}

// GetOrderByID - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) GetOrderByID(id uuid.UUID) (*Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var order Order
	err := database.GetByID(ctx, s.client, "orders", id, &order)
	if err != nil {
		return nil, fmt.Errorf("failed to get order by ID: %w", err)
	}

	return &order, nil
}

// UpdateOrderStatus - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) UpdateOrderStatus(orderID uuid.UUID, status string, courierID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateData := map[string]interface{}{
		"status":     status,
		"courier_id": courierID,
		"updated_at": time.Now(),
	}

	var result []Order
	err := database.UpdateByID(ctx, s.client, "orders", orderID, updateData, &result)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// UpdateOrderPaymentStatus - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) UpdateOrderPaymentStatus(orderID uuid.UUID, paymentStatus string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateData := map[string]interface{}{
		"payment_status": paymentStatus,
		"updated_at":     time.Now(),
	}

	var result []Order
	err := database.UpdateByID(ctx, s.client, "orders", orderID, updateData, &result)
	if err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// AcceptOrder - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) AcceptOrder(providerID, orderID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateData := map[string]interface{}{
		"status":      "accepted",
		"provider_id": providerID,
		"updated_at":  time.Now(),
	}

	var result []Order
	err := database.UpdateByID(ctx, s.client, "orders", orderID, updateData, &result)
	if err != nil {
		return fmt.Errorf("failed to accept order: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// RejectOrder - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) RejectOrder(orderID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateData := map[string]interface{}{
		"status":     "rejected",
		"updated_at": time.Now(),
	}

	var result []Order
	err := database.UpdateByID(ctx, s.client, "orders", orderID, updateData, &result)
	if err != nil {
		return fmt.Errorf("failed to reject order: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// UpdateOrderLocation - Migrated from PostgreSQL to Supabase REST API
func (s *OrderServiceSupabase) UpdateOrderLocation(orderID uuid.UUID, latitude, longitude float64, address string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateData := map[string]interface{}{
		"current_latitude":  latitude,
		"current_longitude": longitude,
		"current_address":   address,
		"updated_at":        time.Now(),
	}

	var result []Order
	err := database.UpdateByID(ctx, s.client, "orders", orderID, updateData, &result)
	if err != nil {
		return fmt.Errorf("failed to update order location: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// GetOrdersByStatus - Example of filtering by status
func (s *OrderServiceSupabase) GetOrdersByStatus(status string) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Eq("status", status).
		Order("created_at", false).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get orders by status: %w", err)
	}

	return orders, nil
}

// GetPendingOrdersForProvider - Example of multiple filters
func (s *OrderServiceSupabase) GetPendingOrdersForProvider(providerID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Eq("provider_id", providerID.String()).
		Eq("status", "pending").
		Order("created_at", false).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get pending orders: %w", err)
	}

	return orders, nil
}

// GetOrdersInDateRange - Example of date range filtering
func (s *OrderServiceSupabase) GetOrdersInDateRange(startDate, endDate time.Time) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Gte("created_at", startDate.Format(time.RFC3339)).
		Lte("created_at", endDate.Format(time.RFC3339)).
		Order("created_at", false).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get orders in date range: %w", err)
	}

	return orders, nil
}

// GetRecentOrders - Example of limiting results
func (s *OrderServiceSupabase) GetRecentOrders(limit int) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Order("created_at", false).
		Limit(limit).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get recent orders: %w", err)
	}

	return orders, nil
}

// CountOrdersByStatus - Example of counting with filters
func (s *OrderServiceSupabase) CountOrdersByStatus(status string) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filters := map[string]string{
		"status": status,
	}

	count, err := s.client.Count(ctx, "orders", filters)
	if err != nil {
		return 0, fmt.Errorf("failed to count orders: %w", err)
	}

	return count, nil
}

// GetOrdersWithUnpaidStatus - Example of filtering unpaid orders
func (s *OrderServiceSupabase) GetOrdersWithUnpaidStatus(userID uuid.UUID) ([]Order, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var orders []Order
	err := s.client.From("orders").
		Eq("user_id", userID.String()).
		Eq("payment_status", "pending").
		Order("created_at", false).
		Execute(ctx, &orders)

	if err != nil {
		return nil, fmt.Errorf("failed to get unpaid orders: %w", err)
	}

	return orders, nil
}

// DeleteOrder - Example of delete operation
func (s *OrderServiceSupabase) DeleteOrder(orderID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := database.DeleteByID(ctx, s.client, "orders", orderID)
	if err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}

	return nil
}
