-- Admin Dashboard & Analytics Migration
-- Run this after the main supabase_migration.sql

-- User Preferences Table
-- Stores customer preferences for location and cylinder type
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferred_cylinder_type TEXT CHECK (preferred_cylinder_type IN ('3KG', '5KG', '6KG', '9KG', '12KG', '13KG', '14KG', '15KG', '18KG', '19KG', '20KG', '45KG', '48KG')),
    preferred_latitude DOUBLE PRECISION,
    preferred_longitude DOUBLE PRECISION,
    preferred_address TEXT,
    delivery_radius_km INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_cylinder_type ON user_preferences(preferred_cylinder_type);

-- Provider Status & Management Table
CREATE TABLE IF NOT EXISTS provider_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    avg_rating DOUBLE PRECISION DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue DOUBLE PRECISION DEFAULT 0,
    response_time_minutes INTEGER,
    deactivation_reason TEXT,
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_status_is_active ON provider_status(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_status_is_verified ON provider_status(is_verified);

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    data_type TEXT DEFAULT 'string', -- string, integer, decimal, boolean
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Transaction Fees & Commission Table
CREATE TABLE IF NOT EXISTS transaction_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_type TEXT NOT NULL CHECK (fee_type IN ('platform_commission', 'delivery_fee', 'service_charge', 'transaction_fee')),
    percentage DOUBLE PRECISION DEFAULT 0,
    fixed_amount DOUBLE PRECISION DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_fees_type ON transaction_fees(fee_type);
CREATE INDEX IF NOT EXISTS idx_transaction_fees_active ON transaction_fees(is_active);

-- Daily Analytics Table
CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analytics_date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    total_revenue DOUBLE PRECISION DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    active_providers INTEGER DEFAULT 0,
    active_couriers INTEGER DEFAULT 0,
    active_customers INTEGER DEFAULT 0,
    avg_order_value DOUBLE PRECISION DEFAULT 0,
    avg_delivery_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(analytics_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(analytics_date DESC);

-- Courier Status & Performance Table
CREATE TABLE IF NOT EXISTS courier_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    avg_rating DOUBLE PRECISION DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    total_earnings DOUBLE PRECISION DEFAULT 0,
    avg_delivery_time_minutes INTEGER,
    is_available BOOLEAN DEFAULT false,
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courier_status_is_active ON courier_status(is_active);
CREATE INDEX IF NOT EXISTS idx_courier_status_is_available ON courier_status(is_available);

-- Admin User Accounts Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    admin_role TEXT NOT NULL CHECK (admin_role IN ('super_admin', 'manager', 'analyst', 'support')),
    permissions TEXT[] DEFAULT ARRAY['read:dashboard'],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(admin_role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Provider Metrics Table (for detailed tracking)
CREATE TABLE IF NOT EXISTS provider_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    orders_count INTEGER DEFAULT 0,
    revenue DOUBLE PRECISION DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    avg_rating DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_provider_metrics_provider_id ON provider_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_metrics_date ON provider_metrics(metric_date DESC);

-- Add status column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_status_updated_at BEFORE UPDATE ON provider_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_fees_updated_at BEFORE UPDATE ON transaction_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_analytics_updated_at BEFORE UPDATE ON daily_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courier_status_updated_at BEFORE UPDATE ON courier_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow service role all access on user_preferences" ON user_preferences
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on provider_status" ON provider_status
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on admin_settings" ON admin_settings
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on transaction_fees" ON transaction_fees
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on daily_analytics" ON daily_analytics
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on courier_status" ON courier_status
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on admin_users" ON admin_users
    FOR ALL USING (true);

CREATE POLICY "Allow service role all access on provider_metrics" ON provider_metrics
    FOR ALL USING (true);

-- Create admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
    (SELECT COUNT(*) FROM users WHERE user_type = 'provider' AND is_active = true) as active_providers,
    (SELECT COUNT(*) FROM users WHERE user_type = 'courier' AND is_active = true) as active_couriers,
    (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as total_completed_orders,
    (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'accepted', 'in-transit')) as active_orders,
    (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'delivered') as total_revenue,
    (SELECT COALESCE(AVG(rating), 0) FROM users WHERE user_type = 'provider') as avg_provider_rating;

COMMENT ON TABLE user_preferences IS 'User location and cylinder type preferences for better matching';
COMMENT ON TABLE provider_status IS 'Provider verification, activity status, and performance metrics';
COMMENT ON TABLE admin_settings IS 'Global settings and configuration for the platform';
COMMENT ON TABLE transaction_fees IS 'Commission and fee structure for transactions';
COMMENT ON TABLE daily_analytics IS 'Daily aggregated analytics for dashboard';
COMMENT ON TABLE courier_status IS 'Courier verification, availability, and performance metrics';
COMMENT ON TABLE admin_users IS 'Admin accounts with role-based access control';
COMMENT ON TABLE provider_metrics IS 'Daily provider performance metrics';
