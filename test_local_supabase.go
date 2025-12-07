package main

// Simple test program to verify local Docker Supabase connection
// This demonstrates the proper way to connect to local Supabase

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("=== Testing Local Docker Supabase Connection ===\n")

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Could not load .env file: %v\n", err)
	}

	// Get DATABASE_URL from environment
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("❌ DATABASE_URL is not set in environment variables")
	}

	fmt.Printf("📝 Database URL: %s\n\n", databaseURL)

	// Attempt to connect
	fmt.Println("🔌 Connecting to database...")
	conn, err := pgx.Connect(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to the database: %v\n", err)
	}
	defer conn.Close(context.Background())

	fmt.Println("✅ Connected successfully!\n")

	// Test query: Get PostgreSQL version
	fmt.Println("🔍 Testing query: SELECT version()")
	var version string
	if err := conn.QueryRow(context.Background(), "SELECT version()").Scan(&version); err != nil {
		log.Fatalf("❌ Query failed: %v\n", err)
	}

	fmt.Printf("✅ PostgreSQL Version:\n   %s\n\n", version)

	// Test query: List tables
	fmt.Println("🔍 Testing query: List tables in database")
	rows, err := conn.Query(context.Background(), `
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
		ORDER BY table_name
	`)
	if err != nil {
		log.Fatalf("❌ Failed to list tables: %v\n", err)
	}
	defer rows.Close()

	fmt.Println("📊 Tables found:")
	tableCount := 0
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		fmt.Printf("   - %s\n", tableName)
		tableCount++
	}

	if tableCount == 0 {
		fmt.Println("   (No tables found - you may need to run migrations)")
	}
	fmt.Println()

	// Test query: Count users (if table exists)
	fmt.Println("🔍 Testing query: Count users")
	var userCount int
	err = conn.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		fmt.Printf("⚠️  Could not count users (table may not exist yet): %v\n", err)
	} else {
		fmt.Printf("✅ Found %d users in database\n", userCount)
	}
	fmt.Println()

	// Summary
	fmt.Println("=== Connection Test Summary ===")
	fmt.Println("✅ Database connection: SUCCESS")
	fmt.Println("✅ Basic queries: SUCCESS")
	fmt.Printf("✅ Tables found: %d\n", tableCount)
	fmt.Println("\n🎉 Your local Docker Supabase is properly configured!")
	fmt.Println("\nNext steps:")
	fmt.Println("1. Run database migrations to create tables")
	fmt.Println("2. Start your application: go run cmd/server/main.go")
	fmt.Println("3. Access Supabase Studio: http://localhost:54323")
}
