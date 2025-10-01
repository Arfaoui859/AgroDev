-- =====================================================
-- Supabase-Specific Setup for AgroGrowth
-- =====================================================
-- Run this after running cloud-setup.sql

-- =====================================================
-- Storage Buckets
-- =====================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('farm-images', 'farm-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('soil-images', 'soil-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('plant-images', 'plant-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies
-- =====================================================

-- Avatar images policy
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Farm images policy
CREATE POLICY "Farm images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'farm-images');

CREATE POLICY "Farm owners can upload farm images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'farm-images' AND
        EXISTS (
            SELECT 1 FROM farms 
            WHERE id = (storage.foldername(name))[1]::uuid 
            AND owner_id = auth.uid()
        )
    );

-- Soil images policy (private)
CREATE POLICY "Users can view their own soil images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'soil-images' AND
        EXISTS (
            SELECT 1 FROM farms 
            WHERE id = (storage.foldername(name))[1]::uuid 
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload soil images to their farms" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'soil-images' AND
        EXISTS (
            SELECT 1 FROM farms 
            WHERE id = (storage.foldername(name))[1]::uuid 
            AND owner_id = auth.uid()
        )
    );

-- Plant images policy (private)
CREATE POLICY "Users can view their own plant images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'plant-images' AND
        EXISTS (
            SELECT 1 FROM farms 
            WHERE id = (storage.foldername(name))[1]::uuid 
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload plant images to their farms" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'plant-images' AND
        EXISTS (
            SELECT 1 FROM farms 
            WHERE id = (storage.foldername(name))[1]::uuid 
            AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- Enhanced RLS Policies
-- =====================================================

-- User profiles policies
CREATE POLICY "Users can view all public profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Farm sections policies
CREATE POLICY "Users can view sections of their own farms" ON farm_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = farm_sections.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage sections of their own farms" ON farm_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = farm_sections.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- Soil analyses policies
CREATE POLICY "Users can view soil analyses of their own farms" ON soil_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = soil_analyses.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert soil analyses for their own farms" ON soil_analyses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = soil_analyses.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- Crop recommendations policies
CREATE POLICY "Users can view crop recommendations for their own farms" ON crop_recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = crop_recommendations.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert crop recommendations for their own farms" ON crop_recommendations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = crop_recommendations.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- Crop cultivations policies
CREATE POLICY "Users can view cultivations of their own farms" ON crop_cultivations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = crop_cultivations.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage cultivations of their own farms" ON crop_cultivations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = crop_cultivations.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- Disease detections policies
CREATE POLICY "Users can view disease detections of their own farms" ON plant_disease_detections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = plant_disease_detections.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert disease detections for their own farms" ON plant_disease_detections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = plant_disease_detections.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- Sensor devices policies
CREATE POLICY "Users can view sensors of their own farms" ON sensor_devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = sensor_devices.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage sensors of their own farms" ON sensor_devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM farms 
            WHERE farms.id = sensor_devices.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- Sensor readings policies
CREATE POLICY "Users can view sensor readings from their own devices" ON sensor_readings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sensor_devices sd
            JOIN farms f ON f.id = sd.farm_id
            WHERE sd.id = sensor_readings.device_id 
            AND f.owner_id = auth.uid()
        )
    );

-- Weather records policies (allow all users to view weather data)
CREATE POLICY "All users can view weather records" ON weather_records
    FOR SELECT USING (true);

-- Market prices policies (public data)
CREATE POLICY "All users can view market prices" ON market_prices
    FOR SELECT USING (true);

CREATE POLICY "All users can view market predictions" ON market_predictions
    FOR SELECT USING (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- AI service logs policies
CREATE POLICY "Users can view their own AI service logs" ON ai_service_logs
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Real-time Subscriptions Setup
-- =====================================================

-- Enable real-time for important tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE weather_records;
ALTER PUBLICATION supabase_realtime ADD TABLE plant_disease_detections;

-- =====================================================
-- Edge Functions Helpers
-- =====================================================

-- Function to get user's farms for edge functions
CREATE OR REPLACE FUNCTION get_user_farms(user_uuid UUID)
RETURNS TABLE (
    farm_id UUID,
    farm_name TEXT,
    location JSONB,
    size_hectares DECIMAL
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.name, f.location, f.size_hectares
    FROM farms f
    WHERE f.owner_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to validate farm ownership
CREATE OR REPLACE FUNCTION user_owns_farm(user_uuid UUID, farm_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM farms 
        WHERE id = farm_uuid AND owner_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Database Functions for API
-- =====================================================

-- Function to get farm dashboard data
CREATE OR REPLACE FUNCTION get_farm_dashboard(farm_uuid UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    dashboard_data JSONB;
BEGIN
    -- Check if user owns the farm
    IF NOT user_owns_farm(auth.uid(), farm_uuid) THEN
        RAISE EXCEPTION 'Access denied to farm data';
    END IF;

    SELECT jsonb_build_object(
        'farm_info', (
            SELECT jsonb_build_object(
                'id', id,
                'name', name,
                'location', location,
                'size_hectares', size_hectares,
                'soil_type', soil_type
            )
            FROM farms WHERE id = farm_uuid
        ),
        'sections_count', (
            SELECT COUNT(*) FROM farm_sections WHERE farm_id = farm_uuid
        ),
        'active_cultivations', (
            SELECT COUNT(*) FROM crop_cultivations 
            WHERE farm_id = farm_uuid AND status = 'active'
        ),
        'recent_soil_health', (
            SELECT AVG(health_score) FROM soil_analyses 
            WHERE farm_id = farm_uuid AND analyzed_at > NOW() - INTERVAL '30 days'
        ),
        'disease_alerts', (
            SELECT COUNT(*) FROM plant_disease_detections 
            WHERE farm_id = farm_uuid AND detected_at > NOW() - INTERVAL '7 days'
            AND severity_level IN ('high', 'critical')
        ),
        'latest_weather', (
            SELECT jsonb_build_object(
                'temperature', temperature_celsius,
                'humidity', humidity_percent,
                'rainfall', rainfall_mm
            )
            FROM weather_records 
            WHERE farm_id = farm_uuid 
            ORDER BY record_date DESC, record_time DESC 
            LIMIT 1
        )
    ) INTO dashboard_data;

    RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql;

-- Function to add soil analysis
CREATE OR REPLACE FUNCTION add_soil_analysis(
    farm_uuid UUID,
    sensor_data_param JSONB,
    analysis_result_param JSONB DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    analysis_id UUID;
BEGIN
    -- Check if user owns the farm
    IF NOT user_owns_farm(auth.uid(), farm_uuid) THEN
        RAISE EXCEPTION 'Access denied to farm';
    END IF;

    INSERT INTO soil_analyses (
        farm_id, 
        analysis_type, 
        sensor_data, 
        analysis_result,
        ph_level,
        nitrogen_level,
        phosphorus_level,
        potassium_level,
        moisture_percent
    ) VALUES (
        farm_uuid,
        'sensor',
        sensor_data_param,
        analysis_result_param,
        (sensor_data_param->>'ph')::DECIMAL,
        (sensor_data_param->>'nitrogen')::DECIMAL,
        (sensor_data_param->>'phosphorus')::DECIMAL,
        (sensor_data_param->>'potassium')::DECIMAL,
        (sensor_data_param->>'moisture')::DECIMAL
    ) RETURNING id INTO analysis_id;

    RETURN analysis_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Webhook Functions
-- =====================================================

-- Function to handle AI service webhook responses
CREATE OR REPLACE FUNCTION handle_ai_service_response(
    service_type_param VARCHAR,
    request_id_param UUID,
    response_data_param JSONB,
    processing_time_param INTEGER,
    status_code_param INTEGER
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the corresponding analysis record based on service type
    CASE service_type_param
        WHEN 'soil_analysis' THEN
            UPDATE soil_analyses 
            SET analysis_result = response_data_param,
                health_score = (response_data_param->>'health_score')::INTEGER,
                fertility_level = response_data_param->>'fertility_level'
            WHERE id = request_id_param;
            
        WHEN 'crop_recommendation' THEN
            UPDATE crop_recommendations 
            SET recommendations = response_data_param,
                best_crop = response_data_param->'best_recommendation'->>'crop',
                recommendation_confidence = (response_data_param->>'confidence')::DECIMAL
            WHERE id = request_id_param;
            
        WHEN 'disease_detection' THEN
            UPDATE plant_disease_detections 
            SET analysis_result = response_data_param,
                primary_disease = response_data_param->'disease_detection'->'primary_disease'->>'disease',
                disease_confidence = (response_data_param->'disease_detection'->'primary_disease'->>'probability')::DECIMAL,
                severity_level = response_data_param->'severity_assessment'->>'severity_level'
            WHERE id = request_id_param;
    END CASE;

    -- Log the AI service call
    INSERT INTO ai_service_logs (
        service_type, 
        endpoint, 
        response_data, 
        processing_time_ms, 
        status_code
    ) VALUES (
        service_type_param,
        '/' || service_type_param,
        response_data_param,
        processing_time_param,
        status_code_param
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Scheduled Tasks Setup
-- =====================================================

-- Create a table for scheduled tasks (using pg_cron extension if available)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(100) NOT NULL,
    schedule VARCHAR(100) NOT NULL, -- Cron expression
    enabled BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    function_name VARCHAR(255) NOT NULL,
    parameters JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert scheduled tasks
INSERT INTO scheduled_tasks (task_name, schedule, function_name, parameters) VALUES
    ('cleanup_old_data', '0 2 * * 0', 'cleanup_old_data', '{}'),
    ('update_weather_forecasts', '0 */6 * * *', 'update_weather_forecasts', '{}'),
    ('send_disease_alerts', '0 8 * * *', 'send_disease_alerts', '{}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Final Supabase Setup
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Supabase-specific setup completed successfully!';
    RAISE NOTICE 'Storage buckets, policies, and functions are now configured.';
    RAISE NOTICE 'Remember to configure your Supabase project settings:';
    RAISE NOTICE '1. Enable Real-time for selected tables';
    RAISE NOTICE '2. Configure SMTP for email notifications';
    RAISE NOTICE '3. Set up custom domain if needed';
    RAISE NOTICE '4. Configure API rate limiting';
END $$;
