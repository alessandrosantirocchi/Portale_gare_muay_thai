ALTER TABLE public.eventi ADD COLUMN IF NOT EXISTS organizzatore_id uuid;

GRANT INSERT, UPDATE, DELETE ON public.eventi TO authenticated;

CREATE POLICY "organizzatore crea i propri eventi"
ON public.eventi FOR INSERT
TO authenticated
WITH CHECK (organizzatore_id = auth.uid());

CREATE POLICY "organizzatore modifica i propri eventi"
ON public.eventi FOR UPDATE
TO authenticated
USING (organizzatore_id = auth.uid())
WITH CHECK (organizzatore_id = auth.uid());

CREATE POLICY "organizzatore elimina i propri eventi"
ON public.eventi FOR DELETE
TO authenticated
USING (organizzatore_id = auth.uid());

CREATE POLICY "organizzatore legge iscrizioni del proprio evento"
ON public.iscrizioni FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = iscrizioni.evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore legge pool del proprio evento"
ON public.pools FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = pools.evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore gestisce pool del proprio evento"
ON public.pools FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore aggiorna pool del proprio evento"
ON public.pools FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = pools.evento_id AND e.organizzatore_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = pools.evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore elimina pool del proprio evento"
ON public.pools FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = pools.evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore legge match del proprio evento"
ON public.match_cards FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = match_cards.evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore gestisce match del proprio evento"
ON public.match_cards FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore aggiorna match del proprio evento"
ON public.match_cards FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = match_cards.evento_id AND e.organizzatore_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = match_cards.evento_id AND e.organizzatore_id = auth.uid()));

CREATE POLICY "organizzatore elimina match del proprio evento"
ON public.match_cards FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.eventi e WHERE e.id = match_cards.evento_id AND e.organizzatore_id = auth.uid()));