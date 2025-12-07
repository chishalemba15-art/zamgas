package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/internal/user"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db          *sql.DB
	userService *user.Service
	jwtSecret   []byte
}

func NewService(db *sql.DB, userService *user.Service, jwtSecret string) *Service {
	return &Service{
		db:          db,
		userService: userService,
		jwtSecret:   []byte(jwtSecret),
	}
}

func (s *Service) SignIn(email, password string) (*user.User, string, error) {
	retrievedUser, err := s.userService.GetUserByEmail(email)
	if err != nil {
		return nil, "", fmt.Errorf("failed to retrieve user from database: %w", err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(retrievedUser.Password), []byte(password))
	if err != nil {
		return nil, "", fmt.Errorf("invalid password")
	}

	token, err := s.GenerateToken(retrievedUser.ID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	return retrievedUser, token, nil
}

func (s *Service) GenerateToken(userID uuid.UUID) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * 24 * 60).Unix(), // 60 days (~2 months)
	})

	return token.SignedString(s.jwtSecret)
}

func (s *Service) ValidateToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return uuid.UUID{}, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			return uuid.UUID{}, fmt.Errorf("invalid user_id in token")
		}
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return uuid.UUID{}, fmt.Errorf("invalid user_id format in token")
		}
		return userID, nil
	}

	return uuid.UUID{}, fmt.Errorf("invalid token")
}

func (s *Service) SignOut(userID uuid.UUID) error {
	// Optional: Delete sessions from PostgreSQL if you're tracking them
	_, err := s.db.ExecContext(context.Background(), "DELETE FROM sessions WHERE user_id = $1", userID.String())
	if err != nil {
		// Log error but don't fail - JWT is stateless and doesn't require server-side cleanup
		fmt.Printf("Warning: Failed to delete session for user %s: %v\n", userID, err)
	}
	// Always return success for stateless JWT
	return nil
}

func (s *Service) SignUp(email string, password string, userType user.UserType, expoToken string, name string, phone_number string) (*user.User, error) {
	// Check if user already exists
	existingUser, err := s.userService.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", email)
	}

	// If the error is not "user not found", return the error
	if err != nil && !errors.Is(err, user.ErrUserNotFound) {
		return nil, fmt.Errorf("error checking for existing user: %w", err)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user in MongoDB
	newUser := &user.User{
		Email:       email,
		Password:    string(hashedPassword),
		UserType:    userType,
		Token:       expoToken,
		Name:        name,
		PhoneNumber: phone_number,
	}

	createdUser, err := s.userService.CreateUser(newUser)
	if err != nil {
		return nil, fmt.Errorf("failed to create user in database: %w", err)
	}

	return createdUser, nil
}

func (s *Service) GetUserByPhone(phone string) (*user.User, error) {
	var u *user.User
	u, err := s.userService.GetUserByPhoneNumber(phone)
	if err != nil {
		if err.Error() == "no rows in result set" || errors.Is(err, user.ErrUserNotFound) {
			return nil, user.ErrUserNotFound
		}
		return nil, err
	}
	return u, nil
}
