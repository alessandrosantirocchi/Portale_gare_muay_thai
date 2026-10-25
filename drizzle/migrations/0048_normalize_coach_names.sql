CREATE OR REPLACE FUNCTION public.normalize_athlete_names() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.nome := initcap(lower(btrim(NEW.nome)));
  NEW.cognome := initcap(lower(btrim(NEW.cognome)));
  IF NEW.coach IS NOT NULL THEN NEW.coach := NULLIF(initcap(lower(btrim(NEW.coach))), ''); END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_registration_names_and_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.snapshot_nome IS NOT NULL THEN NEW.snapshot_nome := initcap(lower(btrim(NEW.snapshot_nome))); END IF;
  IF NEW.snapshot_cognome IS NOT NULL THEN NEW.snapshot_cognome := initcap(lower(btrim(NEW.snapshot_cognome))); END IF;
  IF NEW.snapshot_coach IS NOT NULL THEN NEW.snapshot_coach := NULLIF(initcap(lower(btrim(NEW.snapshot_coach))), ''); END IF;
  IF TG_OP = 'INSERT' AND auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN NEW.stato := 'confermata'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_profile_coach_names() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.nome_coach IS NOT NULL THEN NEW.nome_coach := NULLIF(initcap(lower(btrim(NEW.nome_coach))), ''); END IF;
  IF NEW.cognome_coach IS NOT NULL THEN NEW.cognome_coach := NULLIF(initcap(lower(btrim(NEW.cognome_coach))), ''); END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS normalize_profile_coach_names_before_write ON public.profiles;
CREATE TRIGGER normalize_profile_coach_names_before_write BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_coach_names();

UPDATE public.atleti SET coach = initcap(lower(btrim(coach))) WHERE coach IS NOT NULL AND coach <> initcap(lower(btrim(coach)));
UPDATE public.iscrizioni SET snapshot_coach = initcap(lower(btrim(snapshot_coach))) WHERE snapshot_coach IS NOT NULL AND snapshot_coach <> initcap(lower(btrim(snapshot_coach)));
UPDATE public.profiles SET nome_coach = nome_coach WHERE nome_coach IS NOT NULL OR cognome_coach IS NOT NULL;