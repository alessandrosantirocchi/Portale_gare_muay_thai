CREATE OR REPLACE FUNCTION public.ifma_weight_class(p_weight numeric, p_sex text, p_birth date, p_event date)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE limits numeric[]; ceiling numeric; v_years integer;
BEGIN
 IF p_weight IS NULL OR p_weight <= 0 OR p_birth IS NULL OR p_event IS NULL OR upper(btrim(coalesce(p_sex, ''))) NOT IN ('M','F') THEN RETURN NULL; END IF;
 v_years := date_part('year', age(p_event, p_birth))::integer;
 IF v_years <= 9 THEN
   limits := ARRAY[24,28,32,37,42,47,52,57,60]::numeric[];
 ELSIF v_years <= 12 THEN
   limits := ARRAY[28,32,37,42,47,52,57,60,63.5,67,71,75]::numeric[];
 ELSIF v_years <= 15 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[32,37,42,47,52,57,63,69,71,75]::numeric[];
   ELSE limits := ARRAY[32,37,42,46,50,55,60,65,67,71,75]::numeric[]; END IF;
 ELSIF v_years <= 18 THEN
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[45,48,51,54,57,60,63.5,67,71,75,81,86,91]::numeric[];
   ELSE limits := ARRAY[42,45,48,51,54,57,60,63.5,67,71,75]::numeric[]; END IF;
 ELSE
   IF upper(btrim(p_sex)) = 'M' THEN limits := ARRAY[48,51,54,57,60,63.5,67,71,75,81,86,91]::numeric[];
   ELSE limits := ARRAY[45,48,51,54,57,60,63.5,67,71,75]::numeric[]; END IF;
 END IF;
 FOREACH ceiling IN ARRAY limits LOOP IF p_weight <= ceiling THEN RETURN '-' || ceiling::text || ' kg'; END IF; END LOOP;
 RETURN '+' || limits[array_length(limits,1)]::text || ' kg';
END
$$;