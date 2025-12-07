-- LPG Delivery System - Supabase Migration Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    rating INTEGER DEFAULT 0,
    user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'provider', 'courier')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    expo_push_token TEXT DEFAULT '',
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_time TIMESTAMPTZ,
    supabase_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    courier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'delivered', 'in-transit')) DEFAULT 'pending',
    cylinder_type TEXT NOT NULL CHECK (cylinder_type IN ('3KG', '5KG', '6KG', '9KG', '12KG', '13KG', '14KG', '15KG', '18KG', '19KG', '20KG', '45KG', '48KG')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit DOUBLE PRECISION NOT NULL,
    total_price DOUBLE PRECISION NOT NULL,
    delivery_fee DOUBLE PRECISION DEFAULT 0,
    service_charge DOUBLE PRECISION DEFAULT 0,
    grand_total DOUBLE PRECISION NOT NULL,
    delivery_address TEXT,
    delivery_method TEXT,
    payment_method TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    current_address TEXT,
    ride_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_id ON orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    provider TEXT NOT NULL,
    phone_number TEXT,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Cylinder pricing table
CREATE TABLE IF NOT EXISTS cylinder_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cylinder_type TEXT NOT NULL CHECK (cylinder_type IN ('3KG', '5KG', '6KG', '9KG', '12KG', '13KG', '14KG', '15KG', '18KG', '19KG', '20KG', '45KG', '48KG')),
    refill_price DOUBLE PRECISION NOT NULL,
    buy_price DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, cylinder_type)
);

-- Create indexes for cylinder pricing
CREATE INDEX IF NOT EXISTS idx_cylinder_pricing_provider ON cylinder_pricing(provider_id);
CREATE INDEX IF NOT EXISTS idx_cylinder_pricing_type ON cylinder_pricing(cylinder_type);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cylinder_type TEXT NOT NULL CHECK (cylinder_type IN ('3KG', '5KG', '6KG', '9KG', '12KG', '13KG', '14KG', '15KG', '18KG', '19KG', '20KG', '45KG', '48KG')),
    stock INTEGER NOT NULL DEFAULT 0,
    price DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, cylinder_type)
);

-- Create indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_provider ON inventory(provider_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(stock);

-- Provider images table (for storing base64/URL images)
CREATE TABLE IF NOT EXISTS provider_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id)
);

-- Location tracking table (optional - for historical tracking)
CREATE TABLE IF NOT EXISTS location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_history_user ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_created ON location_history(created_at DESC);

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cylinder_pricing_updated_at BEFORE UPDATE ON cylinder_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_images_updated_at BEFORE UPDATE ON provider_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cylinder_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow service role to bypass RLS
-- For now, we'll allow all operations for authenticated users
-- You can make these more restrictive based on your needs

-- Users policies
CREATE POLICY "Allow service role all access on users" ON users
    FOR ALL USING (true);

-- Orders policies
CREATE POLICY "Allow service role all access on orders" ON orders
    FOR ALL USING (true);

-- Payments policies
CREATE POLICY "Allow service role all access on payments" ON payments
    FOR ALL USING (true);

-- Cylinder pricing policies
CREATE POLICY "Allow service role all access on cylinder_pricing" ON cylinder_pricing
    FOR ALL USING (true);

-- Inventory policies
CREATE POLICY "Allow service role all access on inventory" ON inventory
    FOR ALL USING (true);

-- Provider images policies
CREATE POLICY "Allow service role all access on provider_images" ON provider_images
    FOR ALL USING (true);

-- Location history policies
CREATE POLICY "Allow service role all access on location_history" ON location_history
    FOR ALL USING (true);

-- Create a view for providers with their location
CREATE OR REPLACE VIEW providers_with_location AS
SELECT
    id,
    name,
    email,
    phone_number,
    rating,
    latitude,
    longitude,
    expo_push_token,
    created_at,
    updated_at
FROM users
WHERE user_type = 'provider';

-- Create a view for orders with user details
CREATE OR REPLACE VIEW orders_with_details AS
SELECT
    o.id,
    o.user_id,
    u.name as user_name,
    u.phone_number as user_phone,
    o.provider_id,
    p.name as provider_name,
    o.courier_id,
    c.name as courier_name,
    o.status,
    o.cylinder_type,
    o.quantity,
    o.price_per_unit,
    o.total_price,
    o.delivery_fee,
    o.service_charge,
    o.grand_total,
    o.delivery_address,
    o.payment_method,
    o.payment_status,
    o.current_latitude,
    o.current_longitude,
    o.created_at,
    o.updated_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN users p ON o.provider_id = p.id
LEFT JOIN users c ON o.courier_id = c.id;

COMMENT ON TABLE users IS 'Users table storing customers, providers, and couriers';
COMMENT ON TABLE orders IS 'Orders table for LPG cylinder orders';
COMMENT ON TABLE payments IS 'Payments table for tracking payment transactions via PawaPay';
COMMENT ON TABLE cylinder_pricing IS 'Provider-specific pricing for different cylinder types';
COMMENT ON TABLE inventory IS 'Inventory management for providers';
COMMENT ON TABLE provider_images IS 'Profile images for providers';
