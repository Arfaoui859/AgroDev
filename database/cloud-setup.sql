-- =====================================================
-- AgroGrowth Cloud Database Setup Script
-- =====================================================
-- Execute this script in your cloud database (Supabase/Neon)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- User Management Tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'farmer',
    language_preference VARCHAR(5) DEFAULT 'ar',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio TEXT,
    location JSONB,
    experience_years INTEGER,
    farming_specializations TEXT[],
    farm_size_hectares DECIMAL(10,2),
    preferred_crops TEXT[],
    contact_preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Farm Management Tables
-- =====================================================

-- Farms
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location JSONB NOT NULL, -- {lat, lng, address, region, country}
    size_hectares DECIMAL(10,2) NOT NULL,
    soil_type VARCHAR(100),
    climate_zone VARCHAR(100),
    elevation_meters INTEGER,
    water_source VARCHAR(100),
    irrigation_type VARCHAR(100),
    organic_certified BOOLEAN DEFAULT false,
    established_date DATE,
    farm_image_url TEXT,
    boundaries JSONB, -- GeoJSON polygon
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Farm sections/plots
CREATE TABLE IF NOT EXISTS farm_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    area_hectares DECIMAL(8,2) NOT NULL,
    soil_type VARCHAR(100),
    current_crop VARCHAR(100),
    planted_date DATE,
    expected_harvest_date DATE,
    section_boundaries JSONB, -- GeoJSON polygon
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Soil Analysis Tables
-- =====================================================

-- Soil analysis records
CREATE TABLE IF NOT EXISTS soil_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES farm_sections(id) ON DELETE SET NULL,
    analysis_type VARCHAR(50) NOT NULL, -- 'sensor', 'lab', 'image'
    sensor_data JSONB NOT NULL, -- Raw sensor measurements
    analysis_result JSONB, -- AI analysis results
    recommendations JSONB, -- AI recommendations
    ph_level DECIMAL(3,2),
    nitrogen_level DECIMAL(8,2),
    phosphorus_level DECIMAL(8,2),
    potassium_level DECIMAL(8,2),
    organic_matter_percent DECIMAL(5,2),
    moisture_percent DECIMAL(5,2),
    temperature_celsius DECIMAL(5,2),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    fertility_level VARCHAR(50),
    location JSONB, -- Specific location within farm
    sample_depth_cm INTEGER,
    weather_conditions JSONB,
    analyzed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Soil images for analysis
CREATE TABLE IF NOT EXISTS soil_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    soil_analysis_id UUID REFERENCES soil_analyses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50), -- 'surface', 'core', 'microscopic'
    analysis_result JSONB, -- AI image analysis results
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Crop Management Tables
-- =====================================================

-- Crop recommendations
CREATE TABLE IF NOT EXISTS crop_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES farm_sections(id) ON DELETE SET NULL,
    input_data JSONB NOT NULL, -- Climate, soil, economic factors
    recommendations JSONB NOT NULL, -- AI recommendations
    best_crop VARCHAR(100),
    predicted_yield DECIMAL(10,2),
    estimated_profit DECIMAL(12,2),
    risk_assessment JSONB,
    seasonal_advice JSONB,
    recommendation_confidence DECIMAL(3,2),
    valid_until DATE,
    applied BOOLEAN DEFAULT false,
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crop cultivation records
CREATE TABLE IF NOT EXISTS crop_cultivations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES farm_sections(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL,
    crop_variety VARCHAR(100),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_hectares DECIMAL(8,2) NOT NULL,
    seed_quantity DECIMAL(10,2),
    seed_cost DECIMAL(10,2),
    irrigation_method VARCHAR(100),
    fertilizer_plan JSONB,
    pesticide_plan JSONB,
    current_growth_stage VARCHAR(100),
    estimated_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2),
    quality_grade VARCHAR(20),
    total_cost DECIMAL(12,2),
    revenue DECIMAL(12,2),
    profit DECIMAL(12,2),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, harvested, failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Disease & Pest Management Tables
-- =====================================================

-- Plant disease detections
CREATE TABLE IF NOT EXISTS plant_disease_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cultivation_id UUID REFERENCES crop_cultivations(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    detection_method VARCHAR(50) NOT NULL, -- 'image_ai', 'visual_inspection', 'lab_test'
    plant_type VARCHAR(100),
    growth_stage VARCHAR(100),
    image_url TEXT,
    analysis_result JSONB NOT NULL, -- AI analysis results
    primary_disease VARCHAR(100),
    disease_confidence DECIMAL(3,2),
    severity_level VARCHAR(50),
    affected_area_percentage DECIMAL(5,2),
    treatment_plan JSONB,
    treatment_applied BOOLEAN DEFAULT false,
    treatment_applied_at TIMESTAMP,
    treatment_cost DECIMAL(10,2),
    recovery_status VARCHAR(50), -- 'pending', 'improving', 'recovered', 'failed'
    location JSONB, -- Specific location in field
    detected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leaf health analyses
CREATE TABLE IF NOT EXISTS leaf_health_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cultivation_id UUID REFERENCES crop_cultivations(id) ON DELETE CASCADE,
    plant_type VARCHAR(100),
    growth_stage VARCHAR(100),
    image_url TEXT NOT NULL,
    analysis_result JSONB NOT NULL, -- AI analysis results
    nutrition_deficiency VARCHAR(100),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    quality_grade VARCHAR(20),
    recommendations JSONB,
    analyzed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Market Intelligence Tables
-- =====================================================

-- Market prices tracking
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    quality_grade VARCHAR(20),
    market_location VARCHAR(255) NOT NULL,
    price_per_kg DECIMAL(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TND',
    price_date DATE NOT NULL,
    supply_level VARCHAR(50), -- 'low', 'medium', 'high'
    demand_level VARCHAR(50),
    seasonal_factor DECIMAL(3,2),
    weather_impact JSONB,
    source VARCHAR(100), -- Data source
    created_at TIMESTAMP DEFAULT NOW()
);

-- Market predictions
CREATE TABLE IF NOT EXISTS market_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name VARCHAR(100) NOT NULL,
    prediction_period VARCHAR(50), -- 'weekly', 'monthly', 'seasonal'
    prediction_data JSONB NOT NULL, -- AI predictions
    predicted_price_range JSONB, -- {min, max, average}
    confidence_level DECIMAL(3,2),
    influencing_factors JSONB,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- IoT Sensors & Monitoring Tables
-- =====================================================

-- Sensor devices
CREATE TABLE IF NOT EXISTS sensor_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES farm_sections(id) ON DELETE SET NULL,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_type VARCHAR(100) NOT NULL, -- 'soil_sensor', 'weather_station', 'camera'
    device_model VARCHAR(100),
    location JSONB NOT NULL, -- Installation location
    installation_date DATE,
    last_maintenance_date DATE,
    battery_level INTEGER,
    signal_strength INTEGER,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance
    configuration JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES sensor_devices(id) ON DELETE CASCADE,
    reading_type VARCHAR(100) NOT NULL,
    value DECIMAL(12,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quality_indicator VARCHAR(20), -- 'good', 'fair', 'poor'
    metadata JSONB, -- Additional reading context
    recorded_at TIMESTAMP NOT NULL,
    received_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Weather Data Tables
-- =====================================================

-- Weather records
CREATE TABLE IF NOT EXISTS weather_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    location JSONB NOT NULL,
    temperature_celsius DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    rainfall_mm DECIMAL(8,2),
    wind_speed_kmh DECIMAL(6,2),
    wind_direction INTEGER, -- degrees
    pressure_hpa DECIMAL(7,2),
    uv_index DECIMAL(3,1),
    cloud_cover_percent DECIMAL(5,2),
    weather_conditions VARCHAR(100),
    visibility_km DECIMAL(5,2),
    record_date DATE NOT NULL,
    record_time TIME,
    source VARCHAR(100), -- API source
    created_at TIMESTAMP DEFAULT NOW()
);

-- Weather forecasts
CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecast_period VARCHAR(50), -- 'hourly', 'daily', 'weekly'
    forecast_data JSONB NOT NULL,
    accuracy_score DECIMAL(3,2),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- AI Service Logs & Analytics
-- =====================================================

-- AI service calls log
CREATE TABLE IF NOT EXISTS ai_service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL, -- 'soil_analysis', 'crop_recommendation', etc.
    endpoint VARCHAR(255) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    processing_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    model_version VARCHAR(50),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User analytics
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    platform VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Notifications & Communication
-- =====================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'disease_alert', 'weather_warning', 'harvest_reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    category VARCHAR(100),
    action_url TEXT,
    metadata JSONB,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL, -- p256dh and auth keys
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- System Configuration
-- =====================================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Farm indexes
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_location ON farms USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_farm_sections_farm_id ON farm_sections(farm_id);

-- Soil analysis indexes
CREATE INDEX IF NOT EXISTS idx_soil_analyses_farm_id ON soil_analyses(farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_analyses_analyzed_at ON soil_analyses(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_soil_analyses_location ON soil_analyses USING GIN(location);

-- Crop indexes
CREATE INDEX IF NOT EXISTS idx_crop_recommendations_farm_id ON crop_recommendations(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_cultivations_farm_id ON crop_cultivations(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_cultivations_crop_name ON crop_cultivations(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_cultivations_status ON crop_cultivations(status);

-- Disease detection indexes
CREATE INDEX IF NOT EXISTS idx_disease_detections_farm_id ON plant_disease_detections(farm_id);
CREATE INDEX IF NOT EXISTS idx_disease_detections_detected_at ON plant_disease_detections(detected_at);
CREATE INDEX IF NOT EXISTS idx_leaf_analyses_cultivation_id ON leaf_health_analyses(cultivation_id);

-- Market indexes
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_name ON market_prices(crop_name);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_market_predictions_crop_name ON market_predictions(crop_name);

-- Sensor indexes
CREATE INDEX IF NOT EXISTS idx_sensor_devices_farm_id ON sensor_devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings(recorded_at);

-- Weather indexes
CREATE INDEX IF NOT EXISTS idx_weather_records_farm_id ON weather_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_records_date ON weather_records(record_date);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_ai_service_logs_user_id ON ai_service_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_service_logs_service_type ON ai_service_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_ai_service_logs_created_at ON ai_service_logs(created_at);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- Row Level Security (RLS) - Supabase
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_cultivations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_disease_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (can be customized based on requirements)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own farms" ON farms
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own farms" ON farms
    FOR ALL USING (auth.uid() = owner_id);

-- =====================================================
-- Sample Data (Optional)
-- =====================================================

-- Insert sample system settings
INSERT INTO system_settings (key, value, description, category) VALUES
    ('app_version', '"1.0.0"', 'Current application version', 'system'),
    ('maintenance_mode', 'false', 'System maintenance mode', 'system'),
    ('ai_services_enabled', 'true', 'Enable AI services', 'features'),
    ('default_language', '"ar"', 'Default system language', 'localization'),
    ('max_file_size_mb', '10', 'Maximum file upload size in MB', 'uploads'),
    ('weather_api_update_interval', '3600', 'Weather data update interval in seconds', 'external_apis')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- Farm overview view
CREATE OR REPLACE VIEW farm_overview AS
SELECT 
    f.id,
    f.name,
    f.location,
    f.size_hectares,
    f.owner_id,
    u.full_name as owner_name,
    COUNT(DISTINCT fs.id) as sections_count,
    COUNT(DISTINCT cc.id) as active_cultivations,
    AVG(sa.health_score) as avg_soil_health,
    f.created_at
FROM farms f
LEFT JOIN users u ON f.owner_id = u.id
LEFT JOIN farm_sections fs ON f.id = fs.farm_id
LEFT JOIN crop_cultivations cc ON f.id = cc.farm_id AND cc.status = 'active'
LEFT JOIN soil_analyses sa ON f.id = sa.farm_id AND sa.analyzed_at > NOW() - INTERVAL '30 days'
GROUP BY f.id, f.name, f.location, f.size_hectares, f.owner_id, u.full_name, f.created_at;

-- Recent AI service usage view
CREATE OR REPLACE VIEW recent_ai_usage AS
SELECT 
    service_type,
    COUNT(*) as usage_count,
    AVG(processing_time_ms) as avg_processing_time,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN status_code = 200 THEN 1 END) as success_count,
    COUNT(CASE WHEN status_code != 200 THEN 1 END) as error_count
FROM ai_service_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY service_type;

-- =====================================================
-- Functions for Common Operations
-- =====================================================

-- Function to get farm statistics
CREATE OR REPLACE FUNCTION get_farm_statistics(farm_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_area', COALESCE(SUM(area_hectares), 0),
        'active_sections', COUNT(CASE WHEN current_crop IS NOT NULL THEN 1 END),
        'total_sections', COUNT(*),
        'soil_health_avg', (
            SELECT AVG(health_score) 
            FROM soil_analyses 
            WHERE farm_id = farm_uuid 
            AND analyzed_at > NOW() - INTERVAL '30 days'
        )
    ) INTO result
    FROM farm_sections
    WHERE farm_id = farm_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to log AI service calls
CREATE OR REPLACE FUNCTION log_ai_service_call(
    p_user_id UUID,
    p_service_type VARCHAR,
    p_endpoint VARCHAR,
    p_request_data JSONB,
    p_response_data JSONB,
    p_processing_time INTEGER,
    p_status_code INTEGER,
    p_confidence_score DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO ai_service_logs (
        user_id, service_type, endpoint, request_data, response_data,
        processing_time_ms, status_code, confidence_score
    ) VALUES (
        p_user_id, p_service_type, p_endpoint, p_request_data, p_response_data,
        p_processing_time, p_status_code, p_confidence_score
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Cleanup and Maintenance
-- =====================================================

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Delete old sensor readings (older than 1 year)
    DELETE FROM sensor_readings WHERE recorded_at < NOW() - INTERVAL '1 year';
    
    -- Delete old AI service logs (older than 6 months)
    DELETE FROM ai_service_logs WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Delete old user analytics (older than 3 months)
    DELETE FROM user_analytics WHERE created_at < NOW() - INTERVAL '3 months';
    
    -- Delete read notifications older than 30 days
    DELETE FROM notifications WHERE read_at IS NOT NULL AND read_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers for Automatic Updates
-- =====================================================

-- Trigger function to update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_sections_updated_at BEFORE UPDATE ON farm_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crop_cultivations_updated_at BEFORE UPDATE ON crop_cultivations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Final Setup Message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'AgroGrowth database setup completed successfully!';
    RAISE NOTICE 'Tables created: %, Indexes: %, Views: %, Functions: %', 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
        (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'),
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION');
END $$;
