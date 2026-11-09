-- Private evidence storage and owner-scoped access for the assistant's disease records.
-- Apply once in the Supabase SQL editor before deploying the assistant image-save workflow.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agrogrowth-disease-evidence',
  'agrogrowth-disease-evidence',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

ALTER TABLE public.plant_disease_detections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assistant_disease_records_owner_select" ON public.plant_disease_detections;
CREATE POLICY "assistant_disease_records_owner_select"
ON public.plant_disease_detections
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = plant_disease_detections.farm_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "assistant_disease_records_owner_insert" ON public.plant_disease_detections;
CREATE POLICY "assistant_disease_records_owner_insert"
ON public.plant_disease_detections
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = plant_disease_detections.farm_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "assistant_disease_records_owner_update" ON public.plant_disease_detections;
CREATE POLICY "assistant_disease_records_owner_update"
ON public.plant_disease_detections
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = plant_disease_detections.farm_id
      AND f.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = plant_disease_detections.farm_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "assistant_disease_records_owner_delete" ON public.plant_disease_detections;
CREATE POLICY "assistant_disease_records_owner_delete"
ON public.plant_disease_detections
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = plant_disease_detections.farm_id
      AND f.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "assistant_disease_evidence_owner_select" ON storage.objects;
CREATE POLICY "assistant_disease_evidence_owner_select"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'agrogrowth-disease-evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Uploads are performed server-side with the service role after farm ownership is checked.
-- No client-side INSERT policy is intentionally granted for this private evidence bucket.

GRANT SELECT ON public.plant_disease_detections TO authenticated;
