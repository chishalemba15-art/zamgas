package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
)

// GoogleAuthRequest represents the request for Google authentication
type GoogleAuthRequest struct {
	Code        string          `json:"code" binding:"required"`
	RedirectURL string          `json:"redirect_url" binding:"required"`
	UserType    user.UserType   `json:"user_type" binding:"required"`
}

// GoogleSignUpRequest represents the request for Google sign-up
type GoogleSignUpRequest struct {
	AccessToken string        `json:"access_token" binding:"required"`
	UserType    user.UserType `json:"user_type" binding:"required"`
}

// HandleGoogleAuthInit initiates the Google OAuth flow
// Returns the Google OAuth authorization URL
func (s *GoogleOAuthService) HandleGoogleAuthInit() gin.HandlerFunc {
	return func(c *gin.Context) {
		redirectURL := c.Query("redirect_url")
		if redirectURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "redirect_url query parameter is required",
			})
			return
		}

		authURL, err := s.GetGoogleAuthURL(redirectURL)
		if err != nil {
			log.Printf("Failed to get Google auth URL: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to initiate Google authentication",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"auth_url": authURL,
			"message":  "Redirect to this URL to authenticate with Google",
		})
	}
}

// HandleExchangeSupabaseToken exchanges Supabase token for app JWT
// This endpoint receives the Supabase session token from the OAuth flow
func (s *GoogleOAuthService) HandleExchangeSupabaseToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req GoogleSignUpRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request body",
			})
			return
		}

		// Get user type from request
		userType := req.UserType
		if userType == "" {
			userType = user.UserTypeCustomer // Default to customer
		}

		// Exchange Supabase token for our JWT
		token, err := s.ExchangeSupabaseSessionForJWT(c.Request.Context(), req.AccessToken)
		if err != nil {
			log.Printf("Failed to exchange Supabase token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Failed to authenticate with Google",
				"details": err.Error(),
			})
			return
		}

		// Get user details
		userID, err := s.authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to validate generated token",
			})
			return
		}

		userData, err := s.userService.GetUserByID(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch user details",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Successfully authenticated with Google",
			"user":    userData,
			"token":   token,
		})
	}
}

// HandleGoogleSignUp handles Google sign-up with custom user type
func (s *GoogleOAuthService) HandleGoogleSignUp() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email    string        `json:"email" binding:"required,email"`
			Name     string        `json:"name" binding:"required"`
			Picture  string        `json:"picture"`
			UserType user.UserType `json:"user_type" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		// Create or get user
		googleUserInfo := &GoogleUserInfo{
			Email:    req.Email,
			Name:     req.Name,
			Picture:  req.Picture,
			Verified: true,
		}

		userData, token, err := s.SignUpWithGoogle(c.Request.Context(), googleUserInfo, req.UserType)
		if err != nil {
			log.Printf("Failed to sign up with Google: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to sign up with Google",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Successfully signed up with Google",
			"user":    userData,
			"token":   token,
		})
	}
}

// HandleSupabaseCallback handles the callback from Supabase Auth after Google OAuth
// This is the redirect endpoint that Supabase calls with the session
func (s *GoogleOAuthService) HandleSupabaseCallback() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Supabase redirects with access_token in fragment or query params
		accessToken := c.Query("access_token")
		if accessToken == "" {
			// Check in the request body for POST requests
			var req struct {
				AccessToken string `json:"access_token"`
				UserType    string `json:"user_type"`
			}
			if err := c.ShouldBindJSON(&req); err == nil {
				accessToken = req.AccessToken
			}
		}

		if accessToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "No access token provided",
			})
			return
		}

		// Get user type from query or body
		userType := c.Query("user_type")
		if userType == "" {
			userType = string(user.UserTypeCustomer)
		}

		// Exchange Supabase token for our JWT and create user if needed
		token, err := s.ExchangeSupabaseSessionForJWT(c.Request.Context(), accessToken)
		if err != nil {
			log.Printf("Failed to exchange Supabase session: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Failed to process authentication",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":   "Successfully authenticated with Google",
			"token":     token,
			"user_type": userType,
		})
	}
}

// HandleVerifyGoogleToken verifies a Google access token and returns user info
func (s *GoogleOAuthService) HandleVerifyGoogleToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			AccessToken string `json:"access_token" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request body",
			})
			return
		}

		// Verify token with Supabase
		token, err := s.ExchangeSupabaseSessionForJWT(c.Request.Context(), req.AccessToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid access token",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token":   token,
			"message": "Token verified successfully",
		})
	}
}

// GoogleOAuthResponse represents the response from Google OAuth endpoints
type GoogleOAuthResponse struct {
	Success   bool         `json:"success"`
	Message   string       `json:"message"`
	Token     string       `json:"token,omitempty"`
	User      *user.User   `json:"user,omitempty"`
	Error     string       `json:"error,omitempty"`
	AuthURL   string       `json:"auth_url,omitempty"`
	ExpiresIn int          `json:"expires_in,omitempty"`
}

// HandleGoogleAuthInfo returns Google OAuth configuration info
func (s *GoogleOAuthService) HandleGoogleAuthInfo() gin.HandlerFunc {
	return func(c *gin.Context) {
		response := gin.H{
			"provider":     "google",
			"supabase_url": s.supabaseURL,
			"endpoints": gin.H{
				"init":      "/auth/google/init",
				"callback":  "/auth/google/callback",
				"signup":    "/auth/google/signup",
				"verify":    "/auth/google/verify",
			},
			"required_env_vars": []string{
				"GOOGLE_CLIENT_ID",
				"GOOGLE_CLIENT_SECRET",
				"SUPABASE_URL",
				"SUPABASE_ANON_KEY",
			},
		}

		c.JSON(http.StatusOK, response)
	}
}

// ParseGoogleTokenFromHeader extracts the Google OAuth token from Authorization header
func ParseGoogleTokenFromHeader(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", nil
	}

	var token string
	if err := json.Unmarshal([]byte(authHeader), &token); err == nil {
		return token, nil
	}

	return authHeader, nil
}
