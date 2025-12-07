package database

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
)

var (
	pgxDriverOnce sync.Once
)

type PostgresClient struct {
	Pool *pgxpool.Pool
}

func NewPostgresClient(pool *pgxpool.Pool) *PostgresClient {
	return &PostgresClient{
		Pool: pool,
	}
}

func ConnectPostgres(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Parse and configure connection pool
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	// Configure connection pool settings with relaxed constraints
	config.MaxConns = 25
	config.MinConns = 0 // Don't require minimum connections on startup
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	// Increase connection timeout for slow networks
	config.ConnConfig.ConnectTimeout = 20 * time.Second

	// Custom dialer to prefer IPv4 and handle IPv6 fallback gracefully
	config.ConnConfig.DialFunc = func(ctx context.Context, network string, addr string) (net.Conn, error) {
		// Split host and port
		host, port, err := net.SplitHostPort(addr)
		if err != nil {
			return nil, fmt.Errorf("failed to split host:port: %w", err)
		}

		// Check if host is already an IP address
		if parsedIP := net.ParseIP(host); parsedIP != nil {
			// Host is already an IP address
			if parsedIP.To4() != nil {
				// It's IPv4, use it directly
				d := net.Dialer{Timeout: 20 * time.Second}
				return d.DialContext(ctx, "tcp4", addr)
			}
			// It's IPv6, but network doesn't support it - fail fast
			return nil, fmt.Errorf("IPv6 address provided but network doesn't support IPv6: %s", host)
		}

		// Host is a hostname, resolve it to IPv4 addresses only
		resolver := &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{Timeout: 5 * time.Second}
				return d.DialContext(ctx, "udp4", address)
			},
		}

		ipAddrs, err := resolver.LookupIPAddr(ctx, host)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve %s: %w", host, err)
		}

		// Filter for IPv4 addresses only
		var ipv4Addrs []net.IPAddr
		for _, addr := range ipAddrs {
			if addr.IP.To4() != nil {
				ipv4Addrs = append(ipv4Addrs, addr)
			}
		}

		if len(ipv4Addrs) == 0 {
			return nil, fmt.Errorf("no IPv4 addresses found for %s (found %d total addresses, all IPv6)", host, len(ipAddrs))
		}

		// Try each IPv4 address
		var lastErr error
		d := net.Dialer{Timeout: 20 * time.Second}

		for _, ipAddr := range ipv4Addrs {
			targetAddr := net.JoinHostPort(ipAddr.IP.String(), port)
			conn, err := d.DialContext(ctx, "tcp4", targetAddr)
			if err == nil {
				return conn, nil
			}
			lastErr = err
		}

		return nil, fmt.Errorf("failed to connect to any IPv4 address for %s: %w", host, lastErr)
	}

	// Create connection pool
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Test connection with retry logic
	maxRetries := 3 // Reduced from 5 to fail faster and allow REST API fallback
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		pingCtx, pingCancel := context.WithTimeout(context.Background(), 15*time.Second)
		err := pool.Ping(pingCtx)
		pingCancel()

		if err == nil {
			return pool, nil
		}

		lastErr = err
		if attempt < maxRetries {
			// Wait before retrying (exponential backoff)
			waitTime := time.Duration(attempt*attempt) * time.Second
			fmt.Printf("⏳ Connection attempt %d/%d failed, retrying in %v...\n", attempt, maxRetries, waitTime)
			time.Sleep(waitTime)
		}
	}

	pool.Close()
	return nil, fmt.Errorf("unable to ping database after %d attempts: %w", maxRetries, lastErr)
}

// InitPostgresSchema creates all necessary tables if they don't exist
func InitPostgresSchema(pool *pgxpool.Pool) error {
	ctx := context.Background()
	fmt.Println("🔄 Initializing PostgreSQL database schema...")

	schema := `
	-- Enable UUID extension
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		password TEXT NOT NULL,
		email VARCHAR(255) UNIQUE,
		name TEXT NOT NULL,
		phone_number VARCHAR(50) UNIQUE NOT NULL,
		rating INTEGER DEFAULT 0,
		user_type VARCHAR(20) NOT NULL CHECK(user_type IN ('customer', 'provider', 'courier')),
		latitude DOUBLE PRECISION,
		longitude DOUBLE PRECISION,
		expo_push_token TEXT,
		phone_verified BOOLEAN DEFAULT FALSE,
		verification_time TIMESTAMP,
		supabase_user_id UUID UNIQUE,
		google_id VARCHAR(255) UNIQUE,
		profile_image TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
	CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

	-- Orders table
	CREATE TABLE IF NOT EXISTS orders (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL,
		provider_id UUID,
		courier_id UUID,
		status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'delivered', 'in-transit')),
		cylinder_type VARCHAR(10) NOT NULL CHECK(cylinder_type IN ('3KG', '5KG', '6KG', '9KG', '12KG', '13KG', '14KG', '15KG', '18KG', '19KG', '20KG', '45KG', '48KG')),
		quantity INTEGER NOT NULL,
		price_per_unit NUMERIC(10, 2) NOT NULL,
		total_price NUMERIC(10, 2) NOT NULL,
		delivery_fee NUMERIC(10, 2) NOT NULL,
		service_charge NUMERIC(10, 2) NOT NULL,
		grand_total NUMERIC(10, 2) NOT NULL,
		delivery_address TEXT NOT NULL,
		delivery_method TEXT NOT NULL,
		payment_method TEXT NOT NULL,
		payment_status VARCHAR(20) NOT NULL CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
		current_latitude DOUBLE PRECISION,
		current_longitude DOUBLE PRECISION,
		current_address TEXT,
		ride_link TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL,
		FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE SET NULL
	);

	CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
	CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders(provider_id);
	CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
	CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
	CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

	-- Payments table
	CREATE TABLE IF NOT EXISTS payments (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		order_id UUID NOT NULL,
		amount NUMERIC(10, 2) NOT NULL,
		status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
		provider TEXT NOT NULL,
		phone_number VARCHAR(50) NOT NULL,
		transaction_ref VARCHAR(255) UNIQUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
	CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
	CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

	-- Cylinder pricing table
	CREATE TABLE IF NOT EXISTS cylinder_pricing (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		provider_id UUID NOT NULL,
		cylinder_type VARCHAR(10) NOT NULL,
		refill_price NUMERIC(10, 2) NOT NULL,
		buy_price NUMERIC(10, 2) NOT NULL,
		stock_quantity INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(provider_id, cylinder_type)
	);

	CREATE INDEX IF NOT EXISTS idx_cylinder_pricing_provider_id ON cylinder_pricing(provider_id);
	CREATE INDEX IF NOT EXISTS idx_cylinder_pricing_cylinder_type ON cylinder_pricing(cylinder_type);

	-- Location history table
	CREATE TABLE IF NOT EXISTS location_history (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		courier_id UUID NOT NULL,
		latitude DOUBLE PRECISION NOT NULL,
		longitude DOUBLE PRECISION NOT NULL,
		street_name TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_location_history_courier_id ON location_history(courier_id);
	CREATE INDEX IF NOT EXISTS idx_location_history_created_at ON location_history(created_at DESC);

	-- Function to update updated_at timestamp
	CREATE OR REPLACE FUNCTION update_updated_at_column()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = CURRENT_TIMESTAMP;
		RETURN NEW;
	END;
	$$ language 'plpgsql';

	-- Triggers for updated_at
	DROP TRIGGER IF EXISTS users_updated_at ON users;
	CREATE TRIGGER users_updated_at
		BEFORE UPDATE ON users
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS orders_updated_at ON orders;
	CREATE TRIGGER orders_updated_at
		BEFORE UPDATE ON orders
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS payments_updated_at ON payments;
	CREATE TRIGGER payments_updated_at
		BEFORE UPDATE ON payments
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS cylinder_pricing_updated_at ON cylinder_pricing;
	CREATE TRIGGER cylinder_pricing_updated_at
		BEFORE UPDATE ON cylinder_pricing
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	DROP TRIGGER IF EXISTS location_history_updated_at ON location_history;
	CREATE TRIGGER location_history_updated_at
		BEFORE UPDATE ON location_history
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	-- Admin Users Table
	CREATE TABLE IF NOT EXISTS admin_users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		name TEXT NOT NULL,
		admin_role TEXT NOT NULL CHECK (admin_role IN ('super_admin', 'manager', 'analyst', 'support')),
		permissions TEXT[] DEFAULT ARRAY['read:dashboard'],
		is_active BOOLEAN DEFAULT true,
		last_login TIMESTAMPTZ,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
	CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(admin_role);
	CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

	-- Admin Activity Log Table
	CREATE TABLE IF NOT EXISTS admin_activity_log (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
		action TEXT NOT NULL,
		resource_type TEXT,
		resource_id UUID,
		details JSONB,
		ip_address TEXT,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
	CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at DESC);

	-- Trigger for admin_users updated_at
	DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
	CREATE TRIGGER admin_users_updated_at
		BEFORE UPDATE ON admin_users
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();

	-- Insert default super admin user if not exists
	INSERT INTO admin_users (id, email, password, name, admin_role, permissions, is_active)
	VALUES (
		'a0000000-0000-0000-0000-000000000001'::UUID,
		'admin@lpgfinder.com',
		'$2a$10$ycGjJZdPmXXM68cDW6SZduaHPzgcUzkdRkCi1R3/6zU.zSACWemz2',
		'Admin User',
		'super_admin',
		ARRAY['*'],
		true
	) ON CONFLICT (id) DO UPDATE SET
		password = '$2a$10$ycGjJZdPmXXM68cDW6SZduaHPzgcUzkdRkCi1R3/6zU.zSACWemz2',
		updated_at = NOW();
	`

	_, err := pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize PostgreSQL schema: %w", err)
	}

	fmt.Println("✅ PostgreSQL database schema initialized successfully!")
	return nil
}

// GetStdDB returns a standard database/sql connection from a pgxpool
func GetStdDB(pool *pgxpool.Pool) *sql.DB {
	// Register the pgx driver (safely handling if already registered)
	pgxDriverOnce.Do(func() {
		defer func() {
			if r := recover(); r != nil {
				// Driver already registered elsewhere, which is fine
			}
		}()
		sql.Register("pgx", stdlib.GetDefaultDriver())
	})

	// Get connection string
	connString := pool.Config().ConnString()

	// Open a standard database connection using pgx driver
	db, err := sql.Open("pgx", connString)
	if err != nil {
		panic(fmt.Sprintf("failed to open standard database connection: %v", err))
	}

	// Configure connection pool settings to match pgxpool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)
	db.SetConnMaxIdleTime(30 * time.Minute)

	return db
}
