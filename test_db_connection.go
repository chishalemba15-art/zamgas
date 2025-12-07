package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get DATABASE_URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	fmt.Println("Attempting to connect to PostgreSQL...")
	fmt.Println("Database URL:", databaseURL)

	// Connect to PostgreSQL
	pool, err := database.ConnectPostgres(databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer pool.Close()

	fmt.Println("✅ Successfully connected to PostgreSQL!")
	fmt.Println("Connection pool stats:")
	stats := pool.Stat()
	fmt.Printf("- Total connections: %d\n", stats.TotalConns())
	fmt.Printf("- Idle connections: %d\n", stats.IdleConns())
	fmt.Printf("- Max connections: %d\n", stats.MaxConns())
}
