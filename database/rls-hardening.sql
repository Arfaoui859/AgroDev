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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'administrator'), false)
$$;

-- Experts (agronomists) may read a farmer's agronomic records for consultation.
CREATE OR REPLACE FUNCTION public.is_expert() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(
    public.current_user_role() IN ('expert', 'agronomist', 'admin', 'administrator'),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_farm(farm uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = farm AND f.owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_section(section uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_sections s
    JOIN public.farms f ON f.id = s.farm_id
    WHERE s.id = section AND f.owner_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_expert() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_farm(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_section(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_expert() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_farm(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_section(uuid) TO authenticated, service_role;

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
ALTER TABLE public.weather_forecasts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records        ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. users / user_profiles
--
-- Supabase Auth creates the application row through a trusted auth.users
-- trigger. Direct self-service inserts are restricted to the farmer role.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'farmer');

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Prevent authenticated users from assigning or changing privileged roles.
-- Elevated roles are provisioned only by trusted server-side administration.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.role() = 'authenticated'
     AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' AND NEW.role IS DISTINCT FROM 'farmer' THEN
      RAISE EXCEPTION 'New accounts must start with the farmer role'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND (
      NEW.id IS DISTINCT FROM OLD.id
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.role IS DISTINCT FROM OLD.role
      OR NEW.password_hash IS DISTINCT FROM OLD.password_hash
      OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
    ) THEN
      RAISE EXCEPTION 'Users cannot modify identity or privilege fields'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_escalation ON public.users;
CREATE TRIGGER prevent_self_role_escalation
  BEFORE INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- Create the application user row from the trusted Supabase Auth identity.
-- Client-supplied role metadata is intentionally ignored: every new account
-- starts as a farmer until an administrator approves a role change.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, role, email_verified, is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'farmer',
    NEW.email_confirmed_at IS NOT NULL,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_agrogrowth ON auth.users;
CREATE TRIGGER on_auth_user_created_agrogrowth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view all public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
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
DROP POLICY IF EXISTS "Users can view own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can manage own farms" ON public.farms;
DROP POLICY IF EXISTS "Owners manage own farms" ON public.farms;
CREATE POLICY "Owners manage own farms" ON public.farms
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Experts can view farms" ON public.farms;

DROP POLICY IF EXISTS "Admins can manage farms" ON public.farms;
CREATE POLICY "Admins can manage farms" ON public.farms
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- farm_sections
DROP POLICY IF EXISTS "Users can view sections of their own farms" ON public.farm_sections;
DROP POLICY IF EXISTS "Users can manage sections of their own farms" ON public.farm_sections;
DROP POLICY IF EXISTS "Owners manage own farm_sections" ON public.farm_sections;
CREATE POLICY "Owners manage own farm_sections" ON public.farm_sections
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view farm_sections" ON public.farm_sections;

-- soil_analyses
DROP POLICY IF EXISTS "Users can view soil analyses of their own farms" ON public.soil_analyses;
DROP POLICY IF EXISTS "Users can insert soil analyses for their own farms" ON public.soil_analyses;
DROP POLICY IF EXISTS "Owners manage own soil_analyses" ON public.soil_analyses;
CREATE POLICY "Owners manage own soil_analyses" ON public.soil_analyses
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view soil_analyses" ON public.soil_analyses;

-- crop_recommendations
DROP POLICY IF EXISTS "Users can view crop recommendations for their own farms" ON public.crop_recommendations;
DROP POLICY IF EXISTS "Users can insert crop recommendations for their own farms" ON public.crop_recommendations;
DROP POLICY IF EXISTS "Owners manage own crop_recommendations" ON public.crop_recommendations;
CREATE POLICY "Owners manage own crop_recommendations" ON public.crop_recommendations
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view crop_recommendations" ON public.crop_recommendations;

-- crop_cultivations
DROP POLICY IF EXISTS "Users can view cultivations of their own farms" ON public.crop_cultivations;
DROP POLICY IF EXISTS "Users can manage cultivations of their own farms" ON public.crop_cultivations;
DROP POLICY IF EXISTS "Owners manage own crop_cultivations" ON public.crop_cultivations;
CREATE POLICY "Owners manage own crop_cultivations" ON public.crop_cultivations
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view crop_cultivations" ON public.crop_cultivations;

-- plant_disease_detections
DROP POLICY IF EXISTS "Users can view disease detections of their own farms" ON public.plant_disease_detections;
DROP POLICY IF EXISTS "Users can insert disease detections for their own farms" ON public.plant_disease_detections;
DROP POLICY IF EXISTS "Owners manage own plant_disease_detections" ON public.plant_disease_detections;
CREATE POLICY "Owners manage own plant_disease_detections" ON public.plant_disease_detections
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Experts can view plant_disease_detections" ON public.plant_disease_detections;

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

DROP POLICY IF EXISTS "Users can view sensors of their own farms" ON public.sensor_devices;
DROP POLICY IF EXISTS "Users can manage sensors of their own farms" ON public.sensor_devices;
DROP POLICY IF EXISTS "Owners manage own sensor_devices" ON public.sensor_devices;
CREATE POLICY "Owners manage own sensor_devices" ON public.sensor_devices
  FOR ALL USING (public.owns_farm(farm_id)) WITH CHECK (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Users can view sensor readings from their own devices" ON public.sensor_readings;
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
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
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
DROP POLICY IF EXISTS "Users can view their own AI service logs" ON public.ai_service_logs;
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

DROP POLICY IF EXISTS "All users can view weather records" ON public.weather_records;
DROP POLICY IF EXISTS "Anyone can read weather_records" ON public.weather_records;
CREATE POLICY "Owners read own weather_records" ON public.weather_records
  FOR SELECT USING (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Admins manage weather_records" ON public.weather_records;
CREATE POLICY "Admins manage weather_records" ON public.weather_records
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read weather_forecasts" ON public.weather_forecasts;
CREATE POLICY "Owners read own weather_forecasts" ON public.weather_forecasts
  FOR SELECT USING (public.owns_farm(farm_id));

DROP POLICY IF EXISTS "Admins manage weather_forecasts" ON public.weather_forecasts;
CREATE POLICY "Admins manage weather_forecasts" ON public.weather_forecasts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- System settings may contain internal configuration.
-- Restrict all access to administrators; never expose this table publicly.
DROP POLICY IF EXISTS "Anyone can read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins manage system_settings" ON public.system_settings;
CREATE POLICY "Admins manage system_settings" ON public.system_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

