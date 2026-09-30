-- Loghi: lettura limitata alla società proprietaria della cartella o all'admin
drop policy if exists "logos lettura pubblica" on storage.objects;
create policy "logos lettura proprietario o admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'logos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_role(auth.uid(), 'admin')
    )
  );

-- Locandine: SELECT diretto solo per admin; il pubblico vede le locandine
-- pubblicate tramite funzione server che firma l'URL dopo la verifica
-- dell'evento pubblicato
drop policy if exists "locandine pubblicate o admin" on storage.objects;
create policy "locandine admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'locandine' and public.has_role(auth.uid(), 'admin'));