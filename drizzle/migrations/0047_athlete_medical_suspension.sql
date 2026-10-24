ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS fermo_medico boolean NOT NULL DEFAULT false;
ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS fermo_medico_fino_al date;
ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS fermo_medico_note text;

CREATE OR REPLACE FUNCTION public.protect_fermo_medico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.fermo_medico := false; NEW.fermo_medico_fino_al := NULL; NEW.fermo_medico_note := NULL;
  ELSE
    NEW.fermo_medico := OLD.fermo_medico; NEW.fermo_medico_fino_al := OLD.fermo_medico_fino_al; NEW.fermo_medico_note := OLD.fermo_medico_note;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_fermo_medico_trigger ON public.atleti;
CREATE TRIGGER protect_fermo_medico_trigger BEFORE INSERT OR UPDATE ON public.atleti FOR EACH ROW EXECUTE FUNCTION public.protect_fermo_medico();

CREATE OR REPLACE FUNCTION public.validate_fermo_medico_iscrizione()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.atleti%ROWTYPE; d date;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.atleta_id = OLD.atleta_id AND NEW.evento_id = OLD.evento_id THEN RETURN NEW; END IF;
  SELECT * INTO a FROM public.atleti WHERE id = NEW.atleta_id;
  SELECT data_evento INTO d FROM public.eventi WHERE id = NEW.evento_id;
  IF a.fermo_medico AND (a.fermo_medico_fino_al IS NULL OR a.fermo_medico_fino_al >= coalesce(d, current_date)) THEN
    RAISE EXCEPTION 'Atleta in fermo medico%: iscrizione non consentita',
      CASE WHEN a.fermo_medico_fino_al IS NULL THEN '' ELSE ' fino al ' || to_char(a.fermo_medico_fino_al, 'DD/MM/YYYY') END;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_fermo_medico_iscrizione_trigger ON public.iscrizioni;
CREATE TRIGGER validate_fermo_medico_iscrizione_trigger BEFORE INSERT OR UPDATE ON public.iscrizioni FOR EACH ROW EXECUTE FUNCTION public.validate_fermo_medico_iscrizione();