// handlers.go
package auth

import (
	"fmt"
	"math/rand"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
)

func HandleVerifyCode(userService *user.Service, authService *Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := logrus.WithFields(logrus.Fields{
			"handler": "HandleVerifyCode",
			"path":    c.Request.URL.Path,
		})

		var request struct {
			PhoneNumber string `json:"phone_number" binding:"required"`
			Code        string `json:"code" binding:"required"`
		}

		if err := c.BindJSON(&request); err != nil {
			logger.WithError(err).Error("Failed to bind JSON request")
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request format",
			})
			return
		}

		logger = logger.WithField("phone_number", request.PhoneNumber)
		logger.Info("Processing verification code request")

		if !isValidZambianPhone(request.PhoneNumber) {
			logger.Warn("Invalid phone number format")
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid phone number format",
			})
			return
		}

		storedCode, err := getStoredVerificationCode(request.PhoneNumber)
		if err != nil {
			logger.WithError(err).Error("Failed to retrieve stored verification code")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to verify code",
			})
			return
		}

		if storedCode != request.Code {
			logger.WithFields(logrus.Fields{
				"provided_code": request.Code,
				"stored_code":   storedCode,
			}).Warn("Invalid verification code provided")
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid verification code",
			})
			return
		}

		existingUser, err := userService.GetUserByPhoneNumber(request.PhoneNumber)
		if err != nil && err != user.ErrUserNotFound {
			logger.WithError(err).Error("Failed to check existing user")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Error checking user status",
			})
			return
		}

		if existingUser != nil {
			logger.WithField("user_id", existingUser.ID).Info("Existing user found")
			token, err := authService.GenerateToken(existingUser.ID)
			if err != nil {
				logger.WithError(err).Error("Failed to generate token for existing user")
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to generate token",
				})
				return
			}

			logger.Info("Successfully verified existing user")
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Phone number verified",
				"token":   token,
				"user":    existingUser,
			})
			return
		}

		logger.Info("Creating new user")
		now := time.Now()
		newUser := &user.User{
			PhoneNumber:      request.PhoneNumber,
			PhoneVerified:    true,
			VerificationTime: &now,
		}

		createdUser, err := userService.CreateUser(newUser)
		if err != nil {
			logger.WithError(err).Error("Failed to create new user")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create user",
			})
			return
		}

		token, err := authService.GenerateToken(createdUser.ID)
		if err != nil {
			logger.WithError(err).Error("Failed to generate token for new user")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to generate token",
			})
			return
		}

		logger.WithField("user_id", createdUser.ID).Info("Successfully created and verified new user")
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Phone number verified and user created",
			"token":   token,
			"user":    createdUser,
		})
	}
}

func HandleSendCode(userService *user.Service, authService *Service, twilioService *TwilioClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := logrus.WithFields(logrus.Fields{
			"handler": "HandleSendCode",
			"path":    c.Request.URL.Path,
		})

		var request struct {
			PhoneNumber string `json:"phone_number" binding:"required"`
		}

		if err := c.BindJSON(&request); err != nil {
			logger.WithError(err).Error("Failed to bind JSON request")
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request format",
			})
			return
		}

		logger = logger.WithField("phone_number", request.PhoneNumber)
		logger.Info("Processing send code request")

		// if !isValidZambianPhone(request.PhoneNumber) {
		// 	logger.Warn("Invalid phone number format")
		// 	c.JSON(http.StatusBadRequest, gin.H{
		// 		"success": false,
		// 		"message": "Invalid phone number format",
		// 	})
		// 	return
		// }

		code := generateRandomCode()
		logger.WithField("code", code).Debug("Generated verification code")

		if err := storeVerificationCode(request.PhoneNumber, fmt.Sprintf("%d", code)); err != nil {
			logger.WithError(err).Error("Failed to store verification code")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to store verification code",
			})
			return
		}

		if err := twilioService.SendVerificationCode(request.PhoneNumber); err != nil {
			logger.WithError(err).Error("Failed to send verification code via Twilio")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to send verification code",
			})
			return
		}

		logger.Info("Successfully sent verification code")
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Verification code sent",
		})
	}
}

// Helper functions
func generateRandomCode() int {
	// Generate random 6-digit number
	return rand.Intn(900000) + 100000
}

func isValidZambianPhone(phone string) bool {
	// Remove spaces and special characters
	cleanNumber := regexp.MustCompile(`[^\d]`).ReplaceAllString(phone, "")
	// Check if it has 10 digits and starts with 0
	re := regexp.MustCompile(`^0[967][0-9]{8}$`)
	return re.MatchString(cleanNumber)
}

// You'll need to implement these functions with your preferred storage solution (e.g., Redis)
func storeVerificationCode(phoneNumber, code string) error {
	// Store code with expiration (e.g., 10 minutes)
	// Implementation depends on your storage solution
	return nil
}

func getStoredVerificationCode(phoneNumber string) (string, error) {
	// Retrieve stored code
	// Implementation depends on your storage solution
	return "", nil
}
