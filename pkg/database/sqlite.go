package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// ConnectSQLite initializes and returns a SQLite database connection
func ConnectSQLite(dbPath string) (*sql.DB, error) {
	// Ensure the directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	log.Printf("🔄 Connecting to SQLite database at %s...", dbPath)

	// Open SQLite connection
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, fmt.Errorf("failed to open SQLite database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping SQLite database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	log.Println("✅ SQLite database connected successfully!")

	return db, nil
}

// InitSchema creates all necessary tables if they don't exist
func InitSchema(db *sql.DB) error {
	log.Println("🔄 Initializing database schema...")

	schema := `
	-- Users table
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		password TEXT NOT NULL,
		email TEXT UNIQUE,
		name TEXT NOT NULL,
		phone_number TEXT UNIQUE NOT NULL,
		rating INTEGER DEFAULT 0,
		user_type TEXT NOT NULL CHECK(user_type IN ('customer', 'provider', 'courier')),
		latitude REAL,
		longitude REAL,
		expo_push_token TEXT,
		phone_verified INTEGER DEFAULT 0,
		verification_time TIMESTAMP,
		supabase_user_id TEXT UNIQUE,
		google_id TEXT UNIQUE,
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
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		provider_id TEXT,
		courier_id TEXT,
		status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'delivered', 'in-transit')),
		cylinder_type TEXT NOT NULL CHECK(cylinder_type IN ('3KG', '5KG', '6KG', '9KG', '12KG', '13KG', '14KG', '15KG', '18KG', '19KG', '20KG', '45KG', '48KG')),
		quantity INTEGER NOT NULL,
		price_per_unit REAL NOT NULL,
		total_price REAL NOT NULL,
		delivery_fee REAL NOT NULL,
		service_charge REAL NOT NULL,
		grand_total REAL NOT NULL,
		delivery_address TEXT NOT NULL,
		delivery_method TEXT NOT NULL,
		payment_method TEXT NOT NULL,
		payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
		current_latitude REAL,
		current_longitude REAL,
		current_address TEXT,
		ride_link TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id),
		FOREIGN KEY (provider_id) REFERENCES users(id),
		FOREIGN KEY (courier_id) REFERENCES users(id)
	);

	CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
	CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders(provider_id);
	CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
	CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
	CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

	-- Payments table
	CREATE TABLE IF NOT EXISTS payments (
		id TEXT PRIMARY KEY,
		order_id TEXT NOT NULL,
		amount REAL NOT NULL,
		status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
		provider TEXT NOT NULL,
		phone_number TEXT NOT NULL,
		transaction_ref TEXT UNIQUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (order_id) REFERENCES orders(id)
	);

	CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
	CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
	CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

	-- Cylinder pricing table
	CREATE TABLE IF NOT EXISTS cylinder_pricing (
		id TEXT PRIMARY KEY,
		provider_id TEXT NOT NULL,
		cylinder_type TEXT NOT NULL,
		refill_price REAL NOT NULL,
		buy_price REAL NOT NULL,
		stock_quantity INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (provider_id) REFERENCES users(id),
		UNIQUE(provider_id, cylinder_type)
	);

	CREATE INDEX IF NOT EXISTS idx_cylinder_pricing_provider_id ON cylinder_pricing(provider_id);
	CREATE INDEX IF NOT EXISTS idx_cylinder_pricing_cylinder_type ON cylinder_pricing(cylinder_type);

	-- Location history table
	CREATE TABLE IF NOT EXISTS location_history (
		id TEXT PRIMARY KEY,
		courier_id TEXT NOT NULL,
		latitude REAL NOT NULL,
		longitude REAL NOT NULL,
		street_name TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (courier_id) REFERENCES users(id)
	);

	CREATE INDEX IF NOT EXISTS idx_location_history_courier_id ON location_history(courier_id);
	CREATE INDEX IF NOT EXISTS idx_location_history_created_at ON location_history(created_at DESC);

	-- Triggers for updated_at
	CREATE TRIGGER IF NOT EXISTS users_updated_at
	AFTER UPDATE ON users
	BEGIN
		UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
	END;

	CREATE TRIGGER IF NOT EXISTS orders_updated_at
	AFTER UPDATE ON orders
	BEGIN
		UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
	END;

	CREATE TRIGGER IF NOT EXISTS payments_updated_at
	AFTER UPDATE ON payments
	BEGIN
		UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
	END;

	CREATE TRIGGER IF NOT EXISTS cylinder_pricing_updated_at
	AFTER UPDATE ON cylinder_pricing
	BEGIN
		UPDATE cylinder_pricing SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
	END;

	CREATE TRIGGER IF NOT EXISTS location_history_updated_at
	AFTER UPDATE ON location_history
	BEGIN
		UPDATE location_history SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
	END;
	`

	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	log.Println("✅ Database schema initialized successfully!")
	return nil
}
