package examples

// This file demonstrates how to test the Supabase REST API client

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

// TestSupabaseConnection tests basic connectivity to Supabase
func TestSupabaseConnection() error {
	client, err := database.ConnectSupabase()
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}

	err = database.SupabaseHealthCheck(client)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}

	log.Println("✓ Supabase connection test passed")
	return nil
}

// TestUserCRUD tests complete CRUD operations for users
func TestUserCRUD(client *database.SupabaseClient) error {
	ctx := context.Background()

	// Test data
	testUser := User{
		ID:            uuid.New(),
		Email:         fmt.Sprintf("test-%s@example.com", uuid.New().String()[:8]),
		Name:          "Test User",
		PhoneNumber:   "+260971234567",
		UserType:      "customer",
		Rating:        5,
		PhoneVerified: false,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// 1. CREATE Test
	log.Println("Testing CREATE operation...")
	var createResult []User
	err := client.Insert(ctx, "users", []User{testUser}, &createResult)
	if err != nil {
		return fmt.Errorf("CREATE failed: %w", err)
	}
	if len(createResult) == 0 {
		return fmt.Errorf("CREATE failed: no result returned")
	}
	log.Printf("✓ CREATE passed - Created user with ID: %s", createResult[0].ID)

	// 2. READ Test (by ID)
	log.Println("Testing READ operation (by ID)...")
	var readUser User
	err = database.GetByID(ctx, client, "users", testUser.ID, &readUser)
	if err != nil {
		return fmt.Errorf("READ failed: %w", err)
	}
	if readUser.Email != testUser.Email {
		return fmt.Errorf("READ failed: email mismatch")
	}
	log.Printf("✓ READ passed - Found user: %s", readUser.Email)

	// 3. READ Test (by email)
	log.Println("Testing READ operation (by email)...")
	var readUserByEmail User
	err = client.From("users").
		Eq("email", testUser.Email).
		Single().
		Execute(ctx, &readUserByEmail)
	if err != nil {
		return fmt.Errorf("READ by email failed: %w", err)
	}
	log.Printf("✓ READ by email passed")

	// 4. UPDATE Test
	log.Println("Testing UPDATE operation...")
	updateData := map[string]interface{}{
		"name":       "Updated Test User",
		"rating":     4,
		"updated_at": time.Now(),
	}
	var updateResult []User
	err = database.UpdateByID(ctx, client, "users", testUser.ID, updateData, &updateResult)
	if err != nil {
		return fmt.Errorf("UPDATE failed: %w", err)
	}
	if len(updateResult) == 0 {
		return fmt.Errorf("UPDATE failed: no result returned")
	}
	if updateResult[0].Name != "Updated Test User" {
		return fmt.Errorf("UPDATE failed: name not updated")
	}
	log.Printf("✓ UPDATE passed - Updated user name to: %s", updateResult[0].Name)

	// 5. LIST/QUERY Test
	log.Println("Testing LIST/QUERY operation...")
	var users []User
	err = client.From("users").
		Eq("user_type", "customer").
		Limit(5).
		Execute(ctx, &users)
	if err != nil {
		return fmt.Errorf("LIST failed: %w", err)
	}
	log.Printf("✓ LIST passed - Found %d customers", len(users))

	// 6. COUNT Test
	log.Println("Testing COUNT operation...")
	count, err := client.Count(ctx, "users", map[string]string{"user_type": "customer"})
	if err != nil {
		return fmt.Errorf("COUNT failed: %w", err)
	}
	log.Printf("✓ COUNT passed - Total customers: %d", count)

	// 7. DELETE Test
	log.Println("Testing DELETE operation...")
	err = database.DeleteByID(ctx, client, "users", testUser.ID)
	if err != nil {
		return fmt.Errorf("DELETE failed: %w", err)
	}
	log.Printf("✓ DELETE passed - Deleted user with ID: %s", testUser.ID)

	// 8. Verify deletion
	log.Println("Verifying deletion...")
	var deletedUser User
	err = database.GetByID(ctx, client, "users", testUser.ID, &deletedUser)
	if err == nil {
		return fmt.Errorf("DELETE verification failed: user still exists")
	}
	log.Println("✓ DELETE verification passed - User no longer exists")

	log.Println("✓✓✓ All CRUD tests passed!")
	return nil
}

// TestOrderOperations tests order-specific operations
func TestOrderOperations(client *database.SupabaseClient) error {
	ctx := context.Background()

	// Create test user first
	testUser := User{
		ID:        uuid.New(),
		Email:     fmt.Sprintf("test-%s@example.com", uuid.New().String()[:8]),
		Name:      "Test User",
		UserType:  "customer",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	var userResult []User
	err := client.Insert(ctx, "users", []User{testUser}, &userResult)
	if err != nil {
		return fmt.Errorf("failed to create test user: %w", err)
	}
	defer database.DeleteByID(ctx, client, "users", testUser.ID)

	// Create test order
	testOrder := Order{
		ID:           uuid.New(),
		UserID:       testUser.ID,
		Status:       "pending",
		CylinderType: "6kg",
		Quantity:     2,
		PricePerUnit: 100.0,
		TotalPrice:   200.0,
		DeliveryFee:  10.0,
		GrandTotal:   210.0,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Test order creation
	log.Println("Testing order creation...")
	var orderResult []Order
	err = client.Insert(ctx, "orders", []Order{testOrder}, &orderResult)
	if err != nil {
		return fmt.Errorf("order creation failed: %w", err)
	}
	log.Printf("✓ Order created with ID: %s", orderResult[0].ID)

	// Test getting user's orders
	log.Println("Testing get user orders...")
	var userOrders []Order
	err = client.From("orders").
		Eq("user_id", testUser.ID.String()).
		Execute(ctx, &userOrders)
	if err != nil {
		return fmt.Errorf("get user orders failed: %w", err)
	}
	if len(userOrders) == 0 {
		return fmt.Errorf("expected at least 1 order, got 0")
	}
	log.Printf("✓ Found %d orders for user", len(userOrders))

	// Test order status update
	log.Println("Testing order status update...")
	updateData := map[string]interface{}{
		"status":     "accepted",
		"updated_at": time.Now(),
	}
	var updateResult []Order
	err = database.UpdateByID(ctx, client, "orders", testOrder.ID, updateData, &updateResult)
	if err != nil {
		return fmt.Errorf("order update failed: %w", err)
	}
	if updateResult[0].Status != "accepted" {
		return fmt.Errorf("status not updated correctly")
	}
	log.Println("✓ Order status updated successfully")

	// Test filtering by status
	log.Println("Testing filter by status...")
	var pendingOrders []Order
	err = client.From("orders").
		Eq("status", "accepted").
		Execute(ctx, &pendingOrders)
	if err != nil {
		return fmt.Errorf("filter by status failed: %w", err)
	}
	log.Printf("✓ Found %d accepted orders", len(pendingOrders))

	// Cleanup
	database.DeleteByID(ctx, client, "orders", testOrder.ID)

	log.Println("✓✓✓ All order tests passed!")
	return nil
}

// TestPagination tests pagination functionality
func TestPagination(client *database.SupabaseClient) error {
	ctx := context.Background()

	log.Println("Testing pagination...")

	// Get first page
	var page1 []User
	err := client.From("users").
		Order("created_at", false).
		Limit(10).
		Offset(0).
		Execute(ctx, &page1)
	if err != nil {
		return fmt.Errorf("page 1 failed: %w", err)
	}
	log.Printf("✓ Page 1: %d users", len(page1))

	// Get second page
	var page2 []User
	err = client.From("users").
		Order("created_at", false).
		Limit(10).
		Offset(10).
		Execute(ctx, &page2)
	if err != nil {
		return fmt.Errorf("page 2 failed: %w", err)
	}
	log.Printf("✓ Page 2: %d users", len(page2))

	// Verify pages are different
	if len(page1) > 0 && len(page2) > 0 {
		if page1[0].ID == page2[0].ID {
			return fmt.Errorf("pagination failed: pages contain same data")
		}
	}

	log.Println("✓ Pagination test passed")
	return nil
}

// TestComplexQueries tests advanced query features
func TestComplexQueries(client *database.SupabaseClient) error {
	ctx := context.Background()

	log.Println("Testing complex queries...")

	// Test: Multiple filters
	var providers []User
	err := client.From("users").
		Eq("user_type", "provider").
		Is("latitude", "not.null").
		Is("longitude", "not.null").
		Limit(5).
		Execute(ctx, &providers)
	if err != nil {
		return fmt.Errorf("multiple filters failed: %w", err)
	}
	log.Printf("✓ Found %d providers with location", len(providers))

	// Test: Date range query
	sevenDaysAgo := time.Now().AddDate(0, 0, -7).Format(time.RFC3339)
	var recentOrders []Order
	err = client.From("orders").
		Gte("created_at", sevenDaysAgo).
		Limit(10).
		Execute(ctx, &recentOrders)
	if err != nil {
		return fmt.Errorf("date range query failed: %w", err)
	}
	log.Printf("✓ Found %d recent orders", len(recentOrders))

	// Test: Pattern matching
	var searchResults []User
	err = client.From("users").
		Ilike("name", "%test%").
		Limit(5).
		Execute(ctx, &searchResults)
	if err != nil {
		return fmt.Errorf("pattern matching failed: %w", err)
	}
	log.Printf("✓ Found %d users matching 'test'", len(searchResults))

	log.Println("✓ Complex queries test passed")
	return nil
}

// TestBulkOperations tests bulk insert and update
func TestBulkOperations(client *database.SupabaseClient) error {
	ctx := context.Background()

	log.Println("Testing bulk operations...")

	// Create multiple test users
	testUsers := []User{
		{
			ID:        uuid.New(),
			Email:     fmt.Sprintf("bulk1-%s@example.com", uuid.New().String()[:8]),
			Name:      "Bulk User 1",
			UserType:  "customer",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        uuid.New(),
			Email:     fmt.Sprintf("bulk2-%s@example.com", uuid.New().String()[:8]),
			Name:      "Bulk User 2",
			UserType:  "customer",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        uuid.New(),
			Email:     fmt.Sprintf("bulk3-%s@example.com", uuid.New().String()[:8]),
			Name:      "Bulk User 3",
			UserType:  "customer",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	// Bulk insert
	var result []User
	err := client.Insert(ctx, "users", testUsers, &result)
	if err != nil {
		return fmt.Errorf("bulk insert failed: %w", err)
	}
	if len(result) != 3 {
		return fmt.Errorf("expected 3 users, got %d", len(result))
	}
	log.Printf("✓ Bulk insert successful: created %d users", len(result))

	// Cleanup
	for _, user := range testUsers {
		database.DeleteByID(ctx, client, "users", user.ID)
	}

	log.Println("✓ Bulk operations test passed")
	return nil
}

// RunAllTests runs all Supabase tests
func RunAllTests() error {
	log.Println("=== Starting Supabase REST API Tests ===")

	// Connect to Supabase
	client, err := database.ConnectSupabase()
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	// Run tests
	tests := []struct {
		name string
		fn   func(*database.SupabaseClient) error
	}{
		{"User CRUD", TestUserCRUD},
		{"Order Operations", TestOrderOperations},
		{"Pagination", TestPagination},
		{"Complex Queries", TestComplexQueries},
		{"Bulk Operations", TestBulkOperations},
	}

	for _, test := range tests {
		log.Printf("\n--- Running: %s ---", test.name)
		err := test.fn(client)
		if err != nil {
			return fmt.Errorf("%s failed: %w", test.name, err)
		}
		log.Printf("✓✓✓ %s completed successfully\n", test.name)
	}

	log.Println("\n=== All Tests Passed! ===")
	return nil
}
