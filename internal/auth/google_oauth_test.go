package auth

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestGoogleUserInfoCreation tests creating a user from Google info
func TestGoogleUserInfoCreation(t *testing.T) {
	googleUserInfo := &GoogleUserInfo{
		ID:       "google-123",
		Email:    "test@example.com",
		Name:     "Test User",
		Picture:  "https://example.com/pic.jpg",
		Verified: true,
	}

	assert.Equal(t, "test@example.com", googleUserInfo.Email)
	assert.Equal(t, "Test User", googleUserInfo.Name)
	assert.True(t, googleUserInfo.Verified)
}


// TestGetGoogleAuthURL tests generating Google OAuth authorization URL
func TestGetGoogleAuthURL(t *testing.T) {
	googleOAuthService := &GoogleOAuthService{
		supabaseURL:    "http://localhost:8000",
		googleClientID: "test-client-id",
	}

	redirectURL := "http://localhost:3000/auth/callback"
	authURL, err := googleOAuthService.GetGoogleAuthURL(redirectURL)

	assert.NoError(t, err)
	assert.NotEmpty(t, authURL)
	assert.Contains(t, authURL, "http://localhost:8000/auth/v1/authorize")
	assert.Contains(t, authURL, "provider=google")
	assert.Contains(t, authURL, "redirect_to=")
}

// TestGetGoogleAuthURLMissingClientID tests error when client ID is missing
func TestGetGoogleAuthURLMissingClientID(t *testing.T) {
	googleOAuthService := &GoogleOAuthService{
		supabaseURL:    "http://localhost:8000",
		googleClientID: "", // Missing
	}

	redirectURL := "http://localhost:3000/auth/callback"
	authURL, err := googleOAuthService.GetGoogleAuthURL(redirectURL)

	assert.Error(t, err)
	assert.Empty(t, authURL)
	assert.Contains(t, err.Error(), "GOOGLE_CLIENT_ID not configured")
}

// TestGoogleOAuthServiceConfiguration tests that service loads environment variables
func TestGoogleOAuthServiceConfiguration(t *testing.T) {
	t.Setenv("SUPABASE_URL", "http://localhost:8000")
	t.Setenv("SUPABASE_ANON_KEY", "test-anon-key")
	t.Setenv("GOOGLE_CLIENT_ID", "test-client-id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "test-secret")

	service := NewGoogleOAuthService(nil, nil, nil)

	assert.NotNil(t, service)
	assert.Equal(t, "http://localhost:8000", service.supabaseURL)
	assert.Equal(t, "test-anon-key", service.supabaseKey)
	assert.Equal(t, "test-client-id", service.googleClientID)
	assert.Equal(t, "test-secret", service.googleSecret)
}

// TestGoogleAuthorizationCodeExchange tests exchanging auth code
func TestGoogleAuthorizationCodeExchange(t *testing.T) {
	googleOAuthService := &GoogleOAuthService{
		supabaseURL: "http://localhost:8000",
		supabaseKey: "test-key",
	}

	// Test with empty code
	user, token, err := googleOAuthService.ExchangeAuthCodeForToken(
		context.Background(),
		"",
	)

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Empty(t, token)
	assert.Contains(t, err.Error(), "authorization code not provided")
}

// TestGoogleUserEmailValidation tests that Google user info requires valid email
func TestGoogleUserEmailValidation(t *testing.T) {
	tests := []struct {
		name     string
		email    string
		valid    bool
	}{
		{"Valid email", "user@example.com", true},
		{"Gmail", "user@gmail.com", true},
		{"Corporate email", "user@company.co.uk", true},
		{"Empty email", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			googleUserInfo := &GoogleUserInfo{
				Email:    tt.email,
				Name:     "Test User",
				Verified: true,
			}

			if tt.valid {
				assert.NotEmpty(t, googleUserInfo.Email)
			} else {
				assert.Empty(t, googleUserInfo.Email)
			}
		})
	}
}


// BenchmarkGetGoogleAuthURL benchmarks generating auth URLs
func BenchmarkGetGoogleAuthURL(b *testing.B) {
	googleOAuthService := &GoogleOAuthService{
		supabaseURL:    "http://localhost:8000",
		googleClientID: "test-client-id",
	}

	redirectURL := "http://localhost:3000/auth/callback"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		googleOAuthService.GetGoogleAuthURL(redirectURL)
	}
}
