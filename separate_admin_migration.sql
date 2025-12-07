-- Separate Admin Users Table Migration
-- This creates a standalone admin_users table independent from regular users

-- Drop the old admin_users table that referenced users
DROP TABLE IF EXISTS admin_users CASCADE;

-- Create standalone admin_users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- bcrypt hashed password
    name TEXT NOT NULL,
    admin_role TEXT NOT NULL CHECK (admin_role IN ('super_admin', 'manager', 'analyst', 'support')),
    permissions TEXT[] DEFAULT ARRAY['read:dashboard'],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(admin_role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Admin activity log table
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT, -- e.g., 'user', 'provider', 'order'
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_created_at ON admin_activity_log(created_at DESC);

-- Update trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow service role all access on admin_users" ON admin_users
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on admin_activity_log" ON admin_activity_log
    FOR ALL USING (true);

