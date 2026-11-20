-- Buyer/seller conversation messages for marketplace inquiries.
-- Additive and safe to re-apply; clients can update read receipts only.

CREATE TABLE IF NOT EXISTS public.marketplace_inquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.marketplace_inquiries(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS marketplace_inquiry_messages_thread_idx
  ON public.marketplace_inquiry_messages (inquiry_id, created_at ASC);

ALTER TABLE public.marketplace_inquiry_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inquiry participants can read messages" ON public.marketplace_inquiry_messages;
CREATE POLICY "Inquiry participants can read messages"
  ON public.marketplace_inquiry_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_inquiries i
      WHERE i.id = inquiry_id
        AND auth.uid() IN (i.buyer_id, i.seller_id)
    )
  );

DROP POLICY IF EXISTS "Participants can send inquiry messages" ON public.marketplace_inquiry_messages;
CREATE POLICY "Participants can send inquiry messages"
  ON public.marketplace_inquiry_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_inquiries i
      WHERE i.id = inquiry_id
        AND auth.uid() IN (i.buyer_id, i.seller_id)
        AND i.status NOT IN ('rejected', 'closed')
    )
  );

DROP POLICY IF EXISTS "Recipients can mark inquiry messages read" ON public.marketplace_inquiry_messages;
CREATE POLICY "Recipients can mark inquiry messages read"
  ON public.marketplace_inquiry_messages
  FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_inquiries i
      WHERE i.id = inquiry_id
        AND auth.uid() IN (i.buyer_id, i.seller_id)
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_inquiries i
      WHERE i.id = inquiry_id
        AND auth.uid() IN (i.buyer_id, i.seller_id)
    )
  );

REVOKE UPDATE ON public.marketplace_inquiry_messages FROM authenticated;
GRANT SELECT, INSERT ON public.marketplace_inquiry_messages TO authenticated;
GRANT UPDATE (read_at) ON public.marketplace_inquiry_messages TO authenticated;
