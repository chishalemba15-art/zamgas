# Supabase Migration Guide

## Steps to Complete Migration

### 1. Run SQL Migration on Supabase

Go to your Supabase Dashboard → SQL Editor and run the `supabase_migration.sql` file.

### 2. Get Database Password

1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the database password
3. Update the `.env` file with your database password in the `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://postgres.gxcqcwbdgucgrwanwccb:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### 3. Migration Status

#### Completed:
- ✅ User model and service (UUID-based)
- ✅ Order model (UUID-based)
- ✅ Database package (PostgreSQL client)
- ✅ Go dependencies updated (pgx/v5, godotenv)
- ✅ Environment configuration (.env file)

#### In Progress:
- 🔄 Order service (being migrated)
- 🔄 Payment model and service
- 🔄 Provider service
- 🔄 Inventory service
- 🔄 Location service
- 🔄 Auth service
- 🔄 Main.go

#### Pending:
- ⏳ Expo app API configuration
- ⏳ Expo app environment variables
- ⏳ End-to-end testing

### 4. Key Changes

#### ID Type Change
- **Before**: `primitive.ObjectID` (MongoDB)
- **After**: `uuid.UUID` (PostgreSQL)

#### Database Operations
- **Before**: MongoDB collections, BSON filters
- **After**: PostgreSQL tables, SQL queries

#### Connection String
- **Before**: MongoDB connection string
- **After**: PostgreSQL connection string via Supabase

### 5. Testing After Migration

```bash
# 1. Ensure database migration is run in Supabase
# 2. Update .env with correct DATABASE_URL
# 3. Build and run the server
go mod tidy
go run cmd/server/main.go

# 4. Test endpoints
curl http://localhost:8080/providers
```

### 6. Known Issues

- All ObjectID references need to be converted to UUID
- Some service methods may need adjustment for PostgreSQL syntax
- Authentication flow remains JWT-based (custom auth, not Supabase Auth)

### 7. Future Enhancements

- Implement Supabase Auth (optional)
- Add Google OAuth via Supabase
- Implement real-time subscriptions using Supabase Realtime
- Add Row Level Security (RLS) policies for better security
