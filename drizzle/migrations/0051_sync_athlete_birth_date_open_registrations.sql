CREATE OR REPLACE FUNCTION public.sync_nascita_atleta_iscrizioni()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.data_nascita IS DISTINCT FROM OLD.data_nascita THEN
    UPDATE public.iscrizioni i
       SET snapshot_data_nascita = NEW.data_nascita
      FROM public.eventi e
     WHERE i.atleta_id = NEW.id
       AND e.id = i.evento_id
       AND e.fine_iscrizioni > now()
       AND e.stato IN ('aperto', 'iscrizioni aperte');
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.sync_nascita_atleta_iscrizioni() FROM PUBLIC;
CREATE TRIGGER sync_nascita_atleta_iscrizioni_after_update
AFTER UPDATE OF data_nascita ON public.atleti
FOR EACH ROW EXECUTE FUNCTION public.sync_nascita_atleta_iscrizioni();