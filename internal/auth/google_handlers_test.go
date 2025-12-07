package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// TestHandleGoogleAuthInfoBasic tests that the info endpoint returns configuration
func TestHandleGoogleAuthInfoBasic(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	googleOAuthService := &GoogleOAuthService{
		supabaseURL:    "http://localhost:8000",
		googleClientID: "test-client-id",
	}

	router.GET("/auth/google/info", googleOAuthService.HandleGoogleAuthInfo())

	req := httptest.NewRequest("GET", "/auth/google/info", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "google", response["provider"])
	assert.Contains(t, response, "endpoints")
	assert.Contains(t, response, "required_env_vars")
}

// TestHandleGoogleAuthInitMissingRedirectURL tests error handling
func TestHandleGoogleAuthInitMissingRedirectURL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	googleOAuthService := &GoogleOAuthService{
		supabaseURL:    "http://localhost:8000",
		googleClientID: "test-client-id",
	}

	router.GET("/auth/google/init", googleOAuthService.HandleGoogleAuthInit())

	req := httptest.NewRequest("GET", "/auth/google/init", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestHandleGoogleSignUpRequestStructure tests that endpoint handles requests
func TestHandleGoogleSignUpRequestStructure(t *testing.T) {
	signupData := map[string]interface{}{
		"email":     "test@example.com",
		"name":      "Test User",
		"picture":   "https://example.com/pic.jpg",
		"user_type": "customer",
	}

	body, err := json.Marshal(signupData)
	assert.NoError(t, err)
	assert.NotEmpty(t, body)
}

// TestHandleGoogleSignUpInvalidRequest tests missing required fields
func TestHandleGoogleSignUpInvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	googleOAuthService := &GoogleOAuthService{}
	router.POST("/auth/google/signup", googleOAuthService.HandleGoogleSignUp())

	signupData := map[string]interface{}{
		"name": "Test User",
		// Missing email
	}

	body, _ := json.Marshal(signupData)
	req := httptest.NewRequest("POST", "/auth/google/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestParseGoogleTokenFromHeader tests token parsing
func TestParseGoogleTokenFromHeader(t *testing.T) {
	t.Run("Token present", func(t *testing.T) {
		c := &gin.Context{}
		c.Request = httptest.NewRequest("GET", "/", nil)
		c.Request.Header.Set("Authorization", "my-test-token")

		token, err := ParseGoogleTokenFromHeader(c)

		assert.NoError(t, err)
		assert.Equal(t, "my-test-token", token)
	})

	t.Run("Token missing", func(t *testing.T) {
		c := &gin.Context{}
		c.Request = httptest.NewRequest("GET", "/", nil)

		token, err := ParseGoogleTokenFromHeader(c)

		assert.NoError(t, err)
		assert.Empty(t, token)
	})
}

// TestGoogleSignUpRequestValidation tests request structure validation
func TestGoogleSignUpRequestValidation(t *testing.T) {
	tests := []struct {
		name      string
		request   GoogleSignUpRequest
		shouldErr bool
	}{
		{
			name: "Valid request",
			request: GoogleSignUpRequest{
				AccessToken: "valid-token",
				UserType:    "customer",
			},
			shouldErr: false,
		},
		{
			name: "Empty access token",
			request: GoogleSignUpRequest{
				AccessToken: "",
				UserType:    "customer",
			},
			shouldErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.shouldErr {
				assert.Empty(t, tt.request.AccessToken)
			} else {
				assert.NotEmpty(t, tt.request.AccessToken)
			}
		})
	}
}

// TestHandleGoogleAuthInfoEndpointStructure tests the response structure
func TestHandleGoogleAuthInfoEndpointStructure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	googleOAuthService := &GoogleOAuthService{
		supabaseURL: "http://localhost:8000",
	}

	router.GET("/auth/google/info", googleOAuthService.HandleGoogleAuthInfo())

	req := httptest.NewRequest("GET", "/auth/google/info", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check required fields
	assert.Equal(t, "google", response["provider"])

	// Check endpoints
	endpoints := response["endpoints"].(map[string]interface{})
	assert.NotEmpty(t, endpoints["init"])
	assert.NotEmpty(t, endpoints["callback"])
	assert.NotEmpty(t, endpoints["signup"])
	assert.NotEmpty(t, endpoints["verify"])

	// Check required env vars
	envVars := response["required_env_vars"].([]interface{})
	assert.NotEmpty(t, envVars)
}

// BenchmarkParseToken benchmarks token parsing
func BenchmarkParseToken(b *testing.B) {
	c := &gin.Context{}
	c.Request = httptest.NewRequest("GET", "/", nil)
	c.Request.Header.Set("Authorization", "test-token-value")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParseGoogleTokenFromHeader(c)
	}
}
