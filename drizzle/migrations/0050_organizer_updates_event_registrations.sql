CREATE POLICY "organizzatore modifica iscrizioni del proprio evento" ON public.iscrizioni FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = iscrizioni.evento_id AND e.organizzatore_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = iscrizioni.evento_id AND e.organizzatore_id = auth.uid()));