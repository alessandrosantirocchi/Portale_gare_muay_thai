CREATE OR REPLACE FUNCTION public.refresh_automatic_pools(p_evento_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_date date; v_seed record; v_candidate record; v_member record; v_ids uuid[]; v_used uuid[] := '{}'::uuid[]; v_num integer; v_compatible boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_evento_id::text, 0));
 DELETE FROM public.pools WHERE evento_id = p_evento_id AND auto_generato;
 SELECT data_evento INTO v_event_date FROM public.eventi WHERE id = p_evento_id;
 IF v_event_date IS NULL THEN RETURN; END IF;
 SELECT coalesce(max(numero),0) INTO v_num FROM public.pools WHERE evento_id = p_evento_id;
 FOR v_seed IN
   SELECT i.id, i.societa_id, i.disciplina, coalesce(i.snapshot_serie,a.serie) AS classe, coalesce(i.snapshot_sesso,a.sesso) AS sesso, i.categoria_peso,
     coalesce(i.snapshot_peso_kg,a.peso_kg) AS peso, extract(year FROM age(v_event_date,coalesce(i.snapshot_data_nascita,a.data_nascita)))::integer AS eta
   FROM public.iscrizioni i JOIN public.atleti a ON a.id=i.atleta_id
   WHERE i.evento_id=p_evento_id AND i.stato='confermata' AND i.categoria_peso IS NOT NULL AND nullif(btrim(coalesce(i.snapshot_serie,a.serie,'')),'') IS NOT NULL
     AND coalesce(i.snapshot_data_nascita,a.data_nascita) IS NOT NULL
     AND NOT EXISTS(SELECT 1 FROM public.match_cards m WHERE m.evento_id=p_evento_id AND i.id IN (m.rosso_id,m.blu_id))
     AND NOT EXISTS(SELECT 1 FROM public.pools p WHERE p.evento_id=p_evento_id AND NOT p.auto_generato AND i.id=ANY(p.iscrizione_ids))
   ORDER BY upper(btrim(i.disciplina)),upper(btrim(coalesce(i.snapshot_serie,a.serie))),upper(btrim(coalesce(i.snapshot_sesso,a.sesso))),i.categoria_peso,coalesce(i.snapshot_peso_kg,a.peso_kg),i.id
 LOOP
   IF v_seed.id=ANY(v_used) THEN CONTINUE; END IF;
   v_ids:=ARRAY[v_seed.id];
   FOR v_candidate IN
     SELECT i.id,i.societa_id,coalesce(i.snapshot_peso_kg,a.peso_kg) AS peso,extract(year FROM age(v_event_date,coalesce(i.snapshot_data_nascita,a.data_nascita)))::integer AS eta
     FROM public.iscrizioni i JOIN public.atleti a ON a.id=i.atleta_id
     WHERE i.evento_id=p_evento_id AND i.stato='confermata' AND i.id<>v_seed.id AND NOT i.id=ANY(v_used)
       AND upper(btrim(i.disciplina))=upper(btrim(v_seed.disciplina))
       AND upper(btrim(coalesce(i.snapshot_serie,a.serie)))=upper(btrim(v_seed.classe))
       AND upper(btrim(coalesce(i.snapshot_sesso,a.sesso)))=upper(btrim(v_seed.sesso))
       AND i.categoria_peso=v_seed.categoria_peso AND coalesce(i.snapshot_data_nascita,a.data_nascita) IS NOT NULL
       AND NOT EXISTS(SELECT 1 FROM public.match_cards m WHERE m.evento_id=p_evento_id AND i.id IN (m.rosso_id,m.blu_id))
       AND NOT EXISTS(SELECT 1 FROM public.pools p WHERE p.evento_id=p_evento_id AND NOT p.auto_generato AND i.id=ANY(p.iscrizione_ids))
     ORDER BY abs(coalesce(i.snapshot_peso_kg,a.peso_kg)-v_seed.peso),i.id
   LOOP
     v_compatible:=true;
     FOR v_member IN
       SELECT i.societa_id,coalesce(i.snapshot_peso_kg,a.peso_kg) AS peso,extract(year FROM age(v_event_date,coalesce(i.snapshot_data_nascita,a.data_nascita)))::integer AS eta
       FROM public.iscrizioni i JOIN public.atleti a ON a.id=i.atleta_id WHERE i.id=ANY(v_ids)
     LOOP
       IF v_member.societa_id=v_candidate.societa_id OR abs(v_member.peso-v_candidate.peso)>5 OR abs(v_member.eta-v_candidate.eta)>2 THEN v_compatible:=false; EXIT; END IF;
     END LOOP;
     IF v_compatible THEN v_ids:=array_append(v_ids,v_candidate.id); END IF;
     EXIT WHEN array_length(v_ids,1)=4;
   END LOOP;
   IF array_length(v_ids,1)>=2 THEN
     v_num:=v_num+1;
     INSERT INTO public.pools(evento_id,numero,iscrizione_ids,stato,auto_generato) VALUES(p_evento_id,v_num,v_ids,'pubblicato',true);
     v_used:=v_used||v_ids;
   END IF;
 END LOOP;
END $$;