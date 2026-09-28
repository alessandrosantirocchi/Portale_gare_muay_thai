ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_path text;

CREATE POLICY "logos lettura pubblica"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'logos');

CREATE POLICY "societa carica il proprio logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "societa aggiorna il proprio logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "societa elimina il proprio logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);