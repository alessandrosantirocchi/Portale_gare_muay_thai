CREATE OR REPLACE VIEW public.iscrizioni_pubbliche
WITH (security_barrier = true) AS
SELECT i.id,
    i.evento_id,
    i.atleta_id,
    i.stato,
    COALESCE(i.snapshot_nome, a.nome) AS nome,
    COALESCE(i.snapshot_cognome, a.cognome) AS cognome,
    COALESCE(i.snapshot_team, a.nome_societa) AS nome_societa,
    COALESCE(i.snapshot_peso_kg, a.peso_kg) AS peso_kg,
    COALESCE(i.categoria_peso, i.snapshot_categoria) AS categoria,
    COALESCE(i.disciplina, a.disciplina) AS disciplina,
    i.created_at,
    i.snapshot_sesso,
    i.snapshot_serie,
    i.snapshot_coach,
    i.snapshot_totale_match
   FROM iscrizioni i
     JOIN atleti a ON a.id = i.atleta_id;

COMMENT ON VIEW public.iscrizioni_pubbliche IS 'Public read-only snapshot of confirmed registrations for published event tables; extends the previous projection with sex, class, coach and match count.'