# Supabase REST API Migration Guide

This guide explains how to migrate from direct PostgreSQL connections to Supabase REST API in your Go backend.

## Table of Contents
1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [Migration Steps](#migration-steps)
4. [Usage Examples](#usage-examples)
5. [Common Operations](#common-operations)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Migrate to Supabase REST API?

- **IPv6 Compatibility**: Works on IPv6-only networks where direct PostgreSQL connections fail
- **No Port Restrictions**: Uses HTTPS (port 443) instead of PostgreSQL port 5432
- **Firewall Friendly**: Most corporate/educational networks allow HTTPS traffic
- **Built-in Features**: Automatic connection pooling, query optimization, and caching
- **Security**: Uses JWT-based authentication with row-level security (RLS)

### Architecture

```
Go Backend → Supabase REST API (HTTPS) → PostgreSQL Database
```

Instead of:
```
Go Backend → Direct PostgreSQL Connection (Port 5432) → PostgreSQL Database
```

---

## Setup & Configuration

### 1. Environment Variables

Your `.env` file already has the necessary variables:

```env
SUPABASE_URL=https://gxcqcwbdgucgrwanwccb.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 2. Initialize the Supabase Client

In your `main.go` or initialization code:

```go
import (
    "github.com/yakumwamba/lpg-delivery-system/pkg/database"
)

func main() {
    // Initialize Supabase client
    supabaseClient, err := database.ConnectSupabase()
    if err != nil {
        log.Fatalf("Failed to connect to Supabase: %v", err)
    }

    // Initialize services with Supabase client
    userService := user.NewServiceWithSupabase(supabaseClient)
    orderService := order.NewServiceWithSupabase(supabaseClient)
    // ... other services
}
```

---

## Migration Steps

### Step 1: Update Service Struct

**Before (PostgreSQL):**
```go
type Service struct {
    db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
    return &Service{db: db}
}
```

**After (Supabase REST API):**
```go
type Service struct {
    client *database.SupabaseClient
}

func NewServiceWithSupabase(client *database.SupabaseClient) *Service {
    return &Service{client: client}
}
```

### Step 2: Migrate CRUD Operations

#### CREATE Operations

**Before (PostgreSQL):**
```go
func (s *Service) CreateUser(user *User) (*User, error) {
    query := `
        INSERT INTO users (id, email, name, ...)
        VALUES ($1, $2, $3, ...)
        RETURNING id, created_at, updated_at
    `

    err := s.db.QueryRow(ctx, query, user.ID, user.Email, user.Name, ...).
        Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

    return user, err
}
```

**After (Supabase REST API):**
```go
func (s *Service) CreateUser(user *User) (*User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var result []User
    err := s.client.Insert(ctx, "users", []User{*user}, &result)
    if err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }

    return &result[0], nil
}
```

#### READ Operations

**Before (PostgreSQL):**
```go
func (s *Service) GetUserByEmail(email string) (*User, error) {
    query := `SELECT * FROM users WHERE email = $1`

    var user User
    err := s.db.QueryRow(ctx, query, email).Scan(&user.ID, &user.Email, ...)

    if err == pgx.ErrNoRows {
        return nil, ErrUserNotFound
    }

    return &user, err
}
```

**After (Supabase REST API):**
```go
func (s *Service) GetUserByEmail(email string) (*User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var user User
    err := s.client.From("users").
        Eq("email", email).
        Single().
        Execute(ctx, &user)

    if err != nil {
        if contains(err.Error(), "status 406") {
            return nil, ErrUserNotFound
        }
        return nil, err
    }

    return &user, nil
}
```

#### UPDATE Operations

**Before (PostgreSQL):**
```go
func (s *Service) UpdateUser(user *User) error {
    query := `UPDATE users SET phone_number = $1, updated_at = $2 WHERE id = $3`

    result, err := s.db.Exec(ctx, query, user.PhoneNumber, user.UpdatedAt, user.ID)
    if err != nil {
        return err
    }

    if result.RowsAffected() == 0 {
        return ErrUserNotFound
    }

    return nil
}
```

**After (Supabase REST API):**
```go
func (s *Service) UpdateUser(user *User) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    updateData := map[string]interface{}{
        "phone_number": user.PhoneNumber,
        "updated_at":   time.Now(),
    }

    var result []User
    err := database.UpdateByID(ctx, s.client, "users", user.ID, updateData, &result)
    if err != nil {
        return err
    }

    if len(result) == 0 {
        return ErrUserNotFound
    }

    return nil
}
```

#### DELETE Operations

**Before (PostgreSQL):**
```go
func (s *Service) DeleteUser(id uuid.UUID) error {
    query := `DELETE FROM users WHERE id = $1`

    result, err := s.db.Exec(ctx, query, id)
    if err != nil {
        return err
    }

    if result.RowsAffected() == 0 {
        return ErrUserNotFound
    }

    return nil
}
```

**After (Supabase REST API):**
```go
func (s *Service) DeleteUser(id uuid.UUID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    return database.DeleteByID(ctx, s.client, "users", id)
}
```

---

## Usage Examples

### Simple SELECT Query

```go
// Get all providers
var providers []User
err := client.From("users").
    Eq("user_type", "provider").
    Execute(ctx, &providers)
```

### SELECT with Multiple Filters

```go
// Get active orders for a specific provider
var orders []Order
err := client.From("orders").
    Eq("provider_id", providerID.String()).
    Eq("status", "active").
    Order("created_at", false).
    Execute(ctx, &orders)
```

### SELECT with Pagination

```go
// Get 10 users, skip first 20
var users []User
err := client.From("users").
    Order("created_at", false).
    Limit(10).
    Offset(20).
    Execute(ctx, &users)
```

### SELECT with LIKE (Pattern Matching)

```go
// Search users by name (case-insensitive)
var users []User
err := client.From("users").
    Ilike("name", "%john%").
    Execute(ctx, &users)
```

### SELECT with Date Range

```go
// Get orders from last 7 days
sevenDaysAgo := time.Now().AddDate(0, 0, -7)
var orders []Order
err := client.From("orders").
    Gte("created_at", sevenDaysAgo.Format(time.RFC3339)).
    Execute(ctx, &orders)
```

### INSERT Single Record

```go
user := User{
    ID:    uuid.New(),
    Email: "test@example.com",
    Name:  "Test User",
}

var result []User
err := client.Insert(ctx, "users", []User{user}, &result)
```

### INSERT Multiple Records (Bulk Insert)

```go
users := []User{
    {ID: uuid.New(), Email: "user1@example.com"},
    {ID: uuid.New(), Email: "user2@example.com"},
    {ID: uuid.New(), Email: "user3@example.com"},
}

var result []User
err := client.Insert(ctx, "users", users, &result)
```

### UPDATE with Custom Filters

```go
// Update all pending orders for a provider
filters := map[string]string{
    "provider_id": providerID.String(),
    "status":      "pending",
}

updateData := map[string]interface{}{
    "status":     "processing",
    "updated_at": time.Now(),
}

var result []Order
err := client.Update(ctx, "orders", filters, updateData, &result)
```

### COUNT Records

```go
// Count total providers
filters := map[string]string{
    "user_type": "provider",
}

count, err := client.Count(ctx, "users", filters)
```

---

## Common Operations

### 1. Get by ID

```go
var user User
err := database.GetByID(ctx, client, "users", userID, &user)
```

### 2. Get by Column

```go
var user User
err := database.GetByColumn(ctx, client, "users", "email", "test@example.com", &user)
```

### 3. Update by ID

```go
updateData := map[string]interface{}{
    "name": "New Name",
}

var result []User
err := database.UpdateByID(ctx, client, "users", userID, updateData, &result)
```

### 4. Delete by ID

```go
err := database.DeleteByID(ctx, client, "users", userID)
```

### 5. Check Existence

```go
filters := map[string]string{
    "email": "test@example.com",
}

exists, err := database.ExistsWhere(ctx, client, "users", filters)
```

---

## Error Handling

### Detecting "Not Found" Errors

```go
err := client.From("users").Eq("id", id.String()).Single().Execute(ctx, &user)
if err != nil {
    // Status 406 indicates no rows found
    if strings.Contains(err.Error(), "status 406") {
        return ErrUserNotFound
    }
    return fmt.Errorf("database error: %w", err)
}
```

### Handling Validation Errors

```go
err := client.Insert(ctx, "users", data, &result)
if err != nil {
    // Status 400 typically indicates validation errors
    if strings.Contains(err.Error(), "status 400") {
        return fmt.Errorf("validation error: %w", err)
    }
    return fmt.Errorf("insert failed: %w", err)
}
```

### Retry Logic for Transient Errors

```go
err := database.WithRetry(ctx, 3, func() error {
    return client.From("users").Eq("id", id.String()).Execute(ctx, &user)
})
```

---

## Best Practices

### 1. Use Context with Timeout

Always use context with timeout to prevent hanging requests:

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
```

### 2. Use Service Role Key for Backend Operations

For backend operations, use the service role key to bypass Row Level Security (RLS):

```go
config := database.SupabaseConfig{
    URL:            os.Getenv("SUPABASE_URL"),
    ServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
    UseServiceRole: true,
}
```

### 3. Batch Operations When Possible

Instead of multiple single inserts:
```go
// Bad
for _, user := range users {
    client.Insert(ctx, "users", []User{user}, nil)
}

// Good
client.Insert(ctx, "users", users, nil)
```

### 4. Use Query Builders for Complex Queries

```go
// Chain methods for readability
users, err := client.From("users").
    Eq("user_type", "provider").
    Is("latitude", "not.null").
    Is("longitude", "not.null").
    Order("rating", false).
    Limit(10).
    Execute(ctx, &users)
```

### 5. Index Fields Used in Filters

Make sure your Supabase database has indexes on frequently queried columns:
- `email` on users table
- `user_id`, `provider_id`, `status` on orders table
- `created_at` for time-based queries

---

## Troubleshooting

### Issue: "status 406" Error

**Problem**: No rows match the query when using `.Single()`

**Solution**: Handle as "not found" error:
```go
if strings.Contains(err.Error(), "status 406") {
    return ErrNotFound
}
```

### Issue: "status 400" Error

**Problem**: Invalid data or constraint violation

**Solution**: Check your data types and required fields match the database schema

### Issue: Empty Results Array

**Problem**: Query succeeded but returned no results

**Solution**: Check if data exists and filters are correct:
```go
if len(results) == 0 {
    return ErrNotFound
}
```

### Issue: Timeout Errors

**Problem**: Request takes too long

**Solution**:
1. Increase context timeout
2. Add database indexes
3. Reduce result set size with `Limit()`

### Issue: Authentication Errors

**Problem**: Invalid API key or permissions

**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
2. Check Row Level Security (RLS) policies in Supabase dashboard
3. Use service role key for backend operations

---

## Performance Considerations

### 1. Connection Pooling

The Supabase client automatically manages connections via HTTPS connection pooling.

### 2. Query Optimization

- Always use `.Limit()` for large result sets
- Use `.Select("column1,column2")` to fetch only needed columns
- Create indexes on frequently filtered columns

### 3. Caching Strategy

Consider implementing caching for frequently accessed data:

```go
type CachedUserService struct {
    service *UserService
    cache   map[uuid.UUID]*User
    mutex   sync.RWMutex
}

func (s *CachedUserService) GetUserByID(id uuid.UUID) (*User, error) {
    s.mutex.RLock()
    if user, ok := s.cache[id]; ok {
        s.mutex.RUnlock()
        return user, nil
    }
    s.mutex.RUnlock()

    user, err := s.service.GetUserByID(id)
    if err != nil {
        return nil, err
    }

    s.mutex.Lock()
    s.cache[id] = user
    s.mutex.Unlock()

    return user, nil
}
```

---

## Migration Checklist

- [ ] Set up Supabase environment variables in `.env`
- [ ] Create `SupabaseClient` initialization in `main.go`
- [ ] Update service constructors to accept `*database.SupabaseClient`
- [ ] Migrate all `INSERT` operations
- [ ] Migrate all `SELECT` operations
- [ ] Migrate all `UPDATE` operations
- [ ] Migrate all `DELETE` operations
- [ ] Update error handling for Supabase-specific errors
- [ ] Test all CRUD operations
- [ ] Update integration tests
- [ ] Remove or fallback PostgreSQL direct connection code
- [ ] Document changes in code comments

---

## Additional Resources

- [Supabase REST API Documentation](https://supabase.com/docs/guides/api)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)
- Example implementations in `/examples` directory:
  - `supabase_user_service_example.go`
  - `supabase_order_service_example.go`

---

## Support

If you encounter issues during migration:

1. Check the error message carefully (status codes provide hints)
2. Verify your Supabase configuration in the dashboard
3. Test queries manually using Supabase API documentation
4. Review the example implementations in `/examples` directory
