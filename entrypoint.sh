#!/bin/sh
set -e

echo "Starting LPG Delivery Server..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host/database?sslmode=require
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^/]*\).*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Run migrations if migration files exist
if [ -f "/app/separate_admin_migration.sql" ]; then
    echo "Running admin_users migration..."
    # Use sslmode=require for Neon connection
    PGSSLMODE=require PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/separate_admin_migration.sql 2>&1 || echo "Admin migration may have already been applied (this is OK if re-deploying)"
else
    echo "No admin migration file found, skipping..."
fi

if [ -f "/app/user_preferences_migration.sql" ]; then
    echo "Running user_preferences migration..."
    PGSSLMODE=require PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/user_preferences_migration.sql 2>&1 || echo "Preferences migration may have already been applied (this is OK if re-deploying)"
else
    echo "No preferences migration file found, skipping..."
fi

if [ -f "/app/courier_assignment_migration.sql" ]; then
    echo "Running courier_assignment migration..."
    PGSSLMODE=require PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/courier_assignment_migration.sql 2>&1 || echo "Courier assignment migration may have already been applied (this is OK if re-deploying)"
else
    echo "No courier assignment migration file found, skipping..."
fi

# Start the main application
echo "Starting application..."
exec ./main
