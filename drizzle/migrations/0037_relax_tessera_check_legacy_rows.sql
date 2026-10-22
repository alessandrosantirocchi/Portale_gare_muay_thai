CREATE OR REPLACE FUNCTION public.validate_atleta_tessera()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.tessera_opes := NULLIF(btrim(NEW.tessera_opes), '');
  NEW.tessera_fight1 := NULLIF(btrim(NEW.tessera_fight1), '');
  IF NEW.tessera_opes IS NULL AND NEW.tessera_fight1 IS NULL
     AND (TG_OP = 'INSERT' OR OLD.tessera_opes IS NOT NULL OR OLD.tessera_fight1 IS NOT NULL) THEN
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