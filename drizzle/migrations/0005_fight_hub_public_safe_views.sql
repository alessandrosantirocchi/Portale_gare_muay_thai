CREATE VIEW public.classifica_pubblica WITH (security_barrier = true) AS SELECT id, nome, cognome, nome_societa, disciplina, peso_kg, punti, vittorie, sconfitte, pareggi FROM public.atleti;
GRANT SELECT ON public.classifica_pubblica TO anon, authenticated, service_role;
CREATE VIEW public.iscrizioni_pubbliche WITH (security_barrier = true) AS SELECT i.id, i.evento_id, i.atleta_id, i.stato, coalesce(i.snapshot_nome,a.nome) AS nome, coalesce(i.snapshot_cognome,a.cognome) AS cognome, coalesce(i.snapshot_team,a.nome_societa) AS nome_societa, coalesce(i.snapshot_peso_kg,a.peso_kg) AS peso_kg, coalesce(i.snapshot_categoria,i.categoria_peso) AS categoria, coalesce(i.disciplina,a.disciplina) AS disciplina, i.created_at FROM public.iscrizioni i JOIN public.atleti a ON a.id = i.atleta_id;
GRANT SELECT ON public.iscrizioni_pubbliche TO anon, authenticated, service_role;
REVOKE SELECT ON public.atleti FROM anon;
REVOKE SELECT ON public.iscrizioni FROM anon;
REVOKE SELECT ON public.profiles FROM anon;