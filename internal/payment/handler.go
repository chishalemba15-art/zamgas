package payment

import (
	"bytes"
	"io"
	"net/http"

	log "github.com/sirupsen/logrus"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// InitiateDepositHandler handles deposit initiation
func (h *Handler) InitiateDepositHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := log.WithFields(log.Fields{
			"handler": "InitiateDepositHandler",
			"method":  c.Request.Method,
			"path":    c.Request.URL.Path,
		})

		logger.Info("Received deposit request")

		// Log headers
		logger.WithField("headers", c.Request.Header).Debug("Request headers")

		// Read and log raw request body
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			logger.WithError(err).Error("Failed to read request body")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
			return
		}

		// Restore the request body for later binding
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		logger.WithField("body", string(bodyBytes)).Debug("Raw request body")

		var request struct {
			OrderID     string  `json:"order_id"`
			Amount      float64 `json:"amount"`
			PhoneNumber string  `json:"phone_number"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			logger.WithError(err).Error("Failed to bind JSON request")
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid request",
				"details": err.Error(),
			})
			return
		}

		logger.WithFields(log.Fields{
			"orderID":     request.OrderID,
			"amount":      request.Amount,
			"phoneNumber": request.PhoneNumber,
		}).Info("Processing deposit request")

		orderID, err := uuid.Parse(request.OrderID)
		if err != nil {
			logger.WithError(err).Error("Invalid order ID format")
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid order ID",
				"details": err.Error(),
			})
			return
		}

		logger.WithField("orderID", orderID.String()).Debug("Parsed order ID to UUID")

		payment, err := h.service.InitiateDeposit(orderID, request.Amount, request.PhoneNumber)
		if err != nil {
			logger.WithError(err).Error("Failed to initiate deposit")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "failed to initiate deposit",
				"details": err.Error(),
			})
			return
		}

		logger.WithFields(log.Fields{
			"transactionRef": payment.TransactionRef,
			"status":         payment.Status,
		}).Info("Deposit initiated successfully")

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"depositId": payment.TransactionRef,
			"message":   "Deposit initiated successfully",
		})
	}
}

func (h *Handler) CheckDepositStatusHandler(c *gin.Context) {
	depositId := c.Param("depositId")

	// Fetch deposit status from PawaPay
	status, err := h.service.pawaPay.GetPaymentStatus("deposits", depositId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return deposit status
	c.JSON(http.StatusOK, gin.H{
		"status": status,
	})
}
func (h *Handler) DepositCallbackHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var callback struct {
			DepositID string `json:"deposit_id"`
			Status    string `json:"status"`
		}

		if err := c.ShouldBindJSON(&callback); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid callback data"})
			return
		}

		if err := h.service.HandleDepositCallback(callback.DepositID, callback.Status); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "callback processed successfully"})
	}
}
