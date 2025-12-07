package order

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type OrderStatus string
type CylinderType string
type PaymentStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusAccepted  OrderStatus = "accepted"
	OrderStatusRejected  OrderStatus = "rejected"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusInTransit OrderStatus = "in-transit"
)

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusPaid     PaymentStatus = "paid"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusRefunded PaymentStatus = "refunded"
)
const (
	CylinderType3KG  CylinderType = "3KG"
	CylinderType5KG  CylinderType = "5KG"
	CylinderType6KG  CylinderType = "6KG"
	CylinderType9KG  CylinderType = "9KG"
	CylinderType12KG CylinderType = "12KG"
	CylinderType13KG CylinderType = "13KG"
	CylinderType14KG CylinderType = "14KG"
	CylinderType15KG CylinderType = "15KG"
	CylinderType18KG CylinderType = "18KG"
	CylinderType19KG CylinderType = "19KG"
	CylinderType20KG CylinderType = "20KG"
	CylinderType45KG CylinderType = "45KG"
	CylinderType48KG CylinderType = "48KG"
)

type Order struct {
	ID               uuid.UUID     `json:"id" db:"id"`
	UserID           uuid.UUID     `json:"user_id" db:"user_id"`
	ProviderID       *uuid.UUID    `json:"provider_id,omitempty" db:"provider_id"`
	CourierID        *uuid.UUID    `json:"courier_id,omitempty" db:"courier_id"`
	CourierName      string        `json:"courier_name,omitempty"`
	CourierPhone     string        `json:"courier_phone,omitempty"`
	Status           OrderStatus   `json:"status" db:"status"`
	CourierStatus    string        `json:"courier_status" db:"courier_status"`
	CylinderType     CylinderType  `json:"cylinder_type" db:"cylinder_type"`
	Quantity         int           `json:"quantity" db:"quantity"`
	PricePerUnit     float64       `json:"price_per_unit" db:"price_per_unit"`
	TotalPrice       float64       `json:"total_price" db:"total_price"`
	DeliveryFee      float64       `json:"delivery_fee" db:"delivery_fee"`
	ServiceCharge    float64       `json:"service_charge" db:"service_charge"`
	GrandTotal       float64       `json:"grand_total" db:"grand_total"`
	DeliveryAddress  string        `json:"delivery_address" db:"delivery_address"`
	DeliveryMethod   string        `json:"delivery_method" db:"delivery_method"`
	PaymentMethod    string        `json:"payment_method" db:"payment_method"`
	PaymentStatus    PaymentStatus `json:"payment_status" db:"payment_status"`
	CurrentLatitude  *float64      `json:"current_latitude,omitempty" db:"current_latitude"`
	CurrentLongitude *float64      `json:"current_longitude,omitempty" db:"current_longitude"`
	CurrentAddress   *string       `json:"current_address,omitempty" db:"current_address"`
	RideLink         string        `json:"ride_link" db:"ride_link"`
	CreatedAt        time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at" db:"updated_at"`
}

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address"`
}

func StringToOrderStatus(s string) (OrderStatus, error) {
	switch s {
	case "pending":
		return OrderStatusPending, nil
	case "accepted":
		return OrderStatusAccepted, nil
	case "rejected":
		return OrderStatusRejected, nil
	case "in-transit":
		return OrderStatusInTransit, nil
	case "delivered":
		return OrderStatusDelivered, nil
	default:
		return "", fmt.Errorf("invalid order status: %s", s)
	}
}
