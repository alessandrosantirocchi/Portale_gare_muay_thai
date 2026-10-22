ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS tessera_opes text;
ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS tessera_fight1 text;
ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS tessera_stato text NOT NULL DEFAULT 'in_attesa';
ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS tessera_note text;
ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS tessera_verificata_at timestamptz;

CREATE OR REPLACE FUNCTION public.validate_atleta_tessera()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.tessera_opes := NULLIF(btrim(NEW.tessera_opes), '');
  NEW.tessera_fight1 := NULLIF(btrim(NEW.tessera_fight1), '');
  IF NEW.tessera_opes IS NULL AND NEW.tessera_fight1 IS NULL THEN
    RAISE EXCEPTION 'Inserisci almeno un numero di tessera (OPES o Fight 1).';
  END IF;
  IF current_setting('app.verifica_tessera', true) IS DISTINCT FROM 'on' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.tessera_stato := 'in_attesa'; NEW.tessera_note := NULL; NEW.tessera_verificata_at := NULL;
    ELSIF NEW.tessera_opes IS DISTINCT FROM OLD.tessera_opes OR NEW.tessera_fight1 IS DISTINCT FROM OLD.tessera_fight1 THEN
      NEW.tessera_stato := 'in_attesa'; NEW.tessera_note := NULL; NEW.tessera_verificata_at := NULL;
    ELSE
      NEW.tessera_stato := OLD.tessera_stato; NEW.tessera_note := OLD.tessera_note; NEW.tessera_verificata_at := OLD.tessera_verificata_at;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS atleti_validate_tessera ON public.atleti;
CREATE TRIGGER atleti_validate_tessera BEFORE INSERT OR UPDATE ON public.atleti
FOR EACH ROW EXECUTE FUNCTION public.validate_atleta_tessera();

CREATE OR REPLACE FUNCTION public.verifica_tessera_atleta(p_atleta_id uuid, p_stato text, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_stato NOT IN ('in_attesa','verificato','irregolare') THEN RAISE EXCEPTION 'Stato non valido'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.iscrizioni i JOIN public.eventi e ON e.id = i.evento_id
    WHERE i.atleta_id = p_atleta_id AND e.organizzatore_id = auth.uid())) THEN
    RAISE EXCEPTION 'Non autorizzato';
  END IF;
  PERFORM set_config('app.verifica_tessera', 'on', true);
  UPDATE public.atleti SET tessera_stato = p_stato,
    tessera_note = CASE WHEN p_stato = 'irregolare' THEN NULLIF(btrim(p_note), '') ELSE NULL END,
    tessera_verificata_at = CASE WHEN p_stato = 'in_attesa' THEN NULL ELSE now() END
  WHERE id = p_atleta_id;
  PERFORM set_config('app.verifica_tessera', 'off', true);
END $$;
GRANT EXECUTE ON FUNCTION public.verifica_tessera_atleta(uuid, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.documenti_iscritti_evento(uuid);
CREATE FUNCTION public.documenti_iscritti_evento(p_evento_id uuid)
RETURNS TABLE (iscrizione_id uuid, atleta_id uuid, certificato_path text, tessera_path text, tessera_opes text, tessera_fight1 text, tessera_stato text, tessera_note text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, a.id, a.certificato_path, a.tessera_path, a.tessera_opes, a.tessera_fight1, a.tessera_stato, a.tessera_note
  FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
  JOIN public.eventi e ON e.id = i.evento_id
  WHERE i.evento_id = p_evento_id
    AND (e.organizzatore_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;
GRANT EXECUTE ON FUNCTION public.documenti_iscritti_evento(uuid) TO authenticated;