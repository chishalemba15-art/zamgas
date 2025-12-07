package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
)

// GoogleOAuthService handles Google OAuth authentication
type GoogleOAuthService struct {
	supabaseURL   string
	supabaseKey   string
	googleClientID string
	googleSecret  string
	db            *pgxpool.Pool
	userService   *user.Service
	authService   *Service
}

// GoogleTokenResponse represents the token response from Supabase auth
type GoogleTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	User        struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		UserMetadata struct {
			Email         string `json:"email"`
			EmailVerified bool   `json:"email_verified"`
			FullName      string `json:"full_name"`
			Picture       string `json:"picture"`
		} `json:"user_metadata"`
	} `json:"user"`
}

// GoogleUserInfo represents user info from Google
type GoogleUserInfo struct {
	ID       string `json:"sub"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
	Verified bool   `json:"email_verified"`
}

// NewGoogleOAuthService creates a new Google OAuth service
func NewGoogleOAuthService(
	db *pgxpool.Pool,
	userService *user.Service,
	authService *Service,
) *GoogleOAuthService {
	return &GoogleOAuthService{
		supabaseURL:    os.Getenv("SUPABASE_URL"),
		supabaseKey:    os.Getenv("SUPABASE_ANON_KEY"),
		googleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
		googleSecret:   os.Getenv("GOOGLE_CLIENT_SECRET"),
		db:             db,
		userService:    userService,
		authService:    authService,
	}
}

// GetGoogleAuthURL returns the Google OAuth authorization URL
func (s *GoogleOAuthService) GetGoogleAuthURL(redirectURL string) (string, error) {
	if s.googleClientID == "" {
		return "", fmt.Errorf("GOOGLE_CLIENT_ID not configured")
	}

	// Supabase handles the Google OAuth flow
	// Construct the Supabase auth URL
	authURL := fmt.Sprintf(
		"%s/auth/v1/authorize?provider=google&redirect_to=%s",
		s.supabaseURL,
		url.QueryEscape(redirectURL),
	)

	return authURL, nil
}

// ExchangeAuthCodeForToken exchanges authorization code for token using Supabase
func (s *GoogleOAuthService) ExchangeAuthCodeForToken(ctx context.Context, code string) (*user.User, string, error) {
	if code == "" {
		return nil, "", fmt.Errorf("authorization code not provided")
	}

	// For Supabase local setup, the OAuth flow is handled differently
	// We need to get the session info from the callback
	return s.processSupabaseAuth(ctx, code)
}

// processSupabaseAuth processes authentication from Supabase
func (s *GoogleOAuthService) processSupabaseAuth(ctx context.Context, sessionData string) (*user.User, string, error) {
	// In a real implementation, Supabase will return session data
	// You'll need to parse this and extract user information

	// For now, we'll create a method that works with the Supabase JWT
	// The client should send the Supabase session JWT
	return nil, "", fmt.Errorf("implement processSupabaseAuth based on your callback data")
}

// SignUpWithGoogle creates a user from Google OAuth data
func (s *GoogleOAuthService) SignUpWithGoogle(ctx context.Context, googleUserInfo *GoogleUserInfo, userType user.UserType) (*user.User, string, error) {
	// Check if user already exists by email
	existingUser, err := s.userService.GetUserByEmail(googleUserInfo.Email)
	if err == nil && existingUser != nil {
		// User exists, just generate token
		token, err := s.authService.GenerateToken(existingUser.ID)
		if err != nil {
			return nil, "", fmt.Errorf("failed to generate token: %w", err)
		}
		return existingUser, token, nil
	}

	// Create new user from Google info
	newUser := &user.User{
		ID:    uuid.New(),
		Email: googleUserInfo.Email,
		Name:  googleUserInfo.Name,
		// Password is empty for OAuth users
		Password: "",
		UserType: userType,
	}

	createdUser, err := s.userService.CreateUser(newUser)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.authService.GenerateToken(createdUser.ID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return createdUser, token, nil
}

// VerifySupabaseJWT verifies and validates a Supabase JWT token
func (s *GoogleOAuthService) VerifySupabaseJWT(tokenString string) (*SupabaseJWTClaims, error) {
	// For local Supabase, we need to verify the JWT using the JWT_SECRET from the env
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET not configured")
	}

	// Parse the JWT token
	// This would typically be done with the JWT library
	// For now, we'll return a placeholder
	return nil, fmt.Errorf("implement JWT verification")
}

// SupabaseJWTClaims represents claims in a Supabase JWT token
type SupabaseJWTClaims struct {
	Sub           string                 `json:"sub"`
	Aud           string                 `json:"aud"`
	AuthorizedAt  int64                  `json:"authorized_at"`
	UserMetadata  map[string]interface{} `json:"user_metadata"`
	ProviderID    string                 `json:"provider_id"`
	Provider      string                 `json:"provider"`
	Email         string                 `json:"email"`
	EmailVerified bool                   `json:"email_verified"`
	PhoneVerified bool                   `json:"phone_verified"`
	ExpiresAt     int64                  `json:"expires_at"`
}

// ExchangeSupabaseSessionForJWT exchanges a Supabase session for a JWT
func (s *GoogleOAuthService) ExchangeSupabaseSessionForJWT(ctx context.Context, supabaseAccessToken string) (string, error) {
	// Get user info from Supabase
	userInfoURL := fmt.Sprintf("%s/auth/v1/user", s.supabaseURL)

	req, err := http.NewRequestWithContext(ctx, "GET", userInfoURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", supabaseAccessToken))
	req.Header.Set("apikey", s.supabaseKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to get user info: %s", string(body))
	}

	var userInfo struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		UserMetadata struct {
			FullName string `json:"full_name"`
		} `json:"user_metadata"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return "", fmt.Errorf("failed to decode user info: %w", err)
	}

	// Create or get user
	existingUser, err := s.userService.GetUserByEmail(userInfo.Email)
	var appUser *user.User

	if err == nil && existingUser != nil {
		appUser = existingUser
	} else {
		// Create new user
		appUser = &user.User{
			ID:       uuid.New(),
			Email:    userInfo.Email,
			Name:     userInfo.UserMetadata.FullName,
			UserType: user.UserTypeCustomer, // Default type
		}

		createdUser, err := s.userService.CreateUser(appUser)
		if err != nil {
			return "", fmt.Errorf("failed to create user: %w", err)
		}
		appUser = createdUser
	}

	// Generate our own JWT for the app
	token, err := s.authService.GenerateToken(appUser.ID)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	return token, nil
}
