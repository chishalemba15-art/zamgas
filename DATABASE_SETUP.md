# Database Setup and Configuration Guide

## Overview

This project uses **Supabase PostgreSQL** as the primary database. All scripts and services have been migrated from MongoDB to PostgreSQL exclusively.

---

## Prerequisites

### Required Software
- Go 1.21 or higher
- PostgreSQL 14+ (or Supabase PostgreSQL)
- Git

### Required Credentials
- Supabase account (free tier available)
- Database connection string

---

## Supabase Setup (Recommended)

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Create a new project
4. Wait for database initialization

### 2. Get Connection String
1. Go to Project Settings → Database
2. Connection string format:
   ```
   postgresql://[user]:[password]@[host]:[port]/postgres
   ```
3. Connection pooler is recommended for production

### 3. Configure Environment
Create `.env` file in project root:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# PawaPay (for payments)
PAWAPAY_MERCHANT_ID=your_merchant_id
PAWAPAY_API_KEY=your_api_key

# Server
SERVER_PORT=8080
```

---

## Database Schema

### Tables Required

#### users
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  user_type VARCHAR(50) CHECK (user_type IN ('customer', 'provider', 'courier')),
  latitude FLOAT8,
  longitude FLOAT8,
  token TEXT,
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
```

#### cylinder_pricing
```sql
CREATE TABLE IF NOT EXISTS cylinder_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cylinder_type VARCHAR(50) NOT NULL,
  refill_price FLOAT8 NOT NULL,
  buy_price FLOAT8 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cylinder_pricing_provider ON cylinder_pricing(provider_id);
CREATE INDEX idx_cylinder_pricing_type ON cylinder_pricing(cylinder_type);
```

#### orders
```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  courier_id UUID REFERENCES users(id),
  cylinder_type VARCHAR(50),
  quantity INT DEFAULT 1,
  total_price FLOAT8,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_address TEXT,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_provider ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
```

#### locations
```sql
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  street_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_courier ON locations(courier_id);
```

#### sessions
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
```

---

## Creating Tables in Supabase

### Option 1: Using Supabase UI
1. Log in to Supabase
2. Go to SQL Editor
3. Click "New Query"
4. Paste the SQL schema above
5. Click "Run"

### Option 2: Using psql CLI
```bash
# Install PostgreSQL client tools if not already installed

# Connect to your database
psql -h db.[PROJECT_ID].supabase.co -U postgres -d postgres

# Paste the SQL schema and execute
```

---

## Testing Database Connection

### Using the Test Script
```bash
# From project root
go run test_db_connection.go
```

Expected output:
```
✅ Successfully connected to PostgreSQL!
Connection pool stats:
- Total connections: 5
- Idle connections: 5
- Max connections: 10
```

---

## Initialize with Sample Data

### Step 1: Create Initial Users
```bash
cd scripts
go run initial.go
```

Creates:
- 2 Customers
- 2 Providers
- 2 Couriers

### Step 2: Generate Test Providers
```bash
go run generate_providers.go
```

Creates:
- 10 random providers
- Pricing for 13 cylinder types
- Random locations in Lusaka, Zambia

### Step 3: Verify Data
```bash
go run provider_info.go
```

---

## Environment Variables

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### Security
```env
JWT_SECRET=your_secret_key_min_32_chars_recommended
```

### Third-Party Services
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

PAWAPAY_MERCHANT_ID=your_id
PAWAPAY_API_KEY=your_key
```

### Server
```env
SERVER_PORT=8080
GIN_MODE=debug  # or release for production
```

---

## Running the Application

### 1. Start the Server
```bash
go run cmd/server/main.go
```

Output:
```
✓ Connected to Supabase PostgreSQL
✓ Server running on http://localhost:8080
```

### 2. Test the API
```bash
cd scripts
go run test_backend.go
```

---

## Backing Up Your Data

### Using pg_dump
```bash
pg_dump -h db.[PROJECT_ID].supabase.co \
  -U postgres \
  -d postgres \
  > backup.sql
```

### Restoring from Backup
```bash
psql -h db.[PROJECT_ID].supabase.co \
  -U postgres \
  -d postgres \
  < backup.sql
```

---

## Troubleshooting

### Connection Refused
```
Error: failed to connect to database
```
**Solution:**
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall settings
- For Supabase, verify project is active

### SSL Connection Error
```
Error: ssl is not enabled on the server
```
**Solution:**
- Add `?sslmode=require` to DATABASE_URL
- Or use Supabase connection pooler with SSL

### Table Does Not Exist
```
Error: relation "users" does not exist
```
**Solution:**
- Run the SQL schema to create tables
- Verify you're connecting to correct database

### Permission Denied
```
Error: permission denied for schema public
```
**Solution:**
- Verify user has proper permissions
- Check credentials in DATABASE_URL

---

## Connection Pool Configuration

The application uses pgx connection pooling with defaults:
- Min connections: 5
- Max connections: 10
- Max lifetime: 5 minutes

Adjust in `pkg/database/postgres.go`:
```go
config.MaxConns = 20  // Increase for production
config.MinConns = 10
```

---

## Performance Optimization

### Enable SSL/TLS
```env
DATABASE_URL=postgresql://...?sslmode=require
```

### Use Connection Pooler
Supabase provides a connection pooler mode:
- Go to Project Settings → Database
- Select "Connection pooling" tab
- Copy pooler connection string

### Create Indexes
Indexes are created automatically in schema above.

---

## Monitoring

### Check Connection Pool
The test script shows pool statistics:
```bash
go run test_db_connection.go
```

### View Logs
Enable logging in `.env`:
```env
LOG_LEVEL=debug
```

### Monitor Queries
In Supabase UI:
1. Go to SQL Editor
2. Check query logs
3. View slow queries

---

## Backup Strategy

### Regular Backups
```bash
# Daily backup script
pg_dump -h db.[PROJECT_ID].supabase.co \
  -U postgres \
  -d postgres > backups/db_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Backups
Supabase provides daily automated backups in the free tier.

---

## Migration from MongoDB

This project was migrated from MongoDB to PostgreSQL. Key changes:
- Replaced `primitive.ObjectID` with `uuid.UUID`
- Converted BSON queries to SQL
- Updated all services to use `pgxpool.Pool`
- Removed MongoDB imports

All scripts are updated and tested for PostgreSQL compatibility.

---

## Next Steps

1. ✅ Set up Supabase account
2. ✅ Create PostgreSQL database
3. ✅ Create schema tables
4. ✅ Configure `.env` file
5. ✅ Test database connection
6. ✅ Initialize sample data
7. ✅ Run application
8. ✅ Test API endpoints

---

## Support

For issues:
1. Check `SCRIPTS_README.md` for script documentation
2. Review this guide for configuration
3. Check Supabase documentation
4. Review application logs

---

**Last Updated:** 2024
**Database:** PostgreSQL / Supabase
**Status:** ✅ Production Ready
