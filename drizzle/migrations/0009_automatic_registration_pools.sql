ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS auto_generato boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.refresh_automatic_pools(p_evento_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_evento_date date;
  v_pool_ids uuid[];
  v_candidate record;
  v_member record;
  v_compatible boolean;
  v_number integer;
  v_selected uuid[] := '{}'::uuid[];
  v_group record;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_evento_id::text, 0));
  DELETE FROM public.pools WHERE evento_id = p_evento_id AND auto_generato;
  SELECT data_evento INTO v_evento_date FROM public.eventi WHERE id = p_evento_id;
  IF v_evento_date IS NULL THEN RETURN; END IF;
  SELECT coalesce(max(numero), 0) INTO v_number FROM public.pools WHERE evento_id = p_evento_id;
  FOR v_group IN
    SELECT upper(btrim(coalesce(i.disciplina, ''))) AS disciplina,
           upper(btrim(coalesce(i.snapshot_serie, a.serie, ''))) AS classe,
           upper(btrim(coalesce(i.snapshot_sesso, a.sesso, ''))) AS sesso
    FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
    WHERE i.evento_id = p_evento_id AND i.stato = 'confermata'
      AND coalesce(i.snapshot_peso_kg, a.peso_kg) IS NOT NULL
      AND coalesce(i.snapshot_data_nascita, a.data_nascita) IS NOT NULL
      AND nullif(btrim(coalesce(i.snapshot_serie, a.serie, '')), '') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.match_cards m WHERE m.evento_id = p_evento_id AND i.id IN (m.rosso_id, m.blu_id))
      AND NOT EXISTS (SELECT 1 FROM public.pools p WHERE p.evento_id = p_evento_id AND NOT p.auto_generato AND i.id = ANY(p.iscrizione_ids))
    GROUP BY 1, 2, 3 ORDER BY 1, 2, 3
  LOOP
    FOR v_candidate IN
      SELECT i.id, i.societa_id, coalesce(i.snapshot_peso_kg, a.peso_kg) AS peso,
             extract(year FROM age(v_evento_date, coalesce(i.snapshot_data_nascita, a.data_nascita)))::integer AS eta
      FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
      WHERE i.evento_id = p_evento_id AND i.stato = 'confermata'
        AND upper(btrim(coalesce(i.disciplina, ''))) = v_group.disciplina
        AND upper(btrim(coalesce(i.snapshot_serie, a.serie, ''))) = v_group.classe
        AND upper(btrim(coalesce(i.snapshot_sesso, a.sesso, ''))) = v_group.sesso
        AND coalesce(i.snapshot_peso_kg, a.peso_kg) IS NOT NULL
        AND coalesce(i.snapshot_data_nascita, a.data_nascita) IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.match_cards m WHERE m.evento_id = p_evento_id AND i.id IN (m.rosso_id, m.blu_id))
        AND NOT EXISTS (SELECT 1 FROM public.pools p WHERE p.evento_id = p_evento_id AND NOT p.auto_generato AND i.id = ANY(p.iscrizione_ids))
      ORDER BY coalesce(i.snapshot_peso_kg, a.peso_kg), coalesce(i.snapshot_data_nascita, a.data_nascita), i.id
    LOOP
      IF v_candidate.id = ANY(v_selected) THEN CONTINUE; END IF;
      v_pool_ids := ARRAY[v_candidate.id];
      FOR v_member IN
        SELECT i.id, i.societa_id, coalesce(i.snapshot_peso_kg, a.peso_kg) AS peso,
               extract(year FROM age(v_evento_date, coalesce(i.snapshot_data_nascita, a.data_nascita)))::integer AS eta
        FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
        WHERE i.evento_id = p_evento_id AND i.stato = 'confermata'
          AND upper(btrim(coalesce(i.disciplina, ''))) = v_group.disciplina
          AND upper(btrim(coalesce(i.snapshot_serie, a.serie, ''))) = v_group.classe
          AND upper(btrim(coalesce(i.snapshot_sesso, a.sesso, ''))) = v_group.sesso
          AND coalesce(i.snapshot_peso_kg, a.peso_kg) IS NOT NULL
          AND coalesce(i.snapshot_data_nascita, a.data_nascita) IS NOT NULL
          AND i.id <> v_candidate.id AND NOT (i.id = ANY(v_selected))
          AND NOT EXISTS (SELECT 1 FROM public.match_cards m WHERE m.evento_id = p_evento_id AND i.id IN (m.rosso_id, m.blu_id))
          AND NOT EXISTS (SELECT 1 FROM public.pools p WHERE p.evento_id = p_evento_id AND NOT p.auto_generato AND i.id = ANY(p.iscrizione_ids))
        ORDER BY abs(coalesce(i.snapshot_peso_kg, a.peso_kg) - v_candidate.peso), i.id
      LOOP
        v_compatible := true;
        FOR v_candidate IN
          SELECT i.societa_id, coalesce(i.snapshot_peso_kg, a.peso_kg) AS peso,
                 extract(year FROM age(v_evento_date, coalesce(i.snapshot_data_nascita, a.data_nascita)))::integer AS eta
          FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
          WHERE i.id = ANY(v_pool_ids)
        LOOP
          IF v_candidate.societa_id = v_member.societa_id OR abs(v_candidate.peso - v_member.peso) > 5 OR abs(v_candidate.eta - v_member.eta) > 2 THEN
            v_compatible := false; EXIT;
          END IF;
        END LOOP;
        IF v_compatible THEN v_pool_ids := array_append(v_pool_ids, v_member.id); END IF;
        EXIT WHEN array_length(v_pool_ids, 1) = 4;
      END LOOP;
      IF array_length(v_pool_ids, 1) >= 2 THEN
        v_number := v_number + 1;
        INSERT INTO public.pools(evento_id, numero, iscrizione_ids, stato, auto_generato)
        VALUES (p_evento_id, v_number, v_pool_ids, 'pubblicato', true);
        v_selected := v_selected || v_pool_ids;
      END IF;
    END LOOP;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.refresh_automatic_pools(uuid) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.refresh_automatic_pools_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_automatic_pools(OLD.evento_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_automatic_pools(NEW.evento_id);
  ELSE
    PERFORM public.refresh_automatic_pools(NEW.evento_id);
    IF OLD.evento_id IS DISTINCT FROM NEW.evento_id THEN PERFORM public.refresh_automatic_pools(OLD.evento_id); END IF;
  END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.refresh_automatic_pools_trigger() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER refresh_automatic_pools_after_registration AFTER INSERT OR UPDATE OR DELETE ON public.iscrizioni FOR EACH ROW EXECUTE FUNCTION public.refresh_automatic_pools_trigger();