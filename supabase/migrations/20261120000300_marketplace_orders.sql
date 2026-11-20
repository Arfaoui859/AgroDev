-- Marketplace order lifecycle created from an accepted buyer/seller inquiry.
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL UNIQUE REFERENCES public.marketplace_inquiries(id) ON DELETE RESTRICT,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  listing_title text NOT NULL CHECK (char_length(btrim(listing_title)) BETWEEN 1 AND 180),
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit text,
  unit_price numeric(14,3) NOT NULL CHECK (unit_price >= 0),
  currency text NOT NULL DEFAULT 'TND' CHECK (currency ~ '^[A-Z]{3}$'),
  buyer_note text CHECK (buyer_note IS NULL OR char_length(buyer_note) <= 1200),
  status text NOT NULL DEFAULT 'awaiting_buyer_confirmation'
    CHECK (status IN ('awaiting_buyer_confirmation','confirmed','processing','ready_for_pickup','completed','cancelled','disputed')),
  seller_confirmed_at timestamptz NOT NULL DEFAULT now(),
  buyer_confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text CHECK (cancellation_reason IS NULL OR char_length(cancellation_reason) <= 500),
  dispute_reason text CHECK (dispute_reason IS NULL OR char_length(dispute_reason) <= 1200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_id <> seller_id)
);

CREATE INDEX IF NOT EXISTS marketplace_orders_buyer_idx
  ON public.marketplace_orders (buyer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_orders_seller_idx
  ON public.marketplace_orders (seller_id, status, created_at DESC);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order participants can read their orders" ON public.marketplace_orders;
CREATE POLICY "Order participants can read their orders"
  ON public.marketplace_orders FOR SELECT TO authenticated
  USING (auth.uid() IN (buyer_id, seller_id));

DROP POLICY IF EXISTS "Sellers can create orders from accepted inquiries" ON public.marketplace_orders;
CREATE POLICY "Sellers can create orders from accepted inquiries"
  ON public.marketplace_orders FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND status = 'awaiting_buyer_confirmation'
    AND EXISTS (
      SELECT 1 FROM public.marketplace_inquiries i
      WHERE i.id = marketplace_orders.inquiry_id
        AND i.listing_id = marketplace_orders.listing_id
        AND i.buyer_id = marketplace_orders.buyer_id AND i.seller_id = auth.uid()
        AND i.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Order participants can update lifecycle" ON public.marketplace_orders;
CREATE POLICY "Order participants can update lifecycle"
  ON public.marketplace_orders FOR UPDATE TO authenticated
  USING (auth.uid() IN (buyer_id, seller_id))
  WITH CHECK (auth.uid() IN (buyer_id, seller_id));

REVOKE ALL ON public.marketplace_orders FROM anon, authenticated;
GRANT SELECT, INSERT ON public.marketplace_orders TO authenticated;
GRANT UPDATE (status, cancellation_reason, dispute_reason, updated_at)
  ON public.marketplace_orders TO authenticated;

-- Enforce role-specific state transitions even if a client bypasses the API.
CREATE OR REPLACE FUNCTION public.enforce_marketplace_order_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.inquiry_id <> OLD.inquiry_id OR NEW.listing_id <> OLD.listing_id
    OR NEW.buyer_id <> OLD.buyer_id OR NEW.seller_id <> OLD.seller_id
    OR NEW.listing_title <> OLD.listing_title OR NEW.quantity <> OLD.quantity
    OR NEW.unit IS DISTINCT FROM OLD.unit OR NEW.unit_price <> OLD.unit_price
    OR NEW.currency <> OLD.currency OR NEW.seller_confirmed_at <> OLD.seller_confirmed_at
    OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'ORDER_SNAPSHOT_IMMUTABLE';
  END IF;

  IF NEW.status = OLD.status THEN
    RAISE EXCEPTION 'ORDER_NOOP_UPDATE';
  END IF;

  IF OLD.status = 'awaiting_buyer_confirmation'
    AND NEW.status = 'confirmed' AND auth.uid() = OLD.buyer_id THEN
    NEW.buyer_confirmed_at := now();
  ELSIF OLD.status = 'confirmed'
    AND NEW.status = 'processing' AND auth.uid() = OLD.seller_id THEN
    NULL;
  ELSIF OLD.status = 'processing'
    AND NEW.status = 'ready_for_pickup' AND auth.uid() = OLD.seller_id THEN
    NULL;
  ELSIF OLD.status = 'ready_for_pickup'
    AND NEW.status = 'completed' AND auth.uid() = OLD.buyer_id THEN
    NEW.completed_at := now();
  ELSIF NEW.status = 'cancelled'
    AND OLD.status IN ('awaiting_buyer_confirmation','confirmed')
    AND auth.uid() IN (OLD.buyer_id, OLD.seller_id) THEN
    NEW.cancelled_at := now();
  ELSIF NEW.status = 'disputed'
    AND OLD.status IN ('confirmed','processing','ready_for_pickup')
    AND auth.uid() IN (OLD.buyer_id, OLD.seller_id) THEN
    IF NEW.dispute_reason IS NULL OR char_length(btrim(NEW.dispute_reason)) < 5 THEN
      RAISE EXCEPTION 'ORDER_DISPUTE_REASON_REQUIRED';
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_ORDER_STATUS_TRANSITION';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_order_transition_guard ON public.marketplace_orders;
CREATE TRIGGER marketplace_order_transition_guard
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_marketplace_order_transition();

GRANT EXECUTE ON FUNCTION public.enforce_marketplace_order_transition() TO authenticated;
