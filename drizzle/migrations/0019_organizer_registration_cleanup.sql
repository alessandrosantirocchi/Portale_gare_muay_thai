CREATE POLICY "organizzatore cancella iscrizioni del proprio evento"
ON public.iscrizioni FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = iscrizioni.evento_id AND e.organizzatore_id = auth.uid()));