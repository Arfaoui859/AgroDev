-- AgroVibe marketplace: buy requests, seller trust, favorites, reports and promotion workflow.
-- Additive only. Paid checkout is intentionally not enabled by this migration.

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS trade_type text NOT NULL DEFAULT 'sell'
    CHECK (trade_type IN ('sell','buy'));

CREATE INDEX IF NOT EXISTS marketplace_listings_trade_public_idx
  ON public.marketplace_listings (trade_type, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketplace_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own marketplace favorites" ON public.marketplace_favorites;
CREATE POLICY "Users manage own marketplace favorites" ON public.marketplace_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, DELETE ON public.marketplace_favorites TO authenticated;

CREATE TABLE IF NOT EXISTS public.marketplace_seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inquiry_id uuid NOT NULL UNIQUE REFERENCES public.marketplace_inquiries(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text CHECK (review IS NULL OR char_length(review) <= 1200),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reviewer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS marketplace_seller_reviews_seller_idx
  ON public.marketplace_seller_reviews (seller_id, created_at DESC) WHERE status = 'published';
ALTER TABLE public.marketplace_seller_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published seller reviews" ON public.marketplace_seller_reviews;
CREATE POLICY "Public can read published seller reviews" ON public.marketplace_seller_reviews
  FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Reviewers can create own seller reviews" ON public.marketplace_seller_reviews;
CREATE POLICY "Reviewers can create own seller reviews" ON public.marketplace_seller_reviews
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());
GRANT SELECT, INSERT ON public.marketplace_seller_reviews TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.marketplace_listing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','fraud','misleading','prohibited_item','unsafe','other')),
  details text CHECK (details IS NULL OR char_length(details) <= 1200),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS marketplace_listing_reports_queue_idx
  ON public.marketplace_listing_reports (status, created_at ASC);
ALTER TABLE public.marketplace_listing_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can submit own listing reports" ON public.marketplace_listing_reports;
CREATE POLICY "Users can submit own listing reports" ON public.marketplace_listing_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS "Users can read own listing reports" ON public.marketplace_listing_reports;
CREATE POLICY "Users can read own listing reports" ON public.marketplace_listing_reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());
GRANT INSERT, SELECT ON public.marketplace_listing_reports TO authenticated;

CREATE TABLE IF NOT EXISTS public.marketplace_seller_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL CHECK (char_length(btrim(business_name)) BETWEEN 2 AND 180),
  registration_number text,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','verified','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(evidence_urls) BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS marketplace_seller_verifications_queue_idx
  ON public.marketplace_seller_verifications (status, created_at ASC);
ALTER TABLE public.marketplace_seller_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can read own verification requests" ON public.marketplace_seller_verifications;
CREATE POLICY "Sellers can read own verification requests" ON public.marketplace_seller_verifications
  FOR SELECT TO authenticated USING (seller_id = auth.uid());
DROP POLICY IF EXISTS "Sellers can submit verification requests" ON public.marketplace_seller_verifications;
CREATE POLICY "Sellers can submit verification requests" ON public.marketplace_seller_verifications
  FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND status = 'pending_review');
GRANT SELECT, INSERT ON public.marketplace_seller_verifications TO authenticated;

CREATE TABLE IF NOT EXISTS public.marketplace_listing_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_type text NOT NULL CHECK (promotion_type IN ('urgent','featured','premium')),
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','active','expired','rejected')),
  payment_status text NOT NULL DEFAULT 'not_configured' CHECK (payment_status IN ('not_configured','pending','paid','refunded')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS marketplace_listing_promotions_active_idx
  ON public.marketplace_listing_promotions (ends_at DESC) WHERE status = 'active';
ALTER TABLE public.marketplace_listing_promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers can read own promotion requests" ON public.marketplace_listing_promotions;
CREATE POLICY "Sellers can read own promotion requests" ON public.marketplace_listing_promotions
  FOR SELECT TO authenticated USING (seller_id = auth.uid());
DROP POLICY IF EXISTS "Sellers can request listing promotions" ON public.marketplace_listing_promotions;
CREATE POLICY "Sellers can request listing promotions" ON public.marketplace_listing_promotions
  FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND status = 'pending_review' AND payment_status = 'not_configured');
GRANT SELECT, INSERT ON public.marketplace_listing_promotions TO authenticated;

-- No client can grant verification, activate promotions, or moderate reports.
-- Those privileged transitions must use the server service-role client after admin authorization.
