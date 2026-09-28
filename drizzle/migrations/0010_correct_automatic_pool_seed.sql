CREATE OR REPLACE FUNCTION public.refresh_automatic_pools(p_evento_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_date date;
  v_seed record;
  v_other record;
  v_existing record;
  v_group record;
  v_ids uuid[];
  v_used uuid[] := '{}'::uuid[];
  v_ok boolean;
  v_number integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_evento_id::text, 0));
  DELETE FROM public.pools WHERE evento_id = p_evento_id AND auto_generato;
  SELECT data_evento INTO v_date FROM public.eventi WHERE id = p_evento_id;
  IF v_date IS NULL THEN RETURN; END IF;
  SELECT coalesce(max(numero), 0) INTO v_number FROM public.pools WHERE evento_id = p_evento_id;
  FOR v_group IN
    SELECT upper(btrim(coalesce(i.disciplina, ''))) AS sport,
      upper(btrim(coalesce(i.snapshot_serie, a.serie, ''))) AS class,
      upper(btrim(coalesce(i.snapshot_sesso, a.sesso, ''))) AS sex
    FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
    WHERE i.evento_id = p_evento_id AND i.stato = 'confermata'
      AND coalesce(i.snapshot_peso_kg, a.peso_kg) IS NOT NULL
      AND coalesce(i.snapshot_data_nascita, a.data_nascita) IS NOT NULL
      AND nullif(btrim(coalesce(i.snapshot_serie, a.serie, '')), '') IS NOT NULL
    GROUP BY 1,2,3 ORDER BY 1,2,3
  LOOP
    FOR v_seed IN
      SELECT i.id, i.societa_id, coalesce(i.snapshot_peso_kg, a.peso_kg) AS peso,
        extract(year FROM age(v_date, coalesce(i.snapshot_data_nascita, a.data_nascita)))::integer AS eta
      FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
      WHERE i.evento_id = p_evento_id AND i.stato = 'confermata'
        AND upper(btrim(coalesce(i.disciplina, ''))) = v_group.sport
        AND upper(btrim(coalesce(i.snapshot_serie, a.serie, ''))) = v_group.class
        AND upper(btrim(coalesce(i.snapshot_sesso, a.sesso, ''))) = v_group.sex
        AND coalesce(i.snapshot_peso_kg, a.peso_kg) IS NOT NULL
        AND coalesce(i.snapshot_data_nascita, a.data_nascita) IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.match_cards m WHERE m.evento_id = p_evento_id AND i.id IN (m.rosso_id, m.blu_id))
        AND NOT EXISTS (SELECT 1 FROM public.pools p WHERE p.evento_id = p_evento_id AND NOT p.auto_generato AND i.id = ANY(p.iscrizione_ids))
      ORDER BY coalesce(i.snapshot_peso_kg, a.peso_kg), i.id
    LOOP
      IF v_seed.id = ANY(v_used) THEN CONTINUE; END IF;
      v_ids := ARRAY[v_seed.id];
      FOR v_other IN
        SELECT i.id, i.societa_id, coalesce(i.snapshot_peso_kg, a.peso_kg) AS peso,
          extract(year FROM age(v_date, coalesce(i.snapshot_data_nascita, a.data_nascita)))::integer AS eta
        FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
        WHERE i.evento_id = p_evento_id AND i.stato = 'confermata'
          AND upper(btrim(coalesce(i.disciplina, ''))) = v_group.sport
          AND upper(btrim(coalesce(i.snapshot_serie, a.serie, ''))) = v_group.class
          AND upper(btrim(coalesce(i.snapshot_sesso, a.sesso, ''))) = v_group.sex
          AND coalesce(i.snapshot_peso_kg, a.peso_kg) IS NOT NULL
          AND coalesce(i.snapshot_data_nascita, a.data_nascita) IS NOT NULL
          AND i.id <> v_seed.id AND NOT (i.id = ANY(v_used))
          AND NOT EXISTS (SELECT 1 FROM public.match_cards m WHERE m.evento_id = p_evento_id AND i.id IN (m.rosso_id, m.blu_id))
          AND NOT EXISTS (SELECT 1 FROM public.pools p WHERE p.evento_id = p_evento_id AND NOT p.auto_generato AND i.id = ANY(p.iscrizione_ids))
        ORDER BY abs(coalesce(i.snapshot_peso_kg, a.peso_kg) - v_seed.peso), i.id
      LOOP
        v_ok := true;
        FOR v_existing IN
          SELECT i.societa_id, coalesce(i.snapshot_peso_kg, a.peso_kg) AS peso,
            extract(year FROM age(v_date, coalesce(i.snapshot_data_nascita, a.data_nascita)))::integer AS eta
          FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id
          WHERE i.id = ANY(v_ids)
        LOOP
          IF v_existing.societa_id = v_other.societa_id OR abs(v_existing.peso - v_other.peso) > 5 OR abs(v_existing.eta - v_other.eta) > 2 THEN
            v_ok := false; EXIT;
          END IF;
        END LOOP;
        IF v_ok THEN v_ids := array_append(v_ids, v_other.id); END IF;
        EXIT WHEN array_length(v_ids,1) = 4;
      END LOOP;
      IF array_length(v_ids,1) >= 2 THEN
        v_number := v_number + 1;
        INSERT INTO public.pools(evento_id, numero, iscrizione_ids, stato, auto_generato) VALUES (p_evento_id, v_number, v_ids, 'pubblicato', true);
        v_used := v_used || v_ids;
      END IF;
    END LOOP;
  END LOOP;
END $$;