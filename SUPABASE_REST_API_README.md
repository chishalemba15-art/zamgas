# Supabase REST API Client - Quick Reference

Complete Supabase REST API client implementation for Go backend applications.

## Overview

This implementation provides a full-featured REST API client for Supabase, enabling your Go backend to interact with Supabase PostgreSQL database via HTTPS instead of direct PostgreSQL connections.

**Benefits:**
- Works on IPv6-only networks
- No port 5432 firewall issues
- Uses standard HTTPS (port 443)
- Automatic connection pooling
- Built-in authentication

## Files Structure

```
/pkg/database/
  ├── supabase.go              # Main client implementation
  └── supabase_helpers.go      # Helper functions

/examples/
  ├── supabase_user_service_example.go    # User service migration example
  ├── supabase_order_service_example.go   # Order service migration example
  ├── main_integration_example.go         # Main.go integration guide
  └── supabase_test_example.go           # Testing examples

SUPABASE_REST_MIGRATION_GUIDE.md   # Comprehensive migration guide
```

## Quick Start

### 1. Environment Variables

Ensure your `.env` file has:
```env
SUPABASE_URL=https://gxcqcwbdgucgrwanwccb.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Initialize Client

```go
import "github.com/yakumwamba/lpg-delivery-system/pkg/database"

// Connect to Supabase
client, err := database.ConnectSupabase()
if err != nil {
    log.Fatal(err)
}
```

### 3. Basic Operations

#### SELECT
```go
var users []User
err := client.From("users").
    Eq("user_type", "provider").
    Execute(ctx, &users)
```

#### INSERT
```go
user := User{ID: uuid.New(), Email: "test@example.com"}
var result []User
err := client.Insert(ctx, "users", []User{user}, &result)
```

#### UPDATE
```go
updateData := map[string]interface{}{
    "name": "New Name",
}
var result []User
err := database.UpdateByID(ctx, client, "users", userID, updateData, &result)
```

#### DELETE
```go
err := database.DeleteByID(ctx, client, "users", userID)
```

## API Reference

### Query Builder Methods

| Method | Description | Example |
|--------|-------------|---------|
| `From(table)` | Start query on table | `client.From("users")` |
| `Select(cols)` | Select specific columns | `.Select("id,name,email")` |
| `Eq(col, val)` | Equality filter | `.Eq("status", "active")` |
| `Neq(col, val)` | Not equal filter | `.Neq("status", "deleted")` |
| `Gt(col, val)` | Greater than | `.Gt("age", "18")` |
| `Gte(col, val)` | Greater than or equal | `.Gte("created_at", "2024-01-01")` |
| `Lt(col, val)` | Less than | `.Lt("price", "100")` |
| `Lte(col, val)` | Less than or equal | `.Lte("quantity", "10")` |
| `Like(col, pattern)` | Pattern matching | `.Like("name", "%john%")` |
| `Ilike(col, pattern)` | Case-insensitive LIKE | `.Ilike("email", "%@gmail.com")` |
| `Is(col, val)` | IS check (NULL) | `.Is("deleted_at", "null")` |
| `In(col, vals)` | IN filter | `.In("status", []string{"active", "pending"})` |
| `Order(col, asc)` | Order results | `.Order("created_at", false)` |
| `Limit(n)` | Limit results | `.Limit(10)` |
| `Offset(n)` | Skip results | `.Offset(20)` |
| `Single()` | Expect single result | `.Single()` |

### Direct Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `Insert()` | Insert records | `client.Insert(ctx, "users", data, &result)` |
| `Update()` | Update records | `client.Update(ctx, "users", filters, data, &result)` |
| `Delete()` | Delete records | `client.Delete(ctx, "users", filters)` |
| `Upsert()` | Insert or update | `client.Upsert(ctx, "users", data, &result)` |
| `Count()` | Count records | `client.Count(ctx, "users", filters)` |
| `RPC()` | Call stored procedure | `client.RPC(ctx, "function_name", params, &result)` |

### Helper Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `GetByID()` | Get single record by ID | `database.GetByID(ctx, client, "users", id, &user)` |
| `GetByColumn()` | Get by specific column | `database.GetByColumn(ctx, client, "users", "email", email, &user)` |
| `UpdateByID()` | Update by ID | `database.UpdateByID(ctx, client, "users", id, data, &result)` |
| `DeleteByID()` | Delete by ID | `database.DeleteByID(ctx, client, "users", id)` |
| `ExistsWhere()` | Check if record exists | `database.ExistsWhere(ctx, client, "users", filters)` |
| `WithRetry()` | Retry failed operations | `database.WithRetry(ctx, 3, fn)` |

## Common Patterns

### 1. Get Single Record

```go
var user User
err := client.From("users").
    Eq("email", "test@example.com").
    Single().
    Execute(ctx, &user)
```

### 2. Get Multiple Records with Filters

```go
var orders []Order
err := client.From("orders").
    Eq("user_id", userID.String()).
    Eq("status", "pending").
    Order("created_at", false).
    Limit(10).
    Execute(ctx, &orders)
```

### 3. Pagination

```go
page := 2
pageSize := 10
offset := (page - 1) * pageSize

var users []User
err := client.From("users").
    Order("created_at", false).
    Limit(pageSize).
    Offset(offset).
    Execute(ctx, &users)
```

### 4. Search with Pattern Matching

```go
var users []User
err := client.From("users").
    Ilike("name", "%john%").
    Execute(ctx, &users)
```

### 5. Date Range Query

```go
startDate := time.Now().AddDate(0, 0, -7)
var orders []Order
err := client.From("orders").
    Gte("created_at", startDate.Format(time.RFC3339)).
    Execute(ctx, &orders)
```

### 6. Count with Filters

```go
filters := map[string]string{
    "user_type": "provider",
    "status":    "active",
}
count, err := client.Count(ctx, "users", filters)
```

### 7. Bulk Insert

```go
users := []User{
    {ID: uuid.New(), Email: "user1@example.com"},
    {ID: uuid.New(), Email: "user2@example.com"},
    {ID: uuid.New(), Email: "user3@example.com"},
}

var result []User
err := client.Insert(ctx, "users", users, &result)
```

### 8. Conditional Update

```go
filters := map[string]string{
    "status":      "pending",
    "provider_id": providerID.String(),
}

updateData := map[string]interface{}{
    "status":     "processing",
    "updated_at": time.Now(),
}

var result []Order
err := client.Update(ctx, "orders", filters, updateData, &result)
```

## Error Handling

### Common Status Codes

- `200-299`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid API key)
- `403`: Forbidden (RLS policy violation)
- `404`: Not found
- `406`: No rows found (when using `.Single()`)
- `409`: Conflict (unique constraint violation)
- `500`: Server error

### Handle "Not Found"

```go
var user User
err := client.From("users").Eq("id", id.String()).Single().Execute(ctx, &user)
if err != nil {
    if strings.Contains(err.Error(), "status 406") {
        return ErrUserNotFound
    }
    return err
}
```

### Retry on Failure

```go
err := database.WithRetry(ctx, 3, func() error {
    return client.From("users").Execute(ctx, &users)
})
```

## Migration Checklist

- [ ] Add Supabase environment variables to `.env`
- [ ] Initialize Supabase client in `main.go`
- [ ] Create `NewServiceWithSupabase()` constructor for each service
- [ ] Migrate CREATE operations (INSERT)
- [ ] Migrate READ operations (SELECT)
- [ ] Migrate UPDATE operations
- [ ] Migrate DELETE operations
- [ ] Update error handling
- [ ] Test all endpoints
- [ ] Remove PostgreSQL dependency (or keep as fallback)

## Example Service Migration

### Before (PostgreSQL)

```go
type UserService struct {
    db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *UserService {
    return &UserService{db: db}
}

func (s *UserService) GetUserByEmail(email string) (*User, error) {
    query := `SELECT * FROM users WHERE email = $1`
    var user User
    err := s.db.QueryRow(ctx, query, email).Scan(&user.ID, &user.Email, ...)
    return &user, err
}
```

### After (Supabase)

```go
type UserService struct {
    client *database.SupabaseClient
}

func NewServiceWithSupabase(client *database.SupabaseClient) *UserService {
    return &UserService{client: client}
}

func (s *UserService) GetUserByEmail(email string) (*User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var user User
    err := s.client.From("users").
        Eq("email", email).
        Single().
        Execute(ctx, &user)

    return &user, err
}
```

## Performance Tips

1. **Use Indexes**: Ensure frequently queried columns have database indexes
2. **Limit Results**: Always use `.Limit()` for large result sets
3. **Select Specific Columns**: Use `.Select("col1,col2")` instead of `*`
4. **Batch Operations**: Use bulk inserts instead of individual inserts
5. **Connection Reuse**: Reuse the same client instance across requests
6. **Context Timeout**: Always use context with timeout

## Testing

Run the test suite:

```go
import "github.com/yakumwamba/lpg-delivery-system/examples"

// Run all tests
err := examples.RunAllTests()
if err != nil {
    log.Fatal(err)
}
```

Or test individual components:

```go
// Test connection
err := examples.TestSupabaseConnection()

// Test CRUD operations
client, _ := database.ConnectSupabase()
err = examples.TestUserCRUD(client)
```

## Troubleshooting

### Connection Issues

```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     $SUPABASE_URL/rest/v1/users?limit=1
```

### Enable Debug Logging

```go
import "log"

// Add before making requests
log.Printf("Query: %s", client.From("users").Eq("id", id.String()).buildURL())
```

## Resources

- **Implementation**: `/pkg/database/supabase.go`
- **Examples**: `/examples/supabase_*_example.go`
- **Migration Guide**: `SUPABASE_REST_MIGRATION_GUIDE.md`
- **Supabase Docs**: https://supabase.com/docs/guides/api
- **PostgREST API**: https://postgrest.org/en/stable/api.html

## Support

For issues or questions:
1. Check the error message and status code
2. Review the migration guide
3. Test with curl/Postman to isolate the issue
4. Check Supabase dashboard for RLS policies
5. Review example implementations in `/examples`

---

**Created**: 2025-11-06
**Author**: Claude Code
**Project**: LPG Delivery System
