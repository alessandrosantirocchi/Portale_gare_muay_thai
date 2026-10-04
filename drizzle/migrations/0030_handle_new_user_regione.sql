CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome_societa, codice_societa, codice_fiscale, citta, regione, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_societa', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'codice_societa',
    NULLIF(upper(btrim(COALESCE(NEW.raw_user_meta_data->>'codice_fiscale',''))),''),
    NEW.raw_user_meta_data->>'citta',
    NEW.raw_user_meta_data->>'regione',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'societa') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;