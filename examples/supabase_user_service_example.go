package examples

// This file demonstrates how to migrate the user service from PostgreSQL to Supabase REST API

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

// Example User struct (matching your internal/user/model.go)
type User struct {
	ID               uuid.UUID  `json:"id"`
	Password         string     `json:"-"`
	Email            string     `json:"email"`
	Name             string     `json:"name"`
	PhoneNumber      string     `json:"phone_number"`
	Rating           int        `json:"rating"`
	UserType         string     `json:"user_type"`
	Latitude         *float64   `json:"latitude,omitempty"`
	Longitude        *float64   `json:"longitude,omitempty"`
	ExpoPushToken    string     `json:"expo_push_token"`
	PhoneVerified    bool       `json:"phone_verified"`
	VerificationTime *time.Time `json:"verification_time,omitempty"`
	SupabaseUserID   *uuid.UUID `json:"supabase_user_id,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// UserServiceSupabase demonstrates the Supabase implementation
type UserServiceSupabase struct {
	client *database.SupabaseClient
}

func NewUserServiceSupabase(client *database.SupabaseClient) *UserServiceSupabase {
	return &UserServiceSupabase{
		client: client,
	}
}

var ErrUserNotFound = errors.New("user not found")

// CreateUser - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) CreateUser(user *User) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}

	// Supabase REST API automatically handles the insert and returns the created record
	var result []User
	err := s.client.Insert(ctx, "users", []User{*user}, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("no user returned after insert")
	}

	return &result[0], nil
}

// GetUserByEmail - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) GetUserByEmail(email string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user User
	err := s.client.From("users").
		Eq("email", email).
		Single().
		Execute(ctx, &user)

	if err != nil {
		// Check if it's a "no rows" error
		if contains(err.Error(), "no rows") || contains(err.Error(), "status 406") {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// GetUserByID - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) GetUserByID(id uuid.UUID) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user User
	err := database.GetByID(ctx, s.client, "users", id, &user)

	if err != nil {
		if contains(err.Error(), "no rows") || contains(err.Error(), "status 406") {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return &user, nil
}

// GetUserByPhoneNumber - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) GetUserByPhoneNumber(phoneNumber string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user User
	err := s.client.From("users").
		Eq("phone_number", phoneNumber).
		Single().
		Execute(ctx, &user)

	if err != nil {
		if contains(err.Error(), "no rows") || contains(err.Error(), "status 406") {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by phone: %w", err)
	}

	return &user, nil
}

// UpdateUser - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) UpdateUser(user *User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user.UpdatedAt = time.Now()

	// Create update data map (only include fields you want to update)
	updateData := map[string]interface{}{
		"phone_number": user.PhoneNumber,
		"updated_at":   user.UpdatedAt,
	}

	var result []User
	err := database.UpdateByID(ctx, s.client, "users", user.ID, updateData, &result)
	if err != nil {
		return fmt.Errorf("error updating user: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("no user found with id: %s", user.ID.String())
	}

	return nil
}

// GetAllProviders - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) GetAllProviders() ([]*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var providers []User
	err := s.client.From("users").
		Eq("user_type", "provider").
		Execute(ctx, &providers)

	if err != nil {
		return nil, fmt.Errorf("failed to get providers: %w", err)
	}

	// Convert []User to []*User
	result := make([]*User, len(providers))
	for i := range providers {
		result[i] = &providers[i]
	}

	return result, nil
}

// UpdateUserLocation - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) UpdateUserLocation(userID uuid.UUID, latitude, longitude float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateData := map[string]interface{}{
		"latitude":   latitude,
		"longitude":  longitude,
		"updated_at": time.Now(),
	}

	var result []User
	err := database.UpdateByID(ctx, s.client, "users", userID, updateData, &result)
	if err != nil {
		return fmt.Errorf("failed to update user location: %w", err)
	}

	if len(result) == 0 {
		return ErrUserNotFound
	}

	return nil
}

// GetUserBySupabaseUID - Migrated from PostgreSQL to Supabase REST API
func (s *UserServiceSupabase) GetUserBySupabaseUID(supabaseUID string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user User
	err := s.client.From("users").
		Eq("supabase_user_id", supabaseUID).
		Single().
		Execute(ctx, &user)

	if err != nil {
		if contains(err.Error(), "no rows") || contains(err.Error(), "status 406") {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by Supabase UID: %w", err)
	}

	return &user, nil
}

// Additional helper examples

// GetUsersWithPagination - Example of pagination
func (s *UserServiceSupabase) GetUsersWithPagination(page, pageSize int) ([]*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	offset := (page - 1) * pageSize

	var users []User
	err := s.client.From("users").
		Order("created_at", false). // descending
		Limit(pageSize).
		Offset(offset).
		Execute(ctx, &users)

	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	result := make([]*User, len(users))
	for i := range users {
		result[i] = &users[i]
	}

	return result, nil
}

// SearchUsersByName - Example of LIKE query
func (s *UserServiceSupabase) SearchUsersByName(namePattern string) ([]*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var users []User
	err := s.client.From("users").
		Ilike("name", fmt.Sprintf("%%%s%%", namePattern)). // case-insensitive LIKE
		Execute(ctx, &users)

	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}

	result := make([]*User, len(users))
	for i := range users {
		result[i] = &users[i]
	}

	return result, nil
}

// GetProvidersNearLocation - Example of filtering with multiple conditions
func (s *UserServiceSupabase) GetProvidersNearLocation(userType string, hasLocation bool) ([]*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	qb := s.client.From("users").Eq("user_type", userType)

	if hasLocation {
		qb = qb.Is("latitude", "not.null").Is("longitude", "not.null")
	}

	var users []User
	err := qb.Execute(ctx, &users)

	if err != nil {
		return nil, fmt.Errorf("failed to get providers: %w", err)
	}

	result := make([]*User, len(users))
	for i := range users {
		result[i] = &users[i]
	}

	return result, nil
}

// CountUsersByType - Example of counting records
func (s *UserServiceSupabase) CountUsersByType(userType string) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filters := map[string]string{
		"user_type": userType,
	}

	count, err := s.client.Count(ctx, "users", filters)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	return count, nil
}

// BulkCreateUsers - Example of bulk insert
func (s *UserServiceSupabase) BulkCreateUsers(users []User) ([]User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	now := time.Now()
	for i := range users {
		if users[i].ID == uuid.Nil {
			users[i].ID = uuid.New()
		}
		users[i].CreatedAt = now
		users[i].UpdatedAt = now
	}

	var result []User
	err := s.client.Insert(ctx, "users", users, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to bulk create users: %w", err)
	}

	return result, nil
}

// Helper function
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
		len(s) > len(substr)*2))
}
