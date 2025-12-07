# Local Docker Supabase Setup Guide

This guide will help you set up and connect to a local Supabase instance running in Docker.

## Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed ([Install guide](https://supabase.com/docs/guides/cli/getting-started))
- Go 1.21+ installed

## Quick Start

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux/WSL
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Initialize Supabase (First Time Only)

```bash
# Initialize Supabase in your project directory
supabase init
```

This creates a `supabase/` directory with migrations and config files.

### 3. Start Local Supabase

```bash
# Start all Supabase services in Docker
supabase start
```

This command will:
- Download and start Docker containers (first run takes 2-5 minutes)
- Start PostgreSQL database
- Start Supabase Studio (dashboard)
- Start API gateway (Kong)
- Display your local credentials

**Expected output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configure Your Application

Copy the local configuration:

```bash
# Copy the local environment file
cp .env.local .env
```

Or manually update your `.env` file with these settings:

```env
# Supabase Configuration (Local Docker)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database Configuration (Default password: "postgres")
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### 5. Run Database Migrations

```bash
# Apply migrations to create tables
supabase db push

# Or run migrations directly
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/001_initial_schema.sql
```

### 6. Verify Connection

Test your connection:

```bash
# Test PostgreSQL connection
go run cmd/test-supabase/main.go

# Or test with psql
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT version();"
```

### 7. Start Your Application

```bash
# Run the server
go run cmd/server/main.go
```

Your server should now connect to local Supabase!

## Common Commands

```bash
# Check Supabase status
supabase status

# View logs
supabase logs

# Stop Supabase
supabase stop

# Reset database (⚠️ destroys all data)
supabase db reset

# Access PostgreSQL directly
supabase db shell

# Open Supabase Studio dashboard
open http://localhost:54323
```

## Default Credentials

### PostgreSQL Database
- **Host:** localhost
- **Port:** 54322
- **Database:** postgres
- **Username:** postgres
- **Password:** postgres

### Supabase Studio Dashboard
- **URL:** http://localhost:54323
- **No authentication required** (local development only)

### API Gateway (Kong)
- **REST API:** http://localhost:54321
- **GraphQL:** http://localhost:54321/graphql/v1

## Troubleshooting

### Port Already in Use

If ports 54321, 54322, or 54323 are already taken:

```bash
# Stop Supabase
supabase stop

# Change ports in supabase/config.toml
nano supabase/config.toml

# Restart
supabase start
```

### Connection Refused

If you get "connection refused" errors:

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Restart Supabase:**
   ```bash
   supabase stop
   supabase start
   ```

3. **Check firewall settings:**
   - Allow connections to localhost ports 54321-54324
   - Disable VPN temporarily if having issues

### Database Connection Issues

If `DATABASE_URL` connection fails:

1. **Try 127.0.0.1 instead of localhost:**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   ```

3. **Check PostgreSQL logs:**
   ```bash
   supabase logs db
   ```

### Tables Don't Exist

If you get "relation does not exist" errors:

```bash
# Reset and recreate database
supabase db reset

# Or manually run migrations
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/001_initial_schema.sql
```

## Switching Between SQLite and PostgreSQL

Your application supports both SQLite (file-based) and PostgreSQL (Supabase).

### Use SQLite (Current Default)

```env
# .env
SQLITE_DB_PATH=./data/lpg_delivery.db
# Comment out or remove DATABASE_URL
```

### Use PostgreSQL/Supabase

```env
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
# SQLite will be ignored when DATABASE_URL is set
```

## Production Deployment

When deploying to production with cloud Supabase:

1. **Create a Supabase project:** https://supabase.com/dashboard

2. **Get your credentials:**
   - Project Settings > API
   - Copy your `URL` and `anon key`
   - Copy your `service_role key` (keep this secret!)

3. **Update .env for production:**
   ```env
   SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
   ```

4. **Run migrations:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   supabase db push
   ```

## Directory Structure

```
project/
├── supabase/
│   ├── config.toml          # Supabase configuration
│   ├── migrations/          # Database migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql             # Seed data (optional)
├── .env                     # Active environment config
├── .env.local              # Local development config
├── .env.example            # Example config with comments
└── SUPABASE_LOCAL_SETUP.md # This file
```

## Next Steps

1. ✅ Local Supabase running
2. ✅ Database connected
3. 📝 Create your database schema (migrations)
4. 🔐 Set up Row Level Security (RLS) policies
5. 🚀 Start building your application
6. 📊 Monitor via Supabase Studio: http://localhost:54323

## Additional Resources

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgx Documentation](https://pkg.go.dev/github.com/jackc/pgx/v5)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review Supabase logs: `supabase logs`
3. Visit [Supabase Discord](https://discord.supabase.com/)
4. Check [GitHub Issues](https://github.com/supabase/supabase/issues)
