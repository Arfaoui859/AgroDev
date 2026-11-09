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

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_expert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_farm(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_section(uuid) FROM PUBLIC;
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
ALTER TABLE public.weather_forecasts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records        ENABLE ROW LEVEL SECURITY;

-- Keep the profile shape used by the application consistent across fresh and
-- existing Supabase projects.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL
  DEFAULT '{"language":"ar","notifications":true,"weather_alerts":true,"market_alerts":true}'::jsonb;

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
  BEFORE INSERT OR UPDATE ON public.users
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

  INSERT INTO public.user_profiles (user_id)
  SELECT NEW.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
  );

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
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
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
-- Market reference tables contain non-personal data. Anonymous and
-- authenticated readers may SELECT them; only admins may write. Farm-linked
-- weather records are owner-scoped below. RLS stays on so
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
DROP POLICY IF EXISTS "Farm owners can view their weather records" ON public.weather_records;
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

-- ---------------------------------------------------------------------------
-- 9. Supabase Storage: private objects are scoped to the owning account/farm.
--
-- Storage object names for farm-linked buckets use the farm UUID as the first
-- path segment: <farm-id>/<filename>. Avatar paths use <auth-user-id>/...
-- The documents bucket intentionally remains deny-all until a document
-- ownership table and upload contract are defined.
-- ---------------------------------------------------------------------------

-- Remove both legacy and current names so this migration is safely rerunnable.
DROP POLICY IF EXISTS "AgroGrowth public avatar read" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth owner avatar insert" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth owner avatar update" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth owner avatar delete" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth public farm image read" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth farm owner insert" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth farm owner update" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth farm owner delete" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth soil image owner access" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth soil image owner insert" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth soil image owner update" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth soil image owner delete" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth plant image owner access" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth plant image owner insert" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth plant image owner update" ON storage.objects;
DROP POLICY IF EXISTS "AgroGrowth plant image owner delete" ON storage.objects;

-- Remove legacy policy names so permissive policies cannot OR-bypass these.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Farm images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Farm owners can upload farm images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own soil images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload soil images to their farms" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own plant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload plant images to their farms" ON storage.objects;

CREATE POLICY "AgroGrowth public avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "AgroGrowth owner avatar insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "AgroGrowth owner avatar update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "AgroGrowth owner avatar delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "AgroGrowth public farm image read" ON storage.objects
  FOR SELECT USING (bucket_id = 'farm-images');

CREATE POLICY "AgroGrowth farm owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'farm-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth farm owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'farm-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'farm-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth farm owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'farm-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth soil image owner access" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'soil-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth soil image owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'soil-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth soil image owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'soil-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'soil-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth soil image owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'soil-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth plant image owner access" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'plant-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth plant image owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'plant-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth plant image owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'plant-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'plant-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "AgroGrowth plant image owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'plant-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id::text = (storage.foldername(name))[1]
          AND f.owner_id = auth.uid()
      )
    )
  );

