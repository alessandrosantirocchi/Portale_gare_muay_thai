import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Atleta, Evento } from "@/lib/queries";
import { disciplinaCanonica } from "@/lib/format";

export function IscrizioneEvento({ evento, atleti, userId }: { evento: Evento; atleti: Atleta[]; userId: string | null }) {
  const qc = useQueryClient();
  const [existing, setExisting] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase.from("iscrizioni").select("atleta_id").eq("evento_id", evento.id).eq("societa_id", userId).then(({ data }) => {
      if (active) setExisting((data ?? []).map((i) => i.atleta_id));
    });
    return () => { active = false; };
  }, [userId, evento.id]);

  const aperto = ["aperto", "iscrizioni aperte"].includes(evento.stato) && new Date(evento.fine_iscrizioni).getTime() > Date.now() && (!evento.apertura_iscrizioni || new Date(evento.apertura_iscrizioni).getTime() <= Date.now());
  const save = useMutation({
    mutationFn: async (a: Atleta) => {
      if (!userId) throw new Error("Accedi per iscriverti.");
      const disciplina = evento.discipline_ammesse?.find((v) => disciplinaCanonica(v) === disciplinaCanonica(a.disciplina)) ?? evento.discipline_ammesse?.[0] ?? evento.disciplina;
      const { error } = await supabase.from("iscrizioni").insert({
        evento_id: evento.id, atleta_id: a.id, societa_id: userId, stato: "confermata",
        disciplina, snapshot_nome: a.nome, snapshot_cognome: a.cognome,
        snapshot_sesso: a.sesso, snapshot_data_nascita: a.data_nascita,
        snapshot_team: a.nome_societa, snapshot_peso_kg: a.peso_kg,
        snapshot_serie: a.serie ?? "N", snapshot_categoria: a.categoria ?? "SENIOR",
        snapshot_coach: a.coach, snapshot_totale_match: a.totale_match ?? a.vittorie + a.sconfitte + a.pareggi,
      });
      if (error) throw error;
      return a.id;
    },
    onSuccess: (id) => {
      setExisting((ids) => [...ids, id]);
      setMsg("Atleta iscritto e confermato.");
      for (const key of ["iscritti", "mie-iscrizioni", "conteggi-iscritti", "iscrizioni-atleta"]) qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) => setMsg(error.message),
  });

  return <section className="border-t border-border pt-5">
    <h2 className="font-display text-xl uppercase">Iscrivi atleti</h2>
    {!aperto ? <p className="mt-2 text-sm text-muted-foreground">Le iscrizioni per questo evento sono chiuse.</p> : !userId ? <p className="mt-2 text-sm"><Link to="/auth" className="text-primary underline">Accedi</Link> con la tua società per iscrivere gli atleti.</p> : <div className="mt-4 space-y-3">
      {atleti.length === 0 && <p className="text-sm text-muted-foreground">Nessun atleta nel roster. <Link to="/area" className="text-primary underline">Aggiungi un atleta</Link>.</p>}
      {atleti.map((a) => <label key={a.id} className="flex cursor-pointer items-center gap-2 border-b border-border py-2 text-sm font-semibold">
        <input type="checkbox" checked={existing.includes(a.id)} disabled={existing.includes(a.id) || save.isPending} onChange={() => { setMsg(""); save.mutate(a); }} />
        {a.cognome} {a.nome}
        {existing.includes(a.id) && <span className="text-xs font-normal text-muted-foreground">Iscritto · confermato</span>}
        {save.isPending && save.variables?.id === a.id && <span className="text-xs font-normal text-muted-foreground">Iscrizione…</span>}
      </label>)}
      {msg && <p role="status" className="text-xs text-muted-foreground">{msg}</p>}
    </div>}
  </section>;
}