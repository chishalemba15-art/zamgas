package user

import (
	"time"

	"github.com/google/uuid"
)

type UserType string

const (
	UserTypeCustomer UserType = "customer"
	UserTypeProvider UserType = "provider"
	UserTypeCourier  UserType = "courier"
)

type User struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	Password         string     `json:"-" db:"password"`
	Email            string     `json:"email" db:"email"`
	Name             string     `json:"name" db:"name"`
	PhoneNumber      string     `json:"phone_number" db:"phone_number"`
	Rating           int        `json:"rating" db:"rating"`
	UserType         UserType   `json:"user_type" db:"user_type"`
	Latitude         *float64   `json:"latitude,omitempty" db:"latitude"`
	Longitude        *float64   `json:"longitude,omitempty" db:"longitude"`
	ExpoPushToken    string     `json:"expo_push_token" db:"expo_push_token"`
	PhoneVerified    bool       `json:"phone_verified" db:"phone_verified"`
	VerificationTime *time.Time `json:"verification_time,omitempty" db:"verification_time"`
	SupabaseUserID   *uuid.UUID `json:"supabase_user_id,omitempty" db:"supabase_user_id"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
	Token            string     `json:"token,omitempty"`
}

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type ProviderWithDistance struct {
	*User
	Distance float64 `json:"distance"`
}
