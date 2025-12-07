package main

// Simple command-line tool to test Supabase REST API connection
// Run with: go run test_supabase_connection.go

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

func main() {
	fmt.Println("=== Supabase REST API Connection Test ===")
	fmt.Println()

	// Load .env file
	envPath := filepath.Join(".", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
		log.Println("Attempting to use environment variables directly...")
	}

	// Check environment variables
	fmt.Println("1. Checking environment variables...")
	supabaseURL := os.Getenv("SUPABASE_URL")
	anonKey := os.Getenv("SUPABASE_ANON_KEY")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" {
		log.Fatal("❌ SUPABASE_URL is not set")
	}
	fmt.Printf("   ✓ SUPABASE_URL: %s\n", supabaseURL)

	if anonKey == "" && serviceRoleKey == "" {
		log.Fatal("❌ Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY is set")
	}

	if anonKey != "" {
		fmt.Printf("   ✓ SUPABASE_ANON_KEY: %s... (length: %d)\n", anonKey[:20], len(anonKey))
	}
	if serviceRoleKey != "" {
		fmt.Printf("   ✓ SUPABASE_SERVICE_ROLE_KEY: %s... (length: %d)\n", serviceRoleKey[:20], len(serviceRoleKey))
	}
	fmt.Println()

	// Initialize client
	fmt.Println("2. Initializing Supabase client...")
	config := database.SupabaseConfig{
		URL:            supabaseURL,
		AnonKey:        anonKey,
		ServiceRoleKey: serviceRoleKey,
		UseServiceRole: serviceRoleKey != "", // Use service role if available
	}

	client := database.NewSupabaseClient(config)
	fmt.Println("   ✓ Client initialized")
	fmt.Println()

	// Test connection
	fmt.Println("3. Testing connection to Supabase...")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Try to fetch a single user (just to test connectivity)
	var result []map[string]interface{}
	err := client.From("users").Limit(1).Execute(ctx, &result)

	if err != nil {
		fmt.Printf("   ❌ Connection test failed: %v\n", err)
		fmt.Println()
		fmt.Println("Troubleshooting steps:")
		fmt.Println("1. Verify your SUPABASE_URL is correct")
		fmt.Println("2. Check that your API keys are valid (not expired)")
		fmt.Println("3. Ensure the 'users' table exists in your Supabase database")
		fmt.Println("4. Check Row Level Security (RLS) policies in Supabase dashboard")
		fmt.Println("5. Try using SUPABASE_SERVICE_ROLE_KEY instead of ANON_KEY")
		os.Exit(1)
	}

	fmt.Println("   ✓ Connection successful!")
	fmt.Printf("   ✓ Found %d user(s) in database\n", len(result))
	fmt.Println()

	// Test health check
	fmt.Println("4. Running health check...")
	err = database.SupabaseHealthCheck(client)
	if err != nil {
		fmt.Printf("   ❌ Health check failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("   ✓ Health check passed")
	fmt.Println()

	// Count users by type
	fmt.Println("5. Counting users by type...")
	userTypes := []string{"customer", "provider", "courier"}
	totalUsers := 0

	for _, userType := range userTypes {
		filters := map[string]string{
			"user_type": userType,
		}
		count, err := client.Count(ctx, "users", filters)
		if err != nil {
			fmt.Printf("   ⚠️  Could not count %s users: %v\n", userType, err)
		} else {
			fmt.Printf("   ✓ %s users: %d\n", userType, count)
			totalUsers += count
		}
	}
	fmt.Printf("   ✓ Total users: %d\n", totalUsers)
	fmt.Println()

	// Count orders
	fmt.Println("6. Counting orders...")
	orderCount, err := client.Count(ctx, "orders", map[string]string{})
	if err != nil {
		fmt.Printf("   ⚠️  Could not count orders: %v\n", err)
	} else {
		fmt.Printf("   ✓ Total orders: %d\n", orderCount)
	}
	fmt.Println()

	// Test query performance
	fmt.Println("7. Testing query performance...")
	start := time.Now()
	var users []map[string]interface{}
	err = client.From("users").Limit(10).Execute(ctx, &users)
	elapsed := time.Since(start)

	if err != nil {
		fmt.Printf("   ⚠️  Performance test failed: %v\n", err)
	} else {
		fmt.Printf("   ✓ Fetched 10 users in %v\n", elapsed)
		if elapsed > 2*time.Second {
			fmt.Println("   ⚠️  Warning: Query took longer than expected. Check your network connection.")
		}
	}
	fmt.Println()

	// Summary
	fmt.Println("=== Test Summary ===")
	fmt.Println("✓ Environment variables configured")
	fmt.Println("✓ Supabase client initialized")
	fmt.Println("✓ Connection to Supabase successful")
	fmt.Println("✓ Health check passed")
	fmt.Println("✓ Database queries working")
	fmt.Println()
	fmt.Println("Your Supabase REST API connection is ready to use!")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("1. Review the migration guide: SUPABASE_REST_MIGRATION_GUIDE.md")
	fmt.Println("2. Check example implementations in /examples directory")
	fmt.Println("3. Start migrating your services to use Supabase client")
}
