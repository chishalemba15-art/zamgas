package payment

import (
	"time"

	"github.com/google/uuid"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusFailed    PaymentStatus = "failed"
)

type Payment struct {
	ID             uuid.UUID     `json:"id" db:"id"`
	OrderID        uuid.UUID     `json:"order_id" db:"order_id"`
	Amount         float64       `json:"amount" db:"amount"`
	Status         PaymentStatus `json:"status" db:"status"`
	Provider       string        `json:"provider" db:"provider"`
	PhoneNumber    string        `json:"phone_number" db:"phone_number"`
	TransactionRef string        `json:"transaction_ref,omitempty" db:"transaction_ref"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" db:"updated_at"`
}
