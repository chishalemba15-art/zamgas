// pawapay/client.go

package pawapay

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

type Client struct {
	BaseURL     string
	HTTPClient  *http.Client
	Token       string
	ApiKey      string
	CallbackURL string // Webhook URL for payment status callbacks
}

func NewClient(baseURL, token, apiKey, callbackURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		Token:       token,
		ApiKey:      apiKey,
		CallbackURL: callbackURL,
	}
}

// Common types
type Amount struct {
	Value    string `json:"value"`
	Currency string `json:"currency"`
}

type Metadata struct {
	FieldName string `json:"fieldName"`  // Changed from field_name
	Value     string `json:"fieldValue"` // Changed from field_value
	Sensitive bool   `json:"sensitive"`  // Changed from is_pii and made optional
}

type Address struct {
	Value string `json:"value"`
}

type Recipient struct {
	Address Address `json:"address"`
	Type    string  `json:"type"`
}

// Deposit types - V2 API Structure
type Deposit struct {
	DepositID   string     `json:"depositId"`
	Amount      string     `json:"amount"`
	Currency    string     `json:"currency"`
	Payer       Payer      `json:"payer"`
	CallbackURL string     `json:"callbackUrl,omitempty"` // Optional webhook URL for status updates
	Metadata    []Metadata `json:"metadata,omitempty"`
}

// V2 API Payer structure
type Payer struct {
	Type           string         `json:"type"` // "MMO" for mobile money
	AccountDetails AccountDetails `json:"accountDetails"`
}

// Account details for V2 API
type AccountDetails struct {
	PhoneNumber string `json:"phoneNumber"`
	Provider    string `json:"provider"` // e.g., "AIRTEL_OAPI_ZMB", "MTN_MOMO_ZMB"
}

// Add these new structs for handling rejections
type RejectionReason struct {
	RejectionCode    string `json:"rejectionCode"`
	RejectionMessage string `json:"rejectionMessage"`
}

// Update DepositResponse to include all possible fields
type DepositResponse struct {
	DepositID       string           `json:"depositId"`
	Status          string           `json:"status"`
	Created         string           `json:"created,omitempty"`
	RejectionReason *RejectionReason `json:"rejectionReason,omitempty"`
}

// PawaPay V2 Status Check Response Wrapper
type DepositStatusCheckResponse struct {
	Status string                 `json:"status"` // "FOUND" or "NOT_FOUND"
	Data   *DepositStatusResponse `json:"data,omitempty"`
}

type DepositStatusResponse struct {
	DepositID string `json:"depositId"`
	Status    string `json:"status"`
	Amount    string `json:"amount"`
	Currency  string `json:"currency"`
	Created   string `json:"created,omitempty"`
	Country   string `json:"country,omitempty"`

	// Payer info
	Payer *struct {
		Type           string `json:"type"`
		AccountDetails struct {
			PhoneNumber string `json:"phoneNumber"`
			Provider    string `json:"provider"`
		} `json:"accountDetails"`
	} `json:"payer,omitempty"`

	// For failed deposits
	FailureReason *struct {
		FailureCode    string `json:"failureCode"`
		FailureMessage string `json:"failureMessage"`
	} `json:"failureReason,omitempty"`
}

// Payout types
type Payout struct {
	PayoutID             string     `json:"payout_id"`
	Amount               Amount     `json:"amount"`
	Correspondent        string     `json:"correspondent"`
	Recipient            Recipient  `json:"recipient"`
	CustomerTimestamp    string     `json:"customer_timestamp"`
	StatementDescription string     `json:"statement_description"`
	Country              string     `json:"country"`
	CallbackURL          string     `json:"callback_url,omitempty"`
	Metadata             []Metadata `json:"metadata"`
}

type PayoutResponse struct {
	PayoutID string `json:"payout_id"`
	Status   string `json:"status"`
}

// Refund types
type Refund struct {
	RefundID    string     `json:"refund_id"`
	DepositID   string     `json:"deposit_id"`
	Amount      Amount     `json:"amount"`
	Reason      string     `json:"reason"`
	CallbackURL string     `json:"callback_url,omitempty"`
	Metadata    []Metadata `json:"metadata,omitempty"`
}

type RefundResponse struct {
	RefundID string `json:"refund_id"`
	Status   string `json:"status"`
}

// Session types
type PaymentSession struct {
	SessionID   string    `json:"session_id"`
	Amount      Amount    `json:"amount"`
	ReturnURL   string    `json:"return_url"`
	Description string    `json:"description"`
	ExpiresAt   time.Time `json:"expires_at"`
}

type SessionResponse struct {
	SessionID   string `json:"session_id"`
	RedirectURL string `json:"redirect_url"`
}

// Client methods
func (c *Client) CreatePaymentSession(session PaymentSession) (*SessionResponse, error) {
	resp, err := c.sendRequest("POST", "/v1/widget/sessions", session)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result SessionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) InitiateDeposit(orderID string, amount float64, phoneNumber string) (*DepositResponse, error) {
	logger := log.WithFields(log.Fields{
		"method":      "InitiateDeposit",
		"orderID":     orderID,
		"amount":      amount,
		"phoneNumber": phoneNumber,
	})

	// Clean phone number - remove + prefix and any non-numeric characters
	// PawaPay V2 requires only digits: 260773962307 (not +260773962307)
	cleanPhone := strings.TrimPrefix(phoneNumber, "+")
	cleanPhone = strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1 // Remove non-numeric characters
	}, cleanPhone)

	logger.WithFields(log.Fields{
		"originalPhone": phoneNumber,
		"cleanedPhone":  cleanPhone,
	}).Info("Cleaned phone number for PawaPay V2")

	// V2 API structure - simplified, no correspondent, country, timestamps needed
	deposit := Deposit{
		DepositID: uuid.New().String(),
		Amount:    fmt.Sprintf("%.2f", amount),
		Currency:  "ZMW",
		Payer: Payer{
			Type: "MMO", // Mobile Money Operator
			AccountDetails: AccountDetails{
				PhoneNumber: cleanPhone,
				Provider:    "AIRTEL_OAPI_ZMB", // Airtel Zambia provider code
			},
		},
		// CallbackURL: c.CallbackURL, // Removed: PawaPay V2 API returns UNSUPPORTED_PARAMETER for this field in body
		Metadata: []Metadata{
			{
				FieldName: "orderId",
				Value:     orderID,
				Sensitive: false,
			},
		},
	}

	logger.WithFields(log.Fields{
		"depositId":   deposit.DepositID,
		"provider":    deposit.Payer.AccountDetails.Provider,
		"callbackURL": deposit.CallbackURL,
	}).Info("Initiating PawaPay V2 deposit")

	req, err := c.sendRequest("POST", "/deposits", deposit)
	if err != nil {
		logger.WithError(err).Error("Failed to create deposit request")
		return nil, fmt.Errorf("failed to create deposit request: %w", err)
	}
	defer req.Body.Close()

	body, err := io.ReadAll(req.Body)
	if err != nil {
		logger.WithError(err).Error("Failed to read response body")
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	logger.WithFields(log.Fields{
		"statusCode": req.StatusCode,
		"response":   string(body),
	}).Info("Received PawaPay response")

	var response DepositResponse
	if err := json.Unmarshal(body, &response); err != nil {
		logger.WithError(err).WithField("body", string(body)).Error("Failed to unmarshal response")
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Check for rejection
	if response.Status == "REJECTED" && response.RejectionReason != nil {
		logger.WithFields(log.Fields{
			"rejectionCode":    response.RejectionReason.RejectionCode,
			"rejectionMessage": response.RejectionReason.RejectionMessage,
		}).Error("Deposit request rejected")
		return &response, fmt.Errorf("deposit rejected: %s - %s",
			response.RejectionReason.RejectionCode,
			response.RejectionReason.RejectionMessage)
	}

	logger.WithField("status", response.Status).Info("Deposit initiated successfully")
	return &response, nil
}

// Helper function to send requests with proper error handling
func (c *Client) sendRequest(method, path string, body interface{}) (*http.Response, error) {
	logger := log.WithFields(log.Fields{
		"method": method,
		"path":   path,
	})

	// Ensure V2 API path
	if !strings.HasPrefix(path, "/v2/") {
		path = "/v2" + path
	}

	url := fmt.Sprintf("%s%s", strings.TrimRight(c.BaseURL, "/"), path)
	fmt.Println("Here is the url ", url)
	logger.WithField("url", url).Debug("Preparing request")

	var req *http.Request
	var err error

	if body != nil {
		bodyJSON, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		logger.WithField("payload", string(bodyJSON)).Debug("Request payload")
		req, err = http.NewRequest(method, url, bytes.NewBuffer(bodyJSON))
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %w", err)
		}
	} else {
		req, err = http.NewRequest(method, url, nil)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.Token))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	// Log response status
	logger.WithFields(log.Fields{
		"status": resp.StatusCode,
	}).Debug("Received response")

	return resp, nil
}

func (c *Client) InitiatePayout(payout Payout) (*PayoutResponse, error) {
	resp, err := c.sendRequest("POST", "/payouts", payout)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result PayoutResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) InitiateRefund(refund Refund) (*RefundResponse, error) {
	resp, err := c.sendRequest("POST", "/refunds", refund)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result RefundResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *Client) GetPaymentStatus(paymentType, id string) (*DepositStatusResponse, error) {
	logger := log.WithFields(log.Fields{
		"method":      "GetPaymentStatus",
		"paymentType": paymentType,
		"id":          id,
	})

	endpoint := fmt.Sprintf("/%s/%s", paymentType, id)
	resp, err := c.sendRequest("GET", endpoint, nil)
	if err != nil {
		logger.WithError(err).Error("Failed to get payment status")
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.WithError(err).Error("Failed to read response body")
		return nil, err
	}

	// PawaPay V2: Response is wrapped in {status: "FOUND"/"NOT_FOUND", data: {...}}
	var wrapper DepositStatusCheckResponse
	if err := json.NewDecoder(bytes.NewReader(bodyBytes)).Decode(&wrapper); err != nil {
		logger.WithError(err).Error("Failed to decode wrapper response")
		return nil, err
	}

	// If status is NOT_FOUND, return a response indicating that
	if wrapper.Status == "NOT_FOUND" {
		logger.Info("Payment not found in PawaPay")
		return &DepositStatusResponse{
			DepositID: id,
			Status:    "NOT_FOUND",
			Currency:  "",
		}, nil
	}

	// If FOUND, extract the data
	if wrapper.Data == nil {
		logger.Error("Wrapper status is FOUND but data is nil")
		return nil, fmt.Errorf("invalid response: status FOUND but no data")
	}

	response := wrapper.Data

	// Log appropriate message based on status
	switch response.Status {
	case "COMPLETED":
		logger.Info("Payment completed successfully")
	case "FAILED":
		if response.FailureReason != nil {
			logger.WithFields(log.Fields{
				"failureCode":    response.FailureReason.FailureCode,
				"failureMessage": response.FailureReason.FailureMessage,
			}).Error("Payment failed")
		}
	case "ACCEPTED":
		logger.Info("Payment accepted for processing")
	case "SUBMITTED":
		logger.Info("Payment submitted to provider")
	}

	return response, nil
}

func (c *Client) IsOperational(phoneNumber string) bool {
	resp, err := c.sendRequest("GET", "/status", nil)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	var result struct {
		Operational bool `json:"operational"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false
	}
	return result.Operational
}
