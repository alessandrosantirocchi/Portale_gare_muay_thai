CREATE OR REPLACE FUNCTION public.assign_ifma_registration_weight() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_date date;
BEGIN
 IF NEW.categoria_peso IS NOT NULL AND btrim(NEW.categoria_peso) <> '' THEN RETURN NEW; END IF;
 SELECT data_evento INTO v_date FROM public.eventi WHERE id = NEW.evento_id;
 NEW.categoria_peso := public.ifma_weight_class(NEW.snapshot_peso_kg, NEW.snapshot_sesso, NEW.snapshot_data_nascita, v_date);
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.sync_peso_atleta_iscrizioni()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.peso_kg IS DISTINCT FROM OLD.peso_kg OR NEW.categoria_peso IS DISTINCT FROM OLD.categoria_peso THEN
    UPDATE public.iscrizioni i
       SET snapshot_peso_kg = NEW.peso_kg,
           categoria_peso = COALESCE(NULLIF(NEW.categoria_peso, ''), i.categoria_peso)
      FROM public.eventi e
     WHERE i.atleta_id = NEW.id AND e.id = i.evento_id
       AND e.fine_iscrizioni > now() AND e.stato IN ('aperto', 'iscrizioni aperte');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sync_peso_atleta_iscrizioni_after_update ON public.atleti;
CREATE TRIGGER sync_peso_atleta_iscrizioni_after_update AFTER UPDATE OF peso_kg, categoria_peso ON public.atleti FOR EACH ROW EXECUTE FUNCTION public.sync_peso_atleta_iscrizioni();