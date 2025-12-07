package main

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func seedAdminUser(pool *pgxpool.Pool, ctx context.Context) error {
	fmt.Println("\n👤 Seeding admin user...")

	// First, ensure the admin tables exist
	createTableQuery := `
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
	`

	_, err := pool.Exec(ctx, createTableQuery)
	if err != nil {
		return fmt.Errorf("failed to create admin tables: %w", err)
	}

	fmt.Println("✓ Admin tables created/verified")

	// Hash password for 'admin123'
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	adminID := uuid.MustParse("a0000000-0000-0000-0000-000000000001")

	// Insert or update admin user
	query := `
		INSERT INTO admin_users (
			id, email, password, name, admin_role, permissions, is_active
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
		ON CONFLICT (id) DO UPDATE SET
			password = $3,
			name = $4,
			admin_role = $5,
			permissions = $6,
			is_active = $7,
			updated_at = NOW()
	`

	_, err = pool.Exec(ctx, query,
		adminID,
		"admin@lpgfinder.com",
		string(hashedPassword),
		"Admin User",
		"super_admin",
		[]string{"*"}, // All permissions
		true,
	)

	if err != nil {
		return fmt.Errorf("failed to seed admin user: %w", err)
	}

	fmt.Println("✓ Admin user created/updated:")
	fmt.Println("  Email: admin@lpgfinder.com")
	fmt.Println("  Password: admin123")
	fmt.Println("  Role: super_admin")

	return nil
}
