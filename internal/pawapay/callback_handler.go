package pawapay

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

// CallbackHandler handles PawaPay webhook callbacks
type CallbackHandler struct {
	db *sql.DB
}

// NewCallbackHandler creates a new callback handler
func NewCallbackHandler(db *sql.DB) *CallbackHandler {
	return &CallbackHandler{db: db}
}

// Callback types for PawaPay webhooks
type DepositCallback struct {
	DepositID       string         `json:"depositId"`
	Status          string         `json:"status"` // COMPLETED, FAILED, SUBMITTED, etc
	Amount          string         `json:"amount,omitempty"`
	Currency        string         `json:"currency,omitempty"`
	Created         string         `json:"created,omitempty"`
	FailureReason   *FailureReason `json:"failureReason,omitempty"`
	DepositedAmount string         `json:"depositedAmount,omitempty"`
	Correspondent   string         `json:"correspondent,omitempty"`
}

type PayoutCallback struct {
	PayoutID      string         `json:"payoutId"`
	Status        string         `json:"status"`
	Amount        string         `json:"amount,omitempty"`
	Currency      string         `json:"currency,omitempty"`
	Created       string         `json:"created,omitempty"`
	FailureReason *FailureReason `json:"failureReason,omitempty"`
}

type RefundCallback struct {
	RefundID      string         `json:"refundId"`
	DepositID     string         `json:"depositId,omitempty"`
	Status        string         `json:"status"`
	Amount        string         `json:"amount,omitempty"`
	Currency      string         `json:"currency,omitempty"`
	FailureReason *FailureReason `json:"failureReason,omitempty"`
}

type FailureReason struct {
	FailureCode    string `json:"failureCode"`
	FailureMessage string `json:"failureMessage"`
}

// HandleDepositCallback processes deposit status webhook from PawaPay
func (h *CallbackHandler) HandleDepositCallback(payload []byte) error {
	logger := log.WithField("handler", "HandleDepositCallback")

	// Log raw payload for debugging
	logger.WithField("payload", string(payload)).Debug("Received deposit callback")

	var callback DepositCallback
	if err := json.Unmarshal(payload, &callback); err != nil {
		logger.WithError(err).Error("Failed to unmarshal deposit callback")
		return fmt.Errorf("failed to unmarshal deposit callback: %w", err)
	}

	logger.WithFields(log.Fields{
		"depositId": callback.DepositID,
		"status":    callback.Status,
		"amount":    callback.Amount,
	}).Info("Processing deposit callback")

	// Update payment status in database
	if err := h.updateDepositStatus(callback); err != nil {
		logger.WithError(err).Error("Failed to update deposit status")
		return err
	}

	logger.Info("Deposit callback processed successfully")
	return nil
}

// HandlePayoutCallback processes payout status webhook from PawaPay
func (h *CallbackHandler) HandlePayoutCallback(payload []byte) error {
	logger := log.WithField("handler", "HandlePayoutCallback")

	var callback PayoutCallback
	if err := json.Unmarshal(payload, &callback); err != nil {
		logger.WithError(err).Error("Failed to unmarshal payout callback")
		return fmt.Errorf("failed to unmarshal payout callback: %w", err)
	}

	logger.WithFields(log.Fields{
		"payoutId": callback.PayoutID,
		"status":   callback.Status,
	}).Info("Processing payout callback")

	// Update payout status if you have payouts table
	// For now, just log it
	logger.Info("Payout callback processed successfully")
	return nil
}

// HandleRefundCallback processes refund status webhook from PawaPay
func (h *CallbackHandler) HandleRefundCallback(payload []byte) error {
	logger := log.WithField("handler", "HandleRefundCallback")

	var callback RefundCallback
	if err := json.Unmarshal(payload, &callback); err != nil {
		logger.WithError(err).Error("Failed to unmarshal refund callback")
		return fmt.Errorf("failed to unmarshal refund callback: %w", err)
	}

	logger.WithFields(log.Fields{
		"refundId":  callback.RefundID,
		"depositId": callback.DepositID,
		"status":    callback.Status,
	}).Info("Processing refund callback")

	if err := h.updateRefundStatus(callback); err != nil {
		logger.WithError(err).Error("Failed to update refund status")
		return err
	}

	logger.Info("Refund callback processed successfully")
	return nil
}

// updateDepositStatus updates payment and order status based on deposit callback
func (h *CallbackHandler) updateDepositStatus(callback DepositCallback) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Map PawaPay status to our payment status
	var paymentStatus string
	var orderPaymentStatus string

	switch callback.Status {
	case "COMPLETED":
		paymentStatus = "completed"
		orderPaymentStatus = "paid"
	case "FAILED":
		paymentStatus = "failed"
		orderPaymentStatus = "failed"
	case "SUBMITTED", "ACCEPTED":
		paymentStatus = "pending"
		orderPaymentStatus = "pending"
	default:
		paymentStatus = "pending"
		orderPaymentStatus = "pending"
	}

	// Find payment record by deposit ID (transaction_ref)
	var orderID uuid.UUID
	query := `
		SELECT order_id FROM payments 
		WHERE transaction_ref = $1
	`
	err := h.db.QueryRowContext(ctx, query, callback.DepositID).Scan(&orderID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.WithField("depositId", callback.DepositID).Warn("No payment found for deposit ID")
			return nil // Don't fail - might be a test callback
		}
		return fmt.Errorf("failed to find payment: %w", err)
	}

	// Update payment status
	updatePaymentQuery := `
		UPDATE payments 
		SET status = $1, updated_at = $2
		WHERE transaction_ref = $3
	`
	_, err = h.db.ExecContext(ctx, updatePaymentQuery, paymentStatus, time.Now(), callback.DepositID)
	if err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	// Update order payment status
	updateOrderQuery := `
		UPDATE orders 
		SET payment_status = $1, updated_at = $2
		WHERE id = $3
	`
	_, err = h.db.ExecContext(ctx, updateOrderQuery, orderPaymentStatus, time.Now(), orderID.String())
	if err != nil {
		return fmt.Errorf("failed to update order payment status: %w", err)
	}

	log.WithFields(log.Fields{
		"depositId":    callback.DepositID,
		"orderId":      orderID.String(),
		"status":       paymentStatus,
		"orderPayment": orderPaymentStatus,
	}).Info("Updated payment and order status")

	// AUTO-ASSIGN COURIER when payment is COMPLETED
	if callback.Status == "COMPLETED" {
		go h.autoAssignCourier(orderID)
	}

	return nil
}

// autoAssignCourier finds and assigns the best courier after payment is completed
func (h *CallbackHandler) autoAssignCourier(orderID uuid.UUID) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	logger := log.WithField("orderId", orderID.String())
	logger.Info("Starting auto-assignment for order")

	// 1. Get provider location from the order
	var providerID string
	var providerLat, providerLng sql.NullFloat64

	providerQuery := `
		SELECT o.provider_id, u.latitude, u.longitude
		FROM orders o
		JOIN users u ON o.provider_id = u.id
		WHERE o.id = $1 AND o.courier_id IS NULL
	`

	err := h.db.QueryRowContext(ctx, providerQuery, orderID.String()).Scan(&providerID, &providerLat, &providerLng)
	if err != nil {
		if err == sql.ErrNoRows {
			logger.Warn("Order not found or already has courier assigned")
			return
		}
		logger.WithError(err).Error("Failed to get provider location")
		return
	}

	if !providerLat.Valid || !providerLng.Valid {
		logger.Warn("Provider has no location set, using default Lusaka coordinates")
		providerLat.Float64 = -15.4167
		providerLng.Float64 = 28.2833
	}

	// 2. Find best available courier
	courierQuery := `
		SELECT 
			u.id,
			u.latitude,
			u.longitude,
			COALESCE(u.rating, 0) as rating,
			(SELECT COUNT(*) FROM orders WHERE courier_id = u.id AND status IN ('accepted', 'in-transit')) as active_orders
		FROM users u
		WHERE u.user_type = 'courier'
			AND u.latitude IS NOT NULL
			AND u.longitude IS NOT NULL
		ORDER BY 
			-- Distance-based ordering (rough approximation)
			SQRT(POWER(u.latitude - $1, 2) + POWER(u.longitude - $2, 2)) ASC,
			active_orders ASC,
			rating DESC
		LIMIT 1
	`

	var courierID string
	var courierLat, courierLng sql.NullFloat64
	var rating, activeOrders int

	err = h.db.QueryRowContext(ctx, courierQuery, providerLat.Float64, providerLng.Float64).Scan(
		&courierID, &courierLat, &courierLng, &rating, &activeOrders,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			logger.Warn("No available couriers found for auto-assignment")
			return
		}
		logger.WithError(err).Error("Failed to find best courier")
		return
	}

	// 3. Assign courier to order
	assignQuery := `
		UPDATE orders
		SET courier_id = $1, courier_status = 'pending', status = 'accepted', updated_at = $2
		WHERE id = $3 AND courier_id IS NULL
	`

	result, err := h.db.ExecContext(ctx, assignQuery, courierID, time.Now(), orderID.String())
	if err != nil {
		logger.WithError(err).Error("Failed to assign courier")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		logger.Warn("Order already has courier assigned or not found")
		return
	}

	logger.WithFields(log.Fields{
		"courierId":    courierID,
		"courierLat":   courierLat.Float64,
		"courierLng":   courierLng.Float64,
		"activeOrders": activeOrders,
	}).Info("✅ Auto-assigned courier to order")
}

// updateRefundStatus updates refund status in database
func (h *CallbackHandler) updateRefundStatus(callback RefundCallback) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var refundStatus string
	switch callback.Status {
	case "COMPLETED":
		refundStatus = "completed"
	case "FAILED":
		refundStatus = "failed"
	default:
		refundStatus = "pending"
	}

	// Find original payment by deposit ID and update
	query := `
		UPDATE payments 
		SET status = $1, updated_at = $2
		WHERE transaction_ref = $3
	`
	_, err := h.db.ExecContext(ctx, query, refundStatus, time.Now(), callback.DepositID)
	if err != nil {
		return fmt.Errorf("failed to update refund status: %w", err)
	}

	// If refund completed, update order payment status too
	if refundStatus == "completed" {
		orderQuery := `
			UPDATE orders
			SET payment_status = 'refunded', updated_at = $1
			WHERE id IN (
				SELECT order_id FROM payments WHERE transaction_ref = $2
			)
		`
		_, err = h.db.ExecContext(ctx, orderQuery, time.Now(), callback.DepositID)
		if err != nil {
			log.WithError(err).Error("Failed to update order for refund")
		}
	}

	return nil
}
