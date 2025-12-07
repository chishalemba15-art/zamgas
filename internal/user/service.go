package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{
		db: db,
	}
}

// ErrUserNotFound is returned when a user is not found in the database
var ErrUserNotFound = errors.New("user not found")

func (s *Service) CreateUser(user *User) (*User, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}

	// PostgreSQL supports RETURNING
	query := `
		INSERT INTO users (
			id, password, email, name, phone_number, rating, user_type,
			latitude, longitude, expo_push_token, phone_verified,
			verification_time, supabase_user_id, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err := s.db.ExecContext(ctx, query,
		user.ID.String(), user.Password, user.Email, user.Name, user.PhoneNumber,
		user.Rating, user.UserType, user.Latitude, user.Longitude,
		user.ExpoPushToken, user.PhoneVerified, user.VerificationTime,
		toNullString(user.SupabaseUserID), user.CreatedAt, user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (s *Service) GetUserByEmail(email string) (*User, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user User
	var idStr string
	var supabaseUID sql.NullString
	var latitude sql.NullFloat64
	var longitude sql.NullFloat64
	var expoPushToken sql.NullString

	query := `
		SELECT id, password, email, name, phone_number, rating, user_type,
			latitude, longitude, expo_push_token, phone_verified,
			verification_time, supabase_user_id, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	err := s.db.QueryRowContext(ctx, query, email).Scan(
		&idStr, &user.Password, &user.Email, &user.Name, &user.PhoneNumber,
		&user.Rating, &user.UserType, &latitude, &longitude,
		&expoPushToken, &user.PhoneVerified, &user.VerificationTime,
		&supabaseUID, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	user.ID, _ = uuid.Parse(idStr)

	// Handle nullable latitude
	if latitude.Valid {
		user.Latitude = &latitude.Float64
	}

	// Handle nullable longitude
	if longitude.Valid {
		user.Longitude = &longitude.Float64
	}

	// Handle nullable expo_push_token
	if expoPushToken.Valid {
		user.ExpoPushToken = expoPushToken.String
	}

	if supabaseUID.Valid {
		parsed, _ := uuid.Parse(supabaseUID.String)
		user.SupabaseUserID = &parsed
	}

	log.Println(user.Name)
	return &user, nil
}

func (s *Service) GetUserByID(id uuid.UUID) (*User, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user User
	var idStr string
	var supabaseUID sql.NullString
	var latitude sql.NullFloat64
	var longitude sql.NullFloat64
	var expoPushToken sql.NullString

	query := `
		SELECT id, password, email, name, phone_number, rating, user_type,
			latitude, longitude, expo_push_token, phone_verified,
			verification_time, supabase_user_id, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	err := s.db.QueryRowContext(ctx, query, id.String()).Scan(
		&idStr, &user.Password, &user.Email, &user.Name, &user.PhoneNumber,
		&user.Rating, &user.UserType, &latitude, &longitude,
		&expoPushToken, &user.PhoneVerified, &user.VerificationTime,
		&supabaseUID, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	user.ID, _ = uuid.Parse(idStr)

	// Handle nullable latitude
	if latitude.Valid {
		user.Latitude = &latitude.Float64
	}

	// Handle nullable longitude
	if longitude.Valid {
		user.Longitude = &longitude.Float64
	}

	// Handle nullable expo_push_token
	if expoPushToken.Valid {
		user.ExpoPushToken = expoPushToken.String
	}

	if supabaseUID.Valid {
		parsed, _ := uuid.Parse(supabaseUID.String)
		user.SupabaseUserID = &parsed
	}

	return &user, nil
}

func (s *Service) GetUserBySupabaseUID(supabaseUID string) (*User, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	supabaseUUID, err := uuid.Parse(supabaseUID)
	if err != nil {
		return nil, fmt.Errorf("invalid supabase UUID: %w", err)
	}

	var user User
	var idStr string
	var supabaseUIDStr sql.NullString

	query := `
		SELECT id, password, email, name, phone_number, rating, user_type,
			latitude, longitude, expo_push_token, phone_verified,
			verification_time, supabase_user_id, created_at, updated_at
		FROM users
		WHERE supabase_user_id = $1
	`

	err = s.db.QueryRowContext(ctx, query, supabaseUUID.String()).Scan(
		&idStr, &user.Password, &user.Email, &user.Name, &user.PhoneNumber,
		&user.Rating, &user.UserType, &user.Latitude, &user.Longitude,
		&user.ExpoPushToken, &user.PhoneVerified, &user.VerificationTime,
		&supabaseUIDStr, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by Supabase UID: %w", err)
	}

	user.ID, _ = uuid.Parse(idStr)
	if supabaseUIDStr.Valid {
		parsed, _ := uuid.Parse(supabaseUIDStr.String)
		user.SupabaseUserID = &parsed
	}

	return &user, nil
}

func (s *Service) UpdateUser(user *User) error {
	if s.db == nil {
		return fmt.Errorf("database connection unavailable")
	}

	log.Printf("[PhoneUpdate] Starting update process")
	log.Printf("[PhoneUpdate] User ID: %s", user.ID.String())
	log.Printf("[PhoneUpdate] Requested new phone: %s", user.PhoneNumber)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Validate phone number format before updating
	if !validatePhoneNumber(user.PhoneNumber) {
		log.Printf("[PhoneUpdate] Validation failed for phone: %s", user.PhoneNumber)
		return fmt.Errorf("invalid phone number format")
	}

	// Normalize phone number format
	normalizedPhone, err := normalizePhoneNumber(user.PhoneNumber)
	if err != nil {
		log.Printf("[PhoneUpdate] Normalization failed for phone: %s, error: %v", user.PhoneNumber, err)
		return fmt.Errorf("phone number normalization error: %w", err)
	}

	log.Printf("[PhoneUpdate] Phone number transformation:")
	log.Printf("  → Original: %s", user.PhoneNumber)
	log.Printf("  → Normalized: %s", normalizedPhone)

	// Set the normalized phone number
	user.PhoneNumber = normalizedPhone
	user.UpdatedAt = time.Now()

	query := `
		UPDATE users
		SET phone_number = $1, updated_at = $2
		WHERE id = $3
	`

	result, err := s.db.ExecContext(ctx, query, user.PhoneNumber, user.UpdatedAt, user.ID.String())
	if err != nil {
		log.Printf("[PhoneUpdate] Database update failed: %v", err)
		return fmt.Errorf("error updating user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PhoneUpdate] Failed to get rows affected: %v", err)
		return fmt.Errorf("error getting rows affected: %w", err)
	}
	log.Printf("[PhoneUpdate] Update results:")
	log.Printf("  → Rows affected: %d", rowsAffected)

	if rowsAffected == 0 {
		log.Printf("[PhoneUpdate] No document found with ID: %s", user.ID.String())
		return fmt.Errorf("no user found with id: %s", user.ID.String())
	}

	log.Printf("[PhoneUpdate] Successfully completed update for user ID: %s", user.ID.String())
	return nil
}

// Helper function to validate Zambian phone numbers
func validatePhoneNumber(phone string) bool {
	// Remove all spaces and special characters
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, "+", "")

	// Check if number starts with Zambian country code (260)
	if !strings.HasPrefix(phone, "260") {
		return false
	}

	// Check if the total length is correct (12 digits including country code)
	if len(phone) != 12 {
		return false
	}

	// Check if all characters are digits
	for _, char := range phone {
		if !unicode.IsDigit(char) {
			return false
		}
	}

	return true
}

// Helper function to normalize phone numbers
func normalizePhoneNumber(phone string) (string, error) {
	// Remove all spaces and special characters
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")

	// If number starts with 0, replace with country code
	if strings.HasPrefix(phone, "0") {
		phone = "260" + phone[1:]
	}

	// If number doesn't have +, add it
	if !strings.HasPrefix(phone, "+") {
		phone = "+" + phone
	}

	return phone, nil
}

func (s *Service) GetAllProviders() ([]*User, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	ctx := context.Background()

	query := `
		SELECT id, password, email, name, phone_number, rating, user_type,
			latitude, longitude, expo_push_token, phone_verified,
			verification_time, supabase_user_id, created_at, updated_at
		FROM users
		WHERE user_type = $1
	`

	fmt.Printf("🔍 Executing GetAllProviders query with user_type='%s'\n", UserTypeProvider)

	rows, err := s.db.QueryContext(ctx, query, UserTypeProvider)
	if err != nil {
		fmt.Printf("❌ Database query failed: %v\n", err)
		return nil, fmt.Errorf("failed to get providers: %w", err)
	}
	defer rows.Close()

	var providers []*User
	rowCount := 0
	for rows.Next() {
		rowCount++
		var provider User
		var idStr string
		var supabaseUID sql.NullString
		var latitude sql.NullFloat64
		var longitude sql.NullFloat64
		var expoPushToken sql.NullString

		err := rows.Scan(
			&idStr, &provider.Password, &provider.Email, &provider.Name,
			&provider.PhoneNumber, &provider.Rating, &provider.UserType,
			&latitude, &longitude, &expoPushToken,
			&provider.PhoneVerified, &provider.VerificationTime, &supabaseUID,
			&provider.CreatedAt, &provider.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("❌ Failed to scan provider (row %d): %v\n", rowCount, err)
			fmt.Printf("   ID: %s, Email: %v\n", idStr, provider.Email)
			return nil, fmt.Errorf("failed to scan provider row %d: %w", rowCount, err)
		}

		provider.ID, _ = uuid.Parse(idStr)

		// Handle nullable latitude
		if latitude.Valid {
			provider.Latitude = &latitude.Float64
		}

		// Handle nullable longitude
		if longitude.Valid {
			provider.Longitude = &longitude.Float64
		}

		// Handle nullable expo_push_token
		if expoPushToken.Valid {
			provider.ExpoPushToken = expoPushToken.String
		}

		if supabaseUID.Valid {
			parsed, _ := uuid.Parse(supabaseUID.String)
			provider.SupabaseUserID = &parsed
		}

		fmt.Printf("✅ Loaded provider %d: %s (%s)\n", rowCount, provider.Name, provider.Email)
		providers = append(providers, &provider)
	}

	if err := rows.Err(); err != nil {
		fmt.Printf("❌ Error iterating provider rows: %v\n", err)
		return nil, fmt.Errorf("error iterating providers: %w", err)
	}

	fmt.Printf("✅ Successfully loaded %d providers from database\n", len(providers))
	return providers, nil
}

// UpdateUserLocation updates the location of a user in the database
func (s *Service) UpdateUserLocation(userID uuid.UUID, location Location) error {
	if s.db == nil {
		return fmt.Errorf("database connection unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
		UPDATE users
		SET latitude = $1, longitude = $2, updated_at = $3
		WHERE id = $4
	`

	result, err := s.db.ExecContext(ctx, query, location.Latitude, location.Longitude, time.Now(), userID.String())
	if err != nil {
		return fmt.Errorf("failed to update user location: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

// In user/service.go
func validateZambianPhone(phone string) bool {
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "+", "")

	if len(phone) != 12 || !strings.HasPrefix(phone, "260") {
		return false
	}

	firstDigit := phone[3]
	if firstDigit != '7' && firstDigit != '9' && firstDigit != '8' {
		return false
	}

	return true
}

func normalizeZambianPhone(phone string) (string, error) {
	phone = strings.ReplaceAll(phone, " ", "")

	if strings.HasPrefix(phone, "0") {
		phone = "260" + phone[1:]
	}

	if !strings.HasPrefix(phone, "+") {
		phone = "+" + phone
	}

	if !validateZambianPhone(strings.TrimPrefix(phone, "+")) {
		return "", fmt.Errorf("invalid phone number")
	}

	return phone, nil
}

func (s *Service) GetUserByPhoneNumber(phoneNumber string) (*User, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database connection unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	normalizedPhone, err := normalizePhoneNumber(phoneNumber)
	if err != nil {
		return nil, fmt.Errorf("phone number normalization error: %w", err)
	}

	var user User
	var idStr string
	var supabaseUID sql.NullString

	query := `
		SELECT id, password, email, name, phone_number, rating, user_type,
			latitude, longitude, expo_push_token, phone_verified,
			verification_time, supabase_user_id, created_at, updated_at
		FROM users
		WHERE phone_number = $1
	`

	err = s.db.QueryRowContext(ctx, query, normalizedPhone).Scan(
		&idStr, &user.Password, &user.Email, &user.Name, &user.PhoneNumber,
		&user.Rating, &user.UserType, &user.Latitude, &user.Longitude,
		&user.ExpoPushToken, &user.PhoneVerified, &user.VerificationTime,
		&supabaseUID, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by phone: %w", err)
	}

	user.ID, _ = uuid.Parse(idStr)
	if supabaseUID.Valid {
		parsed, _ := uuid.Parse(supabaseUID.String)
		user.SupabaseUserID = &parsed
	}

	return &user, nil
}

// Helper function to convert UUID pointer to sql.NullString
func toNullString(id *uuid.UUID) sql.NullString {
	if id == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: id.String(), Valid: true}
}
