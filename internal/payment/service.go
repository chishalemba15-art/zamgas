package payment

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/internal/order"
	"github.com/yakumwamba/lpg-delivery-system/internal/pawapay"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
)

type Service struct {
	db           *sql.DB
	orderService *order.Service
	userService  *user.Service
	pawaPay      *pawapay.Client
}

func NewService(db *sql.DB, orderService *order.Service, userService *user.Service, pawaPay *pawapay.Client) *Service {
	return &Service{
		db:           db,
		orderService: orderService,
		userService:  userService,
		pawaPay:      pawaPay,
	}
}

// InitiateDeposit initiates a deposit using PawaPay
func (s *Service) InitiateDeposit(orderID uuid.UUID, amount float64, phoneNumber string) (*Payment, error) {
	fmt.Printf("[PaymentService] Initiating deposit - OrderID: %s, Amount: %.2f, Phone: %s\n", orderID.String(), amount, phoneNumber)

	// Send deposit request to PawaPay
	depositResponse, err := s.pawaPay.InitiateDeposit(orderID.String(), amount, phoneNumber)
	if err != nil {
		fmt.Printf("[PaymentService] PawaPay error: %v\n", err)
		return nil, fmt.Errorf("PawaPay deposit failed: %w", err)
	}

	fmt.Printf("[PaymentService] Deposit response: %+v\n", depositResponse)

	// Check if deposit was rejected
	if depositResponse.Status == "REJECTED" && depositResponse.RejectionReason != nil {
		return nil, fmt.Errorf("deposit rejected: %s - %s",
			depositResponse.RejectionReason.RejectionCode,
			depositResponse.RejectionReason.RejectionMessage)
	}

	// Save payment record
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	payment := &Payment{
		ID:             uuid.New(),
		OrderID:        orderID,
		Amount:         amount,
		Status:         PaymentStatusPending,
		Provider:       "pawapay",
		PhoneNumber:    phoneNumber,
		TransactionRef: depositResponse.DepositID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	query := `
		INSERT INTO payments (
			id, order_id, amount, status, provider, phone_number,
			transaction_ref, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, updated_at
	`

	var paymentIDStr string
	err = s.db.QueryRowContext(ctx, query,
		payment.ID.String(), payment.OrderID.String(), payment.Amount, payment.Status,
		payment.Provider, payment.PhoneNumber, payment.TransactionRef,
		payment.CreatedAt, payment.UpdatedAt,
	).Scan(&paymentIDStr, &payment.CreatedAt, &payment.UpdatedAt)

	if err == nil {
		payment.ID, _ = uuid.Parse(paymentIDStr)
	}

	if err != nil {
		fmt.Printf("[PaymentService] Database error: %v\n", err)
		return nil, fmt.Errorf("failed to save payment: %w", err)
	}

	fmt.Printf("[PaymentService] Payment saved successfully - ID: %s, TransactionRef: %s\n", payment.ID.String(), payment.TransactionRef)
	return payment, nil
}

// HandleDepositCallback handles the callback from PawaPay
func (s *Service) HandleDepositCallback(depositID string, status string) error {
	// Update payment status based on callback
	var paymentStatus PaymentStatus
	var orderStatus order.PaymentStatus

	switch status {
	case "COMPLETED":
		paymentStatus = PaymentStatusCompleted
		orderStatus = order.PaymentStatusPaid
	case "FAILED":
		paymentStatus = PaymentStatusFailed
		orderStatus = order.PaymentStatusFailed
	default:
		return errors.New("invalid deposit status")
	}

	// Update payment record
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Get associated order ID from payments table
	var orderIDStr string
	queryGetOrder := `SELECT order_id FROM payments WHERE transaction_ref = $1`
	err := s.db.QueryRowContext(ctx, queryGetOrder, depositID).Scan(&orderIDStr)
	if err != nil {
		fmt.Printf("[PaymentService] Warning: Could not find order for transaction %s: %v\n", depositID, err)
		// Proceed to update payment table anyway, but we can't update order
	}

	// 2. Update payments table
	query := `
		UPDATE payments
		SET status = $1, updated_at = $2
		WHERE transaction_ref = $3
	`

	_, err = s.db.ExecContext(ctx, query, paymentStatus, time.Now(), depositID)
	if err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	// 3. Update orders table if order found
	if orderIDStr != "" {
		orderID, _ := uuid.Parse(orderIDStr)
		fmt.Printf("[PaymentService] Syncing order %s status to %s\n", orderIDStr, orderStatus)

		if err := s.orderService.UpdateOrderPaymentStatus(orderID, orderStatus); err != nil {
			fmt.Printf("[PaymentService] Failed to sync order status: %v\n", err)
			// Don't error out the callback, as payment record is updated
		}
	}

	return nil
}

// GetPaymentByOrderID gets a payment by order ID
func (s *Service) GetPaymentByOrderID(orderID uuid.UUID) (*Payment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var payment Payment
	query := `
		SELECT id, order_id, amount, status, provider, phone_number,
			transaction_ref, created_at, updated_at
		FROM payments
		WHERE order_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	var paymentIDStr, orderIDStr string
	err := s.db.QueryRowContext(ctx, query, orderID.String()).Scan(
		&paymentIDStr, &orderIDStr, &payment.Amount, &payment.Status,
		&payment.Provider, &payment.PhoneNumber, &payment.TransactionRef,
		&payment.CreatedAt, &payment.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	payment.ID, _ = uuid.Parse(paymentIDStr)
	payment.OrderID, _ = uuid.Parse(orderIDStr)

	return &payment, nil
}
