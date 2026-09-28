CREATE OR REPLACE FUNCTION public.ifma_weight_class(p_weight numeric, p_sex text, p_birth date, p_event date) RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE limits numeric[]; ceiling numeric; v_years integer;
BEGIN
 IF p_weight IS NULL OR p_weight <= 0 OR p_birth IS NULL OR p_event IS NULL OR upper(btrim(coalesce(p_sex, ''))) NOT IN ('M','F') THEN RETURN NULL; END IF;
 v_years := extract(year FROM p_event)::integer - extract(year FROM p_birth)::integer;
 IF v_years >= 18 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[45,48,51,54,57,60,63.5,67,71,75,81,86,91]::numeric[];
   ELSE limits := ARRAY[45,48,51,54,57,60,63.5,67,71,75]::numeric[]; END IF;
 ELSIF v_years >= 16 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[45,48,51,54,57,60,63.5,67,71,75,81,86,91]::numeric[];
   ELSE limits := ARRAY[42,45,48,51,54,57,60,63.5,67,71,75]::numeric[]; END IF;
 ELSIF v_years >= 14 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[38,40,42,45,48,51,54,57,60,63.5,67,71,75,81]::numeric[];
   ELSE limits := ARRAY[36,38,40,42,45,48,51,54,57,60,63.5,67,71]::numeric[]; END IF;
 ELSIF v_years >= 12 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,63.5,67,71]::numeric[];
   ELSE limits := ARRAY[32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,63.5]::numeric[]; END IF;
 ELSIF v_years >= 10 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,63.5,67]::numeric[];
   ELSE limits := ARRAY[30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60]::numeric[]; END IF;
 ELSE RETURN NULL;
 END IF;
 FOREACH ceiling IN ARRAY limits LOOP IF p_weight <= ceiling THEN RETURN '-' || ceiling::text || ' kg'; END IF; END LOOP;
 RETURN '+' || limits[array_length(limits,1)]::text || ' kg';
END $$;
REVOKE ALL ON FUNCTION public.ifma_weight_class(numeric,text,date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ifma_weight_class(numeric,text,date,date) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.assign_ifma_registration_weight() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_date date;
BEGIN
 SELECT data_evento INTO v_date FROM public.eventi WHERE id = NEW.evento_id;
 NEW.categoria_peso := public.ifma_weight_class(NEW.snapshot_peso_kg, NEW.snapshot_sesso, NEW.snapshot_data_nascita, v_date);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.assign_ifma_registration_weight() FROM PUBLIC;
CREATE TRIGGER y_assign_ifma_registration_weight BEFORE INSERT OR UPDATE OF snapshot_peso_kg, snapshot_sesso, snapshot_data_nascita, evento_id ON public.iscrizioni FOR EACH ROW EXECUTE FUNCTION public.assign_ifma_registration_weight();