GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS 'Security-definer role check; storage RLS policies call it, so public execute is required.'