CREATE OR REPLACE FUNCTION public.documenti_iscritti_evento(p_evento_id uuid)
RETURNS TABLE (iscrizione_id uuid, certificato_path text, tessera_path text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, a.certificato_path, a.tessera_path
  FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
  JOIN public.eventi e ON e.id = i.evento_id
  WHERE i.evento_id = p_evento_id
    AND (e.organizzatore_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;
REVOKE ALL ON FUNCTION public.documenti_iscritti_evento(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.documenti_iscritti_evento(uuid) TO authenticated;

CREATE POLICY "organizzatore legge documenti iscritti" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certificati' AND EXISTS (
  SELECT 1 FROM public.iscrizioni i JOIN public.eventi e ON e.id = i.evento_id
  WHERE i.atleta_id::text = split_part(name, '/', 2) AND e.organizzatore_id = auth.uid()));