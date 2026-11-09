-- ============================================================================
-- AgroGrowth — RLS hardening
--
-- database/cloud-setup.sql enables RLS on 9 of 21 tables and defines only 4
-- policies, leaving 7 tables with RLS on and zero policies (deny-all, which
-- silently breaks the app) and 12 tables with RLS off (anonymous read of
-- private rows).
--
-- Verified against a real Postgres 16 instance: as the `anon` role with no JWT,
-- `user_analytics` and `market_prices` were readable; as an authenticated user,
-- `user_profiles` returned 0 rows because no policy existed.
--
-- This migration is idempotent (DROP POLICY IF EXISTS then CREATE) and only
-- adds restrictions/policies. It never drops a table or a column, and never
-- disables RLS.
--
-- Apply with: psql "$DATABASE_URL" -f database/rls-hardening.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Role/ownership helpers.
--
-- These are SECURITY DEFINER so that a policy on `users` can read `users`
-- without triggering Postgres' "infinite recursion detected in policy" error.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'administrator'), false)
$$;

-- Experts (agronomists) may read a farmer's agronomic records for consultation.
CREATE OR REPLACE FUNCTION public.is_expert() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    public.current_user_role() IN ('expert', 'agronomist', 'admin', 'administrator'),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_farm(farm uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = farm AND f.owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_section(section uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_sections s
    JOIN public.farms f ON f.id = s.farm_id
    WHERE s.id = section AND f.owner_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_expert() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_farm(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_section(uuid) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Turn RLS on for every table that lacked it.
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_service_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaf_health_analyses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_predictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_devices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_images            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_data           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records        ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. users / user_profiles
--
-- The client signup path inserts its own row with the publishable key, so an
-- INSERT policy scoped to auth.uid() = id is required.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can view own user_profiles" ON public.user_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can insert own user_profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can update own user_profiles" ON public.user_profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can delete own user_profiles" ON public.user_profiles
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Experts can view user_profiles" ON public.user_profiles;
CREATE POLICY "Experts can view user_profiles" ON public.user_profiles
  FOR SELECT USING (public.is_expert());

DROP POLICY IF EXISTS "Admins can manage user_profiles" ON public.user_profiles;
CREATE POLICY "Admins can manage user_profiles" ON public.user_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Farm-scoped agronomic records.
--
-- Ownership is expressed through farms.owner_id (or farm_sections -> farms) so
-- a farmer can only ever see their own farm's data. Experts get read-only
-- access; admins get full access.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners manage own farms" ON public.farms;
CREATE POLICY "Owners manage own farms" ON public.farms
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Experts can view farms" ON public.farms;
CREATE POLICY "Experts can view farms" ON public.farms
  FOR SELECT USING (public.is_expert());

DROP POLICY IF EXISTS "Admins can manage farms" ON public.farms;
CREATE POLICY "Admins can manage farms" ON public.farms
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- farm_sections
DROP POLICY IF EXISTS "Owners manage own farm_sections" ON public.farm_sections;
CREATE POLICY "Owners manage own farm_sections" ON public.farm_sections
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view farm_sections" ON public.farm_sections;
CREATE POLICY "Experts can view farm_sections" ON public.farm_sections
  FOR SELECT USING (public.is_expert());

-- soil_analyses
DROP POLICY IF EXISTS "Owners manage own soil_analyses" ON public.soil_analyses;
CREATE POLICY "Owners manage own soil_analyses" ON public.soil_analyses
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view soil_analyses" ON public.soil_analyses;
CREATE POLICY "Experts can view soil_analyses" ON public.soil_analyses
  FOR SELECT USING (public.is_expert());

-- crop_recommendations
DROP POLICY IF EXISTS "Owners manage own crop_recommendations" ON public.crop_recommendations;
CREATE POLICY "Owners manage own crop_recommendations" ON public.crop_recommendations
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view crop_recommendations" ON public.crop_recommendations;
CREATE POLICY "Experts can view crop_recommendations" ON public.crop_recommendations
  FOR SELECT USING (public.is_expert());

-- crop_cultivations
DROP POLICY IF EXISTS "Owners manage own crop_cultivations" ON public.crop_cultivations;
CREATE POLICY "Owners manage own crop_cultivations" ON public.crop_cultivations
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view crop_cultivations" ON public.crop_cultivations;
CREATE POLICY "Experts can view crop_cultivations" ON public.crop_cultivations
  FOR SELECT USING (public.is_expert());

-- plant_disease_detections
DROP POLICY IF EXISTS "Owners manage own plant_disease_detections" ON public.plant_disease_detections;
CREATE POLICY "Owners manage own plant_disease_detections" ON public.plant_disease_detections
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view plant_disease_detections" ON public.plant_disease_detections;
CREATE POLICY "Experts can view plant_disease_detections" ON public.plant_disease_detections
  FOR SELECT USING (public.is_expert());

-- ---------------------------------------------------------------------------
-- 5. Child tables whose owner is reached through a parent row.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Owners manage own soil_images" ON public.soil_images;
CREATE POLICY "Owners manage own soil_images" ON public.soil_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.soil_analyses sa
      WHERE sa.id = soil_images.soil_analysis_id AND public.owns_farm(sa.farm_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.soil_analyses sa
      WHERE sa.id = soil_images.soil_analysis_id AND public.owns_farm(sa.farm_id)
    )
  );

DROP POLICY IF EXISTS "Owners manage own leaf_health_analyses" ON public.leaf_health_analyses;
CREATE POLICY "Owners manage own leaf_health_analyses" ON public.leaf_health_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.crop_cultivations cc
      WHERE cc.id = leaf_health_analyses.cultivation_id AND public.owns_farm(cc.farm_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crop_cultivations cc
      WHERE cc.id = leaf_health_analyses.cultivation_id AND public.owns_farm(cc.farm_id)
    )
  );

DROP POLICY IF EXISTS "Owners manage own sensor_devices" ON public.sensor_devices;
CREATE POLICY "Owners manage own sensor_devices" ON public.sensor_devices
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Owners read own sensor_readings" ON public.sensor_readings;
CREATE POLICY "Owners read own sensor_readings" ON public.sensor_readings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sensor_devices sd
      WHERE sd.id = sensor_readings.device_id AND public.owns_farm(sd.farm_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sensor_devices sd
      WHERE sd.id = sensor_readings.device_id AND public.owns_farm(sd.farm_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 6. User-scoped tables (previously RLS-disabled => world readable).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own analytics" ON public.user_analytics;
CREATE POLICY "Users manage own analytics" ON public.user_analytics
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all analytics" ON public.user_analytics;
CREATE POLICY "Admins read all analytics" ON public.user_analytics
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users manage own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push_subscriptions" ON public.push_subscriptions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. AI service logs: a user sees their own calls; admins see everything.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own ai_service_logs" ON public.ai_service_logs;
CREATE POLICY "Users read own ai_service_logs" ON public.ai_service_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own ai_service_logs" ON public.ai_service_logs;
CREATE POLICY "Users insert own ai_service_logs" ON public.ai_service_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage ai_service_logs" ON public.ai_service_logs;
CREATE POLICY "Admins manage ai_service_logs" ON public.ai_service_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Reference / public-read tables.
--
-- These hold non-personal reference or market/weather data. Anonymous and
-- authenticated readers may SELECT them; only admins may write. RLS stays on so
-- the default for any future sensitive table remains "deny".
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read market_prices" ON public.market_prices;
CREATE POLICY "Anyone can read market_prices" ON public.market_prices
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage market_prices" ON public.market_prices;
CREATE POLICY "Admins manage market_prices" ON public.market_prices
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read market_predictions" ON public.market_predictions;
CREATE POLICY "Anyone can read market_predictions" ON public.market_predictions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage market_predictions" ON public.market_predictions;
CREATE POLICY "Admins manage market_predictions" ON public.market_predictions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read weather_records" ON public.weather_records;
CREATE POLICY "Anyone can read weather_records" ON public.weather_records
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage weather_records" ON public.weather_records;
CREATE POLICY "Admins manage weather_records" ON public.weather_records
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read weather_forecasts" ON public.weather_forecasts;
CREATE POLICY "Anyone can read weather_forecasts" ON public.weather_forecasts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage weather_forecasts" ON public.weather_forecasts;
CREATE POLICY "Admins manage weather_forecasts" ON public.weather_forecasts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- System settings may contain internal configuration.
-- Restrict all access to administrators; never expose this table publicly.
DROP POLICY IF EXISTS "Anyone can read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins manage system_settings" ON public.system_settings;
CREATE POLICY "Admins manage system_settings" ON public.system_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- weather_data is farm-scoped (farm_id), so it is owner-managed like the other
-- agronomic records rather than public-read.
DROP POLICY IF EXISTS "Owners manage own weather_data" ON public.weather_data;
CREATE POLICY "Owners manage own weather_data" ON public.weather_data
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view weather_data" ON public.weather_data;
CREATE POLICY "Experts can view weather_data" ON public.weather_data
  FOR SELECT USING (public.is_expert());
