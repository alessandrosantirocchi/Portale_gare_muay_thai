CREATE OR REPLACE FUNCTION public.sync_peso_atleta_iscrizioni()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.peso_kg IS DISTINCT FROM OLD.peso_kg THEN
    UPDATE public.iscrizioni i
       SET snapshot_peso_kg = NEW.peso_kg
      FROM public.eventi e
     WHERE i.atleta_id = NEW.id
       AND e.id = i.evento_id
       AND e.fine_iscrizioni > now()
       AND e.stato IN ('aperto', 'iscrizioni aperte');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sync_peso_atleta_iscrizioni_after_update ON public.atleti;
CREATE TRIGGER sync_peso_atleta_iscrizioni_after_update
AFTER UPDATE OF peso_kg ON public.atleti
FOR EACH ROW EXECUTE FUNCTION public.sync_peso_atleta_iscrizioni();