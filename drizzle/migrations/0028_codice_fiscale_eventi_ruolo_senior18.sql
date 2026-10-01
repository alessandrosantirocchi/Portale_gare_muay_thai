CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome_societa, codice_societa, codice_fiscale, citta, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_societa', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'codice_societa',
    NULLIF(upper(btrim(COALESCE(NEW.raw_user_meta_data->>'codice_fiscale',''))),''),
    NEW.raw_user_meta_data->>'citta',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'societa') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "organizzatore crea i propri eventi" ON public.eventi;
CREATE POLICY "organizzatore crea i propri eventi" ON public.eventi
  FOR INSERT TO authenticated
  WITH CHECK (organizzatore_id = auth.uid() AND public.has_role(auth.uid(), 'organizzatore'));

DROP POLICY IF EXISTS "organizzatore modifica i propri eventi" ON public.eventi;
CREATE POLICY "organizzatore modifica i propri eventi" ON public.eventi
  FOR UPDATE TO authenticated
  USING (organizzatore_id = auth.uid() AND public.has_role(auth.uid(), 'organizzatore'))
  WITH CHECK (organizzatore_id = auth.uid() AND public.has_role(auth.uid(), 'organizzatore'));

DROP POLICY IF EXISTS "organizzatore elimina i propri eventi" ON public.eventi;
CREATE POLICY "organizzatore elimina i propri eventi" ON public.eventi
  FOR DELETE TO authenticated
  USING (organizzatore_id = auth.uid() AND public.has_role(auth.uid(), 'organizzatore'));

CREATE OR REPLACE FUNCTION public.validate_fight_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ DECLARE e public.eventi%ROWTYPE; a public.atleti%ROWTYPE; years integer; BEGIN SELECT * INTO e FROM public.eventi WHERE id = NEW.evento_id; SELECT * INTO a FROM public.atleti WHERE id = NEW.atleta_id; IF e.id IS NULL OR a.id IS NULL THEN RAISE EXCEPTION 'Evento o atleta non trovato'; END IF; IF NEW.societa_id IS DISTINCT FROM a.societa_id THEN RAISE EXCEPTION 'Atleta non appartenente alla società'; END IF; IF NOT public.has_role(auth.uid(), 'admin') THEN IF e.stato NOT IN ('aperto', 'iscrizioni aperte') OR now() > e.fine_iscrizioni OR (e.apertura_iscrizioni IS NOT NULL AND now() < e.apertura_iscrizioni) THEN RAISE EXCEPTION 'Le iscrizioni sono chiuse'; END IF; IF TG_OP = 'UPDATE' AND (NEW.stato IS DISTINCT FROM OLD.stato OR NEW.evento_id IS DISTINCT FROM OLD.evento_id OR NEW.societa_id IS DISTINCT FROM OLD.societa_id OR NEW.atleta_id IS DISTINCT FROM OLD.atleta_id) THEN RAISE EXCEPTION 'Solo un amministratore può cambiare stato o titolarità'; END IF; IF e.limite_partecipanti IS NOT NULL AND TG_OP = 'INSERT' AND (SELECT count(*) FROM public.iscrizioni WHERE evento_id = NEW.evento_id) >= e.limite_partecipanti THEN RAISE EXCEPTION 'Limite partecipanti raggiunto'; END IF; IF e.blocca_certificato_scaduto AND (a.certificato_scadenza IS NULL OR a.certificato_scadenza < e.data_evento OR a.certificato_path IS NULL) THEN RAISE EXCEPTION 'Certificato medico non valido per la data della gara'; END IF; END IF; years := CASE WHEN a.data_nascita IS NULL THEN NULL ELSE extract(year FROM age(e.data_evento, a.data_nascita))::int END; IF NEW.senior_17 AND (years IS NULL OR years NOT IN (17,18)) THEN RAISE EXCEPTION 'L’opzione Senior è riservata agli atleti di 17 o 18 anni'; END IF; IF NEW.senior_17 THEN NEW.snapshot_categoria := 'SENIOR'; END IF; IF TG_OP = 'INSERT' THEN NEW.snapshot_nome := a.nome; NEW.snapshot_cognome := a.cognome; NEW.snapshot_data_nascita := a.data_nascita; NEW.snapshot_sesso := a.sesso; NEW.snapshot_team := a.nome_societa; NEW.snapshot_coach := coalesce(NEW.snapshot_coach, a.coach); NEW.snapshot_peso_kg := coalesce(NEW.snapshot_peso_kg, a.peso_kg); NEW.snapshot_serie := coalesce(NEW.snapshot_serie, a.serie); NEW.snapshot_categoria := coalesce(NEW.snapshot_categoria, a.categoria); NEW.snapshot_totale_match := coalesce(NEW.snapshot_totale_match, a.totale_match, 0); NEW.disciplina := coalesce(NEW.disciplina, a.disciplina); ELSE NEW.snapshot_nome := OLD.snapshot_nome; NEW.snapshot_cognome := OLD.snapshot_cognome; NEW.snapshot_data_nascita := OLD.snapshot_data_nascita; NEW.snapshot_sesso := OLD.snapshot_sesso; NEW.snapshot_team := OLD.snapshot_team; END IF; IF e.discipline_ammesse IS NOT NULL AND NOT (NEW.disciplina = ANY(e.discipline_ammesse)) THEN RAISE EXCEPTION 'Disciplina non ammessa'; END IF; IF e.serie_ammesse IS NOT NULL AND NEW.snapshot_serie IS NOT NULL AND NOT (NEW.snapshot_serie = ANY(e.serie_ammesse)) THEN RAISE EXCEPTION 'Serie non ammessa'; END IF; IF e.categorie_ammesse IS NOT NULL AND NEW.snapshot_categoria IS NOT NULL AND NOT (NEW.snapshot_categoria = ANY(e.categorie_ammesse)) THEN RAISE EXCEPTION 'Categoria non ammessa'; END IF; RETURN NEW; END $function$;

COMMENT ON COLUMN public.profiles.codice_societa IS 'DEPRECATED: sostituito da codice_fiscale';