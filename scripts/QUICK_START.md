# Quick Start Guide - LPG Delivery System Scripts

## 🚀 Get Started in 3 Steps

### Step 1: Run Setup Script

**On macOS/Linux:**
```bash
cd scripts
chmod +x setup.sh
./setup.sh
```

**On Windows:**
```bash
cd scripts
setup.bat
```

### Step 2: Choose "Complete Setup" (Option 1)
This will:
- ✅ Test database connection
- ✅ Create 6 initial users
- ✅ Generate 10 providers with pricing

### Step 3: Start the Server
```bash
cd ..
go run cmd/server/main.go
```

---

## 📋 Running Setup Data Script

The `setup_data.go` script is your single consolidated tool for all database initialization:

```bash
cd scripts
go run setup_data.go
```

This script provides an interactive menu with 4 options:

### 1. **Complete Setup** (Option 1)
- Tests database connection
- Creates 6 initial users (2 customers, 2 providers, 2 couriers)
- Generates 10 providers with cylinder pricing

### 2. **Create Initial Users Only** (Option 2)
- Creates 6 sample users:
  - 2 Customers (Chanda Mulenga, Mutale Banda)
  - 2 Providers (Oryx Gas, Afrox Zambia)
  - 2 Couriers (Themba Nyirenda, Zindaba Phiri)

### 3. **Generate Providers Only** (Option 3)
- Creates 10 random providers with pricing for 13 cylinder types
- Useful for adding more test data after initial setup

### 4. **Reset Database** (Option 4)
- ⚠️ Deletes all data - requires confirmation
- Use only when you need to start completely fresh

---

## ⚙️ Prerequisites

1. **Environment Setup**
   - Create `.env` file in project root
   - Set `DATABASE_URL=postgresql://...`

2. **Database**
   - PostgreSQL or Supabase
   - Required tables must exist

3. **Go**
   - Version 1.21 or higher

---

---

## 🧪 Testing Workflow

```bash
# Terminal 1: Start server
go run cmd/server/main.go

# Terminal 2: Verify setup in another terminal
cd scripts
go run setup_data.go
# Select option 1 for complete setup
```

---

## 📝 Default Users

After running `go run initial.go`:

| Email | Password | Role |
|-------|----------|------|
| chanda@example.com | password123 | Customer |
| mutale@example.com | password123 | Customer |
| oryx@example.com | password123 | Provider |
| afrox@example.com | password123 | Provider |
| themba@example.com | password123 | Courier |
| zindaba@example.com | password123 | Courier |

---

## 🆘 Troubleshooting

### "DATABASE_URL not set"
- Ensure `.env` file exists in project root
- Check DATABASE_URL is set correctly

### "Connection refused"
- Verify database is running
- Check connection string
- For Supabase, verify project is active

### "Table does not exist"
- Create required tables using migrations
- Ensure schema matches requirements

---

## 📚 Documentation

For detailed information:
- See `SCRIPTS_README.md` for comprehensive guide
- Check `pkg/database/` for connection setup
- Review `.env.example` for config template

---

## 🎯 Common Tasks

**Complete first-time setup:**
```bash
cd scripts
go run setup_data.go
# Select option 1 (Complete Setup)
```

**Add more test data:**
```bash
cd scripts
go run setup_data.go
# Select option 3 (Generate Providers Only)
```

**Clear and start over:**
```bash
cd scripts
go run setup_data.go
# Select option 4 (Reset Database) - confirm with 'yes'
# Then select option 1 (Complete Setup)
```

**Just create initial users:**
```bash
cd scripts
go run setup_data.go
# Select option 2 (Create Initial Users Only)
```

---

## 💡 Tips

- Run scripts from the `scripts/` directory
- All scripts use environment variables from `.env`
- Passwords are automatically hashed with bcrypt
- UUIDs are used for all IDs
- Timestamps are set to current time

---

Happy testing! 🎉
