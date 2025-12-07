-- User Preferences Table Migration
-- For storing customer cylinder preferences and settings

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_cylinder_type TEXT, -- '4kg', '6kg', '9kg', '13kg', '16kg'
    preferred_provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    saved_delivery_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Update trigger
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_preferences IS 'Stores user preferences like preferred cylinder type and provider';
