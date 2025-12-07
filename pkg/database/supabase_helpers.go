package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
)

// ConnectSupabase creates a new Supabase client from environment variables
func ConnectSupabase() (*SupabaseClient, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL environment variable is not set")
	}

	anonKey := os.Getenv("SUPABASE_ANON_KEY")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if anonKey == "" && serviceRoleKey == "" {
		return nil, fmt.Errorf("neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set")
	}

	// Use service role key by default for backend operations (bypasses RLS)
	useServiceRole := serviceRoleKey != ""

	config := SupabaseConfig{
		URL:            supabaseURL,
		AnonKey:        anonKey,
		ServiceRoleKey: serviceRoleKey,
		UseServiceRole: useServiceRole,
	}

	client := NewSupabaseClient(config)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Try a simple query to verify connection
	var result []map[string]interface{}
	err := client.From("users").Limit(1).Execute(ctx, &result)
	if err != nil {
		log.Printf("Warning: Failed to test Supabase connection: %v", err)
		// Don't fail completely - the client might still work for other operations
	} else {
		log.Println("✓ Connected to Supabase REST API")
	}

	return client, nil
}

// Helper functions for common database patterns

// InsertOne is a convenience function for inserting a single record
func InsertOne(ctx context.Context, client *SupabaseClient, table string, data interface{}, result interface{}) error {
	// Wrap single item in array for Supabase API
	var response []interface{}
	if result != nil {
		response = make([]interface{}, 1)
		response[0] = result
	}

	err := client.Insert(ctx, table, []interface{}{data}, &response)
	if err != nil {
		return err
	}

	// If result was provided, it's already been populated by the response
	return nil
}

// UpdateByID updates a record by its ID
func UpdateByID(ctx context.Context, client *SupabaseClient, table string, id uuid.UUID, data interface{}, result interface{}) error {
	filters := map[string]string{
		"id": id.String(),
	}
	return client.Update(ctx, table, filters, data, result)
}

// DeleteByID deletes a record by its ID
func DeleteByID(ctx context.Context, client *SupabaseClient, table string, id uuid.UUID) error {
	filters := map[string]string{
		"id": id.String(),
	}
	return client.Delete(ctx, table, filters)
}

// GetByID retrieves a single record by its ID
func GetByID(ctx context.Context, client *SupabaseClient, table string, id uuid.UUID, result interface{}) error {
	return client.From(table).
		Eq("id", id.String()).
		Single().
		Execute(ctx, result)
}

// GetByColumn retrieves a single record by a specific column value
func GetByColumn(ctx context.Context, client *SupabaseClient, table string, column string, value string, result interface{}) error {
	return client.From(table).
		Eq(column, value).
		Single().
		Execute(ctx, result)
}

// GetAll retrieves all records from a table with optional ordering and pagination
func GetAll(ctx context.Context, client *SupabaseClient, table string, orderBy string, ascending bool, limit int, offset int, result interface{}) error {
	qb := client.From(table)

	if orderBy != "" {
		qb = qb.Order(orderBy, ascending)
	}

	if limit > 0 {
		qb = qb.Limit(limit)
	}

	if offset > 0 {
		qb = qb.Offset(offset)
	}

	return qb.Execute(ctx, result)
}

// ExistsWhere checks if any record exists matching the conditions
func ExistsWhere(ctx context.Context, client *SupabaseClient, table string, filters map[string]string) (bool, error) {
	count, err := client.Count(ctx, table, filters)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// BulkInsert inserts multiple records at once
func BulkInsert(ctx context.Context, client *SupabaseClient, table string, data interface{}, result interface{}) error {
	return client.Insert(ctx, table, data, result)
}

// SupabaseHealthCheck verifies that the Supabase connection is working
func SupabaseHealthCheck(client *SupabaseClient) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result []map[string]interface{}
	err := client.From("users").Limit(1).Execute(ctx, &result)
	if err != nil {
		return fmt.Errorf("supabase health check failed: %w", err)
	}

	return nil
}

// WithRetry executes a function with retry logic
func WithRetry(ctx context.Context, maxRetries int, fn func() error) error {
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		err := fn()
		if err == nil {
			return nil
		}

		lastErr = err
		if attempt < maxRetries {
			waitTime := time.Duration(attempt) * time.Second
			log.Printf("Attempt %d/%d failed, retrying in %v: %v", attempt, maxRetries, waitTime, err)

			select {
			case <-time.After(waitTime):
				continue
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}

	return fmt.Errorf("failed after %d attempts: %w", maxRetries, lastErr)
}
