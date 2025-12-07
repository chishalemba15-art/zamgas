# Local Docker Supabase Setup Guide

This guide helps you set up and connect the LPG Delivery System server to a locally-hosted Supabase instance running in Docker.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git installed
- Go 1.19+ installed (for running the server)

## Step 1: Set Up Local Supabase with Docker

### Clone the Supabase Repository

```bash
# Get the Supabase Docker setup
git clone --depth 1 https://github.com/supabase/supabase
cd supabase

# Create a new project directory
mkdir ../supabase-local-project
cp -rf docker/* ../supabase-local-project/
cp docker/.env.example ../supabase-local-project/.env

# Move to your local project directory
cd ../supabase-local-project
```

### Configure Environment Variables

Edit the `.env` file in your Supabase Docker directory:

```bash
# Key variables to set:
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=92i0suAgtFIGuNclslKvSwFSBnHpPhECt5mCKP0c  # Or generate your own
SITE_URL=http://localhost:3000
SUPABASE_PUBLIC_URL=http://localhost:8000

# Dashboard credentials (change these!)
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=your_secure_password
```

### Start Supabase Services

```bash
# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d

# Verify all services are running
docker compose ps
```

All services should show status `running (healthy)`.

### Access Supabase Components

- **Supabase Studio (Dashboard)**: http://localhost:8000
- **REST API**: http://localhost:8000/rest/v1/
- **PostgreSQL (direct)**: localhost:5432
- **PostgreSQL (pooled via Supavisor)**: localhost:6543

## Step 2: Get Your Credentials from Supabase

### Method 1: From Supabase Studio Dashboard

1. Open http://localhost:8000 in your browser
2. Login with your dashboard credentials
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL**: Usually `http://localhost:8000` for local setup
   - **Anon Key**: Your anonymous key
   - **Service Role Key**: Your service role key

### Method 2: From Environment Variables

Check your `.env` file in the Supabase Docker directory:

```bash
cat .env | grep -E "ANON_KEY|SERVICE_ROLE_KEY|JWT_SECRET"
```

## Step 3: Configure the LPG Delivery Server

### Update Your `.env` File

In the server directory (`/path/to/lpg_delivery/server`), create or update your `.env` file:

```bash
# ===== LOCAL DOCKER SUPABASE =====
# Direct PostgreSQL connection (primary, tries this first)
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres

# Supabase REST API (fallback if PostgreSQL fails)
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=your-anon-key-from-supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase

# Server Configuration
PORT=8080
JWT_SECRET=21i3u1oi23b23423423423sdfsasdnajsbkjbfkjbsdkjbfskjbfkjsdbfbksdf

# Other required services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

PAWAPAY_API_URL=https://api.sandbox.pawapay.io/
PAWAPAY_API_TOKEN=your-pawapay-token
```

## Step 4: Verify Database Connection

### Initialize Database Schema

The server will automatically initialize the database schema on first run. To manually check:

```bash
# Connect to PostgreSQL directly
psql postgresql://postgres:your-password@localhost:5432/postgres

# Or through Supavisor (connection pooler)
psql postgresql://postgres:your-password@localhost:6543/postgres

# List tables
\dt

# Check schema
\d users
```

## Step 5: Run the Server

```bash
cd /path/to/lpg_delivery/server

# Download dependencies
go mod download

# Run the server
go run ./cmd/server/main.go
```

You should see output like:
```
🔄 Attempting to connect to PostgreSQL...
✓ Connected to PostgreSQL database
📊 Initializing services...
🚀 Server starting on port 8080
```

## Troubleshooting

### Issue: "no route to host" or Connection Refused

**Cause**: Docker network or firewall issues

**Solution**:
1. Verify Docker Supabase is running: `docker compose ps`
2. Check if port 5432 is accessible: `telnet localhost 5432`
3. Ensure database password matches in both `.env` files
4. Try connecting via Supavisor (port 6543) instead: Update `DATABASE_URL` to use `:6543`

### Issue: DNS/IPv6 Resolution Failures

**Cause**: Your system trying IPv6 when only IPv4 is available

**Solution**: This is automatically handled by the improved connection logic. The server now:
1. Tries IPv4 first for localhost connections
2. Falls back to IPv6 if needed
3. Uses standard TCP as final fallback
4. Automatically falls back to Supabase REST API if PostgreSQL fails

### Issue: Connection Timeout

**Cause**: Slow network or resource constraints

**Solution**:
1. Increase Docker resource limits (CPU/Memory)
2. Increase connection timeout in `pkg/database/postgres.go` (currently 20 seconds)
3. Use Supabase REST API exclusively by not setting `DATABASE_URL`

### Issue: "Failed to connect to Supabase REST API"

**Cause**: Missing or incorrect API credentials

**Solution**:
1. Verify `SUPABASE_URL=http://localhost:8000` (not https for local)
2. Verify keys are correctly set in `.env`
3. Check Supabase Studio is accessible at http://localhost:8000
4. Check Docker logs: `docker compose logs -f kong`

## Testing the Connection

### Test PostgreSQL Directly

```bash
# Using psql
psql postgresql://postgres:your-password@localhost:5432/postgres -c "SELECT version();"

# Or with the pooler
psql postgresql://postgres:your-password@localhost:6543/postgres -c "SELECT version();"
```

### Test REST API

```bash
curl -X GET "http://localhost:8000/rest/v1/users" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Test the Server

```bash
# Health check
curl http://localhost:8080/providers

# Should return JSON list of providers (empty initially)
```

## Network Connectivity Notes

### For Docker Desktop (Mac/Windows)

Docker Desktop provides `host.docker.internal` to access localhost from containers, but for your server (running on host), use `localhost` or `127.0.0.1`.

### For Linux

If running Docker natively on Linux, use `localhost` or `127.0.0.1`. If containers need to reach the host, you may need to use the Docker bridge IP (usually `172.17.0.1`).

## Production Considerations

For production deployment:

1. **Use Cloud Supabase**: Set `DATABASE_URL` to your cloud PostgreSQL instance
2. **Change Dashboard Credentials**: Update `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` in `.env`
3. **Secure Your JWT Secret**: Use a strong, random JWT_SECRET (minimum 40 characters)
4. **Use SSL/TLS**: Set up HTTPS for all endpoints
5. **Configure Firewall**: Only expose necessary ports
6. **Use Environment Variables**: Don't commit `.env` files to version control
7. **Regular Backups**: Set up automated database backups

## Useful Commands

```bash
# View Docker Supabase logs
docker compose -f /path/to/supabase/docker-compose.yml logs -f

# Stop all services
docker compose -f /path/to/supabase/docker-compose.yml down

# Remove data and start fresh
docker compose -f /path/to/supabase/docker-compose.yml down -v

# Restart a specific service
docker compose -f /path/to/supabase/docker-compose.yml restart postgres

# Access database from running container
docker exec -it $(docker ps | grep supabase-db | awk '{print $1}') psql -U postgres
```

## Additional Resources

- [Supabase Docker Docs](https://supabase.com/docs/guides/self-hosting/docker)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Supabase REST API Documentation](https://supabase.com/docs/guides/api/rest)

