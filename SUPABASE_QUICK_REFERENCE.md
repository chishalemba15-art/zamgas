# Supabase Local Docker - Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Start local Supabase
supabase start

# Check status
supabase status

# Stop Supabase
supabase stop

# Reset database (⚠️ destroys data)
supabase db reset
```

## 🔌 Connection Strings

### PostgreSQL Direct Connection
```
postgresql://postgres:postgres@localhost:54322/postgres
```

### Via 127.0.0.1 (if localhost fails)
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### For Prisma
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`.env` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

## 📝 Environment Variables

### Minimal Setup (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### Full Setup (.env)
```env
# Supabase API
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## 🔐 Default Credentials

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| PostgreSQL | localhost:54322 | postgres | postgres |
| Supabase Studio | http://localhost:54323 | - | - |
| API Gateway | http://localhost:54321 | - | - |

## 🧪 Test Connection

### Using psql
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT version();"
```

### Using Go (this project)
```bash
# Copy local config
cp .env.local .env

# Run test
go run test_local_supabase.go
```

### Using Supabase CLI
```bash
supabase db shell
```

## 📦 Go Package Usage

### pgx/v5 (Direct PostgreSQL)
```go
import (
    "context"
    "os"
    "github.com/jackc/pgx/v5"
)

func main() {
    conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close(context.Background())

    var version string
    conn.QueryRow(context.Background(), "SELECT version()").Scan(&version)
    fmt.Println(version)
}
```

### Supabase REST API
```go
import "github.com/yakumwamba/lpg-delivery-system/pkg/database"

config := database.SupabaseConfig{
    URL:            os.Getenv("SUPABASE_URL"),
    AnonKey:        os.Getenv("SUPABASE_ANON_KEY"),
    ServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
    UseServiceRole: true,
}

client := database.NewSupabaseClient(config)

// Query users
var users []map[string]interface{}
err := client.From("users").Limit(10).Execute(ctx, &users)
```

## 🛠️ Common Tasks

### Create Migration
```bash
supabase migration new create_users_table
# Edit: supabase/migrations/TIMESTAMP_create_users_table.sql
```

### Apply Migrations
```bash
supabase db push
```

### Rollback Migration
```bash
supabase db reset
```

### Seed Data
```bash
supabase db seed
# Edit: supabase/seed.sql
```

### Dump Schema
```bash
supabase db dump -f schema.sql
```

## 🔍 Debugging

### Check if Supabase is running
```bash
docker ps | grep supabase
```

### View logs
```bash
# All logs
supabase logs

# Database logs only
supabase logs db

# API logs only
supabase logs api
```

### Check ports
```bash
# macOS/Linux
lsof -i :54321
lsof -i :54322

# Windows
netstat -ano | findstr :54321
netstat -ano | findstr :54322
```

## ⚠️ Common Issues

### "Connection refused" on port 54322
**Solution:**
```bash
# Check Docker is running
docker ps

# Restart Supabase
supabase stop
supabase start
```

### "Port already in use"
**Solution:**
```bash
# Find process using port
lsof -i :54322

# Kill process (replace PID)
kill -9 <PID>

# Or change port in config
nano supabase/config.toml
```

### "localhost" not resolving
**Solution:**
```env
# Use 127.0.0.1 instead
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Tables don't exist
**Solution:**
```bash
# Run migrations
supabase db push

# Or reset and migrate
supabase db reset
```

## 📊 Supabase Studio

Access your local dashboard at: **http://localhost:54323**

Features:
- 📋 Table Editor
- 🔍 SQL Editor
- 👥 User Management
- 🔐 Authentication Settings
- 📈 API Logs
- 🗂️ Storage Browser

## 🌐 URLs Reference

| Service | URL |
|---------|-----|
| Supabase Studio | http://localhost:54323 |
| REST API | http://localhost:54321 |
| GraphQL | http://localhost:54321/graphql/v1 |
| PostgreSQL | localhost:54322 |
| Email Testing (Inbucket) | http://localhost:54324 |

## 📚 Documentation Links

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [pgx Documentation](https://pkg.go.dev/github.com/jackc/pgx/v5)

## 💡 Pro Tips

1. **Use service_role key for backend:** It bypasses Row Level Security
2. **Commit migrations to git:** `supabase/migrations/` should be versioned
3. **Reset often during development:** `supabase db reset` gives you a clean slate
4. **Check Studio for debugging:** The SQL editor is invaluable
5. **Use Inbucket for email testing:** All emails sent by your app appear at localhost:54324

## 🎯 Production Checklist

Before deploying to production:

- [ ] Create Supabase cloud project
- [ ] Run `supabase link --project-ref YOUR_PROJECT_ID`
- [ ] Push migrations: `supabase db push`
- [ ] Update environment variables with production credentials
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Set up backup strategy
- [ ] Configure connection pooling
- [ ] Test with production-like data volume

---

**Need help?** Check [SUPABASE_LOCAL_SETUP.md](./SUPABASE_LOCAL_SETUP.md) for detailed setup instructions.
