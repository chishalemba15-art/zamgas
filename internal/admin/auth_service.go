package admin

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrAdminNotFound      = errors.New("admin not found")
	ErrAdminInactive      = errors.New("admin account is inactive")
)

type AdminUser struct {
	ID          uuid.UUID
	Email       string
	Password    string // bcrypt hashed
	Name        string
	AdminRole   string
	Permissions []string
	IsActive    bool
	LastLogin   *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type AdminAuthService struct {
	db        *sql.DB
	jwtSecret []byte
}

func NewAdminAuthService(db *sql.DB, jwtSecret string) *AdminAuthService {
	return &AdminAuthService{
		db:        db,
		jwtSecret: []byte(jwtSecret),
	}
}

// GetDB returns the database connection for admin user management operations
func (s *AdminAuthService) GetDB() *sql.DB {
	return s.db
}

// AdminSignIn authenticates an admin user
func (s *AdminAuthService) AdminSignIn(email, password string) (*AdminUser, string, error) {
	admin, err := s.GetAdminByEmail(email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", fmt.Errorf("failed to retrieve admin: %w", err)
	}

	if !admin.IsActive {
		return nil, "", ErrAdminInactive
	}

	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(password))
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.GenerateAdminToken(admin.ID, admin.AdminRole)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	// Update last login
	now := time.Now()
	_, err = s.db.ExecContext(context.Background(),
		`UPDATE admin_users SET last_login = $1 WHERE id = $2`,
		now, admin.ID,
	)
	if err != nil {
		// Log error but don't fail the login
		fmt.Printf("Warning: Failed to update last login for admin %s: %v\n", admin.ID, err)
	}

	admin.LastLogin = &now
	return admin, token, nil
}

// GenerateAdminToken creates a JWT token for an admin
func (s *AdminAuthService) GenerateAdminToken(adminID uuid.UUID, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"admin_id": adminID.String(),
		"role":     role,
		"type":     "admin",                                   // Distinguish admin tokens from user tokens
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	return token.SignedString(s.jwtSecret)
}

// ValidateAdminToken validates a JWT token and returns admin ID and role
func (s *AdminAuthService) ValidateAdminToken(tokenString string) (uuid.UUID, string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return uuid.UUID{}, "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Check if this is an admin token
		tokenType, _ := claims["type"].(string)
		if tokenType != "admin" {
			return uuid.UUID{}, "", errors.New("not an admin token")
		}

		adminIDStr, ok := claims["admin_id"].(string)
		if !ok {
			return uuid.UUID{}, "", fmt.Errorf("invalid admin_id in token")
		}

		role, ok := claims["role"].(string)
		if !ok {
			return uuid.UUID{}, "", fmt.Errorf("invalid role in token")
		}

		adminID, err := uuid.Parse(adminIDStr)
		if err != nil {
			return uuid.UUID{}, "", fmt.Errorf("invalid admin_id format in token")
		}

		return adminID, role, nil
	}

	return uuid.UUID{}, "", fmt.Errorf("invalid token")
}

// GetAdminByEmail retrieves an admin by email
func (s *AdminAuthService) GetAdminByEmail(email string) (*AdminUser, error) {
	admin := &AdminUser{}
	var lastLogin sql.NullTime
	var permissionsStr string

	query := `
		SELECT id, email, password, name, admin_role, permissions::text, is_active, last_login, created_at, updated_at
		FROM admin_users
		WHERE email = $1
	`

	err := s.db.QueryRowContext(context.Background(), query, email).Scan(
		&admin.ID,
		&admin.Email,
		&admin.Password,
		&admin.Name,
		&admin.AdminRole,
		&permissionsStr,
		&admin.IsActive,
		&lastLogin,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdminNotFound
		}
		return nil, fmt.Errorf("failed to query admin: %w", err)
	}

	// Parse permissions from PostgreSQL array string format
	admin.Permissions = parsePostgresArray(permissionsStr)

	if lastLogin.Valid {
		admin.LastLogin = &lastLogin.Time
	}

	return admin, nil
}

// GetAdminByID retrieves an admin by ID
func (s *AdminAuthService) GetAdminByID(adminID uuid.UUID) (*AdminUser, error) {
	admin := &AdminUser{}
	var lastLogin sql.NullTime
	var permissionsStr string

	query := `
		SELECT id, email, password, name, admin_role, permissions::text, is_active, last_login, created_at, updated_at
		FROM admin_users
		WHERE id = $1
	`

	err := s.db.QueryRowContext(context.Background(), query, adminID).Scan(
		&admin.ID,
		&admin.Email,
		&admin.Password,
		&admin.Name,
		&admin.AdminRole,
		&permissionsStr,
		&admin.IsActive,
		&lastLogin,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdminNotFound
		}
		return nil, fmt.Errorf("failed to query admin: %w", err)
	}

	// Parse permissions from PostgreSQL array string format
	admin.Permissions = parsePostgresArray(permissionsStr)

	if lastLogin.Valid {
		admin.LastLogin = &lastLogin.Time
	}

	return admin, nil
}

// LogAdminActivity logs an admin action for audit trail
func (s *AdminAuthService) LogAdminActivity(adminID uuid.UUID, action, resourceType string, resourceID *uuid.UUID, details map[string]interface{}, ipAddress string) error {
	query := `
		INSERT INTO admin_activity_log (admin_id, action, resource_type, resource_id, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	var resourceIDVal interface{}
	if resourceID != nil {
		resourceIDVal = *resourceID
	}

	_, err := s.db.ExecContext(context.Background(), query,
		adminID, action, resourceType, resourceIDVal, details, ipAddress,
	)

	return err
}

// parsePostgresArray parses a PostgreSQL array string format into a []string
// Example: "{*}" becomes ["*"], "{read:dashboard,write:users}" becomes ["read:dashboard", "write:users"]
func parsePostgresArray(s string) []string {
	if s == "" {
		return []string{}
	}

	// PostgreSQL arrays are formatted as "{element1,element2,...}"
	// Remove the curly braces
	if len(s) >= 2 && s[0] == '{' && s[len(s)-1] == '}' {
		s = s[1 : len(s)-1]
	}

	if s == "" {
		return []string{}
	}

	// Split by comma
	elements := strings.Split(s, ",")
	result := make([]string, 0, len(elements))

	for _, elem := range elements {
		trimmed := strings.TrimSpace(elem)
		if trimmed != "" {
			// Remove quotes if present
			if len(trimmed) >= 2 && trimmed[0] == '"' && trimmed[len(trimmed)-1] == '"' {
				trimmed = trimmed[1 : len(trimmed)-1]
			}
			result = append(result, trimmed)
		}
	}

	return result
}
