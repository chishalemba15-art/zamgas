# LPG Delivery System - Setup Guide

This guide explains how to use the consolidated `setup_data.go` script for database initialization with Supabase PostgreSQL.

## Prerequisites

1. **Environment Variables** - Ensure your `.env` file contains:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[PROJECT_ID].supabase.co:5432/postgres
   JWT_SECRET=your_secret_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   PAWAPAY_MERCHANT_ID=your_merchant_id
   PAWAPAY_API_KEY=your_api_key
   ```

2. **PostgreSQL/Supabase** - You must have a Supabase PostgreSQL database with the required tables created.

3. **Go** - Version 1.21 or higher

## Setup Data Script

All data loading and initialization is handled by a single consolidated script: `setup_data.go`

### Running the Script

```bash
cd scripts
go run setup_data.go
```

This launches an interactive menu with 4 options:

### Option 1: Complete Setup

Creates everything needed for development/testing:
- Tests database connection
- Creates 6 initial users (2 customers, 2 providers, 2 couriers)
- Generates 10 providers with cylinder pricing

**Users Created:**
- **Customers:** Chanda Mulenga, Mutale Banda
- **Providers:** Oryx Gas Zambia, Afrox Zambia
- **Couriers:** Themba Nyirenda, Zindaba Phiri

**Output:**
- User creation logs with ✅ success or ⏭️ already exists
- Provider generation logs
- Random locations in Lusaka, Zambia (within 50km radius)
- Pricing for 13 cylinder types (3KG, 5KG, 6KG, 9KG, 12KG, 13KG, 14KG, 15KG, 18KG, 19KG, 20KG, 45KG, 48KG)

### Option 2: Create Initial Users Only

Creates just the 6 sample users without providers.

**Useful for:**
- Testing auth services
- Manual provider creation

### Option 3: Generate Providers Only

Creates 10 random providers with cylinder pricing.

**Useful for:**
- Adding more test data
- Testing location-based queries

**Features:**
- Random locations within 50km of Lusaka center (using Haversine formula)
- Dynamic pricing (base 50-150 for refill, 1.3x for buy)
- UUID-based IDs
- Proper password hashing with bcrypt

### Option 4: Reset All Data

⚠️ **WARNING:** Deletes all data from the database!

**Requires confirmation** - Type `yes` to confirm deletion.

Deletes in proper order respecting foreign key constraints:
1. location_history
2. provider_images
3. inventory
4. payments
5. orders
6. cylinder_pricing
7. users

---

## Typical Workflow

### First Time Setup:

```bash
cd scripts

# Run setup_data.go and select Option 1 (Complete Setup)
go run setup_data.go
# Choose: 1
```

This single command will:
1. Test database connectivity
2. Create 6 initial users
3. Generate 10 providers with pricing
4. Display all created users with credentials

### Testing Backend:

```bash
# Terminal 1: Start the server
go run cmd/server/main.go

# Terminal 2: Run setup if not already done
cd scripts
go run setup_data.go
# Choose: 1
```

### Adding More Test Data:

```bash
cd scripts

# To add more providers without resetting
go run setup_data.go
# Choose: 3 (Generate Providers Only)
```

### Reset and Re-initialize:

```bash
cd scripts

# Run setup_data.go and select options in sequence
go run setup_data.go
# Choose: 4 (Reset All Data) - confirm with 'yes'

# Then run again and choose: 1 (Complete Setup)
go run setup_data.go
# Choose: 1
```

---

## Database Schema Requirements

The scripts expect the following tables to exist:

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  user_type VARCHAR(50),
  latitude FLOAT8,
  longitude FLOAT8,
  token TEXT,
  profile_image VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### cylinder_pricing
```sql
CREATE TABLE cylinder_pricing (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES users(id),
  cylinder_type VARCHAR(50),
  refill_price FLOAT8,
  buy_price FLOAT8
);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  courier_id UUID REFERENCES users(id),
  cylinder_type VARCHAR(50),
  quantity INT,
  total_price FLOAT8,
  status VARCHAR(50),
  delivery_address TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### locations
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  courier_id UUID REFERENCES users(id),
  latitude FLOAT8,
  longitude FLOAT8,
  street_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Troubleshooting

### Script fails with "DATABASE_URL not set"
**Solution:**
- Ensure `.env` file exists in the project root directory
- Verify `DATABASE_URL` is correctly set and not empty
- For Supabase: Use format `postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres`

### Script fails with "connection refused" or "dial error"
**Solution:**
- For Supabase: Verify your project is active and not sleeping
- Check connection string is correct and password is accurate
- Verify network connectivity (firewall, VPN, etc.)
- Try connecting with psql directly to isolate the issue

### "Table does not exist" errors
**Solution:**
- Ensure all database tables are created (users, orders, cylinder_pricing, locations, payments, inventory, provider_images, location_history)
- Check DATABASE_SETUP.md for complete schema
- Create tables using Supabase SQL Editor if not already created

### "Permission denied" errors
**Solution:**
- Verify the PostgreSQL user in your connection string has proper permissions
- For Supabase: Use the default `postgres` user or verify custom user permissions
- Check if RLS (Row Level Security) policies are interfering

### Script hangs or times out
**Solution:**
- Check database is responding: `psql -c "SELECT 1"`
- Verify connection pool isn't exhausted
- For Supabase: Check project logs for database issues
- Try increasing timeout values in code if needed

---

## Environment Setup

### Using Supabase:

1. Create a Supabase project
2. Get your database connection string
3. Set in `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
   ```
4. Ensure `sslmode=require` is configured (usually automatic)

### Local PostgreSQL:

```bash
# Connection string format:
DATABASE_URL=postgresql://username:password@localhost:5432/lpg_delivery_system
```

---

## Notes

- All scripts use environment variables for configuration
- Passwords are automatically hashed using bcrypt
- UUIDs are used for all ID fields
- Timestamps are automatically set to current time
- All database operations use parameterized queries to prevent SQL injection
