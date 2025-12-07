# How to Run setup_data.go on Your Local Machine

## The Fix Applied ✅

Your `setup_data.go` script has been updated to automatically load the `.env` file. This means:
- ✅ No need to manually set environment variables
- ✅ Just run the script and it loads your DATABASE_URL automatically
- ✅ Works from the `scripts/` directory

---

## Prerequisites

Make sure you have:
1. **Go 1.21+** installed
2. **.env file** in your project root with `DATABASE_URL` set
3. **Supabase database** with tables created

---

## Running the Setup Script

### From Your Computer's Terminal

**Step 1: Navigate to the project**
```bash
cd /Users/yakumwamba/CodeWithYaku/School\ Project\ -\ CS/lpg_delivery/server
```

**Step 2: Run the setup script**
```bash
go run scripts/setup_data.go
```

**Step 3: Choose an option**
```
════════════════════════════════════════
  LPG Delivery System - Data Setup
════════════════════════════════════════

Options:
1) Complete Setup (init users + generate providers)
2) Create Initial Users Only (6 users)
3) Generate Providers Only (10 providers + pricing)
4) Reset All Data (DELETE ALL - destructive)

Enter choice (1-4): 1
```

---

## What Each Option Does

### Option 1: Complete Setup ✅ RECOMMENDED
```
Creates everything for development:
- 6 initial users (2 customers, 2 providers, 2 couriers)
- 10 random providers with pricing
- All passwords hashed with bcrypt
- Random locations in Lusaka, Zambia

Time: ~8-12 seconds
```

**Result in Supabase:**
- 6 new users in `users` table
- 130 new pricing records in `cylinder_pricing` table (10 providers × 13 cylinder types)

### Option 2: Users Only
```
Creates just the 6 sample users without providers.
Useful for testing auth without all the data.

Time: ~2-3 seconds
```

### Option 3: Providers Only
```
Creates 10 random providers with pricing.
Useful for adding more test data after initial setup.

Time: ~3-5 seconds
```

### Option 4: Reset All
```
⚠️ WARNING: Deletes all data!

Deletes:
- All users
- All cylinder_pricing
- All orders
- All payments
- All inventory
- All provider_images
- All location_history

Requires confirmation (type 'yes')
Time: ~2-3 seconds
```

---

## Expected Output

When you select option 1, you'll see:

```
✅ Connected to Supabase PostgreSQL

🔄 Starting complete setup...

📝 Creating initial users...
✅ Created user: Chanda Mulenga (customer)
✅ Created user: Mutale Banda (customer)
✅ Created user: Oryx Gas Zambia (provider)
✅ Created user: Afrox Zambia (provider)
✅ Created user: Themba Nyirenda (courier)
✅ Created user: Zindaba Phiri (courier)

📝 Generating providers with pricing...
✅ Generated provider 1: Gas Provider 1
✅ Generated provider 2: Gas Provider 2
... (8 more providers)

✅ Setup complete!

User Credentials:
  Customers: chanda@example.com, mutale@example.com (password: password123)
  Providers: oryx@example.com, afrox@example.com (password: password123)
  Couriers: themba@example.com, zindaba@example.com (password: password123)
```

---

## Verifying Data in Supabase

After running the script, check your data:

1. **Go to Supabase Console:**
   https://app.supabase.com

2. **Select Your Project:**
   `gxcqcwbdgucgrwanwccb`

3. **Open SQL Editor**

4. **Run query to verify users:**
   ```sql
   SELECT id, email, name, user_type FROM users ORDER BY created_at DESC;
   ```

5. **Run query to verify pricing:**
   ```sql
   SELECT COUNT(*) as total_pricing FROM cylinder_pricing;
   -- Should return: 130 (10 providers × 13 cylinder types)
   ```

---

## Testing Authentication

After setup, test login with curl or Postman:

**Using curl:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chanda@example.com",
    "password": "password123"
  }'
```

**Expected response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "chanda@example.com",
  "name": "Chanda Mulenga",
  "user_type": "customer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## If You Get Errors

### Error: "DATABASE_URL environment variable is not set"
**Solution:**
- Verify `.env` file exists in project root
- Check `.env` contains `DATABASE_URL=postgresql://...`
- Make sure .env file is not empty

### Error: "Unable to ping database"
**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase project is active (not sleeping)
- Verify password in DATABASE_URL hasn't changed
- Test connection manually:
  ```bash
  PGPASSWORD="YOUR_PASSWORD" psql -h db.gxcqcwbdgucgrwanwccb.supabase.co -U postgres -d postgres
  ```

### Error: "relation \"users\" does not exist"
**Solution:**
- Ensure all database tables are created in Supabase
- Run migrations or create tables via Supabase UI
- Check DATABASE_SETUP.md for schema

### Error: "Permission denied"
**Solution:**
- Verify the postgres user has proper permissions
- Check if RLS (Row Level Security) is interfering
- Contact Supabase support if issues persist

---

## Workflow After Setup

### 1. Start the Backend Server
```bash
go run cmd/server/main.go
```

Server will start on `http://localhost:8080`

### 2. In Another Terminal, Test API
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chanda@example.com","password":"password123"}'

# Get providers (requires auth token)
curl -X GET http://localhost:8080/api/providers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test the Mobile App
Configure your Expo app to use `http://localhost:8080` and test endpoints

---

## Important Notes

### Password Security
- All test passwords are hashed with bcrypt
- Default test password is `password123` - **NEVER use in production**
- Create strong passwords for production users

### Data Location
- All test data is created in your Supabase PostgreSQL database
- Data persists between script runs
- Run option 4 (Reset) to start fresh

### Backup Your Data
- Before running option 4, consider backing up your data:
  ```bash
  PGPASSWORD="YOUR_PASSWORD" pg_dump \
    -h db.gxcqcwbdgucgrwanwccb.supabase.co \
    -U postgres \
    -d postgres > backup.sql
  ```

---

## Troubleshooting

### Script runs but creates no data
- Check Supabase SQL Editor for any error logs
- Verify user permissions
- Check firewall/VPN if on restricted network

### Need to run multiple times
- First run: Option 1 (Complete Setup)
- Add more data: Option 3 (Providers Only)
- Start fresh: Option 4 (Reset) → Option 1 (Complete Setup)

### Performance is slow
- This is normal for initial setup (first time connects can take 5-10 seconds)
- Subsequent runs are faster
- Check your internet connection speed

---

## Next Steps

1. ✅ Run: `go run scripts/setup_data.go` (select option 1)
2. ✅ Verify data in Supabase console
3. ✅ Start backend: `go run cmd/server/main.go`
4. ✅ Test API with curl or Postman
5. ✅ Configure Expo app to use localhost:8080
6. ✅ Test end-to-end workflow

---

**Status: ✅ Ready to Run Locally**

Your setup script is fully functional and ready to initialize your Supabase database!
