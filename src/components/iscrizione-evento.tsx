import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Atleta, Evento } from "@/lib/queries";
import { disciplinaCanonica } from "@/lib/format";
import { categoriaPesoIfma } from "@/lib/pesi-ifma";
import { etaAllaData } from "@/lib/fight-hub";

export function IscrizioneEvento({ evento, atleti, userId }: { evento: Evento; atleti: Atleta[]; userId: string | null }) {
  const qc = useQueryClient();
  const [existing, setExisting] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [senior, setSenior] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase.from("iscrizioni").select("atleta_id, stato").eq("evento_id", evento.id).eq("societa_id", userId).then(({ data }) => {
      if (active) setExisting(Object.fromEntries((data ?? []).map((i) => [i.atleta_id, i.stato])));
    });
    return () => { active = false; };
  }, [userId, evento.id]);

  const aperto = ["aperto", "iscrizioni aperte"].includes(evento.stato) && new Date(evento.fine_iscrizioni).getTime() > Date.now() && (!evento.apertura_iscrizioni || new Date(evento.apertura_iscrizioni).getTime() <= Date.now());
  const save = useMutation({
    mutationFn: async (a: Atleta) => {
      if (!userId) throw new Error("Accedi per iscriverti.");
      const categoriaPeso = categoriaPesoIfma(a.peso_kg, a.sesso, a.data_nascita, evento.data_evento);
      if (!categoriaPeso) throw new Error("Completa peso, data di nascita e genere dell'atleta prima di iscriverlo.");
      const disciplina = evento.discipline_ammesse?.find((v) => disciplinaCanonica(v) === disciplinaCanonica(a.disciplina)) ?? evento.discipline_ammesse?.[0] ?? evento.disciplina;
      const { error } = await supabase.from("iscrizioni").insert({
        evento_id: evento.id, atleta_id: a.id, societa_id: userId, stato: "confermata",
        categoria_peso: categoriaPeso,
        disciplina, snapshot_nome: a.nome, snapshot_cognome: a.cognome,
        snapshot_sesso: a.sesso, snapshot_data_nascita: a.data_nascita,
        snapshot_team: a.nome_societa, snapshot_peso_kg: a.peso_kg,
        snapshot_serie: a.serie ?? "N", snapshot_categoria: senior[a.id] ? "SENIOR" : a.categoria ?? "SENIOR", senior_17: senior[a.id] ?? false,
        snapshot_coach: a.coach, snapshot_totale_match: a.totale_match ?? a.vittorie + a.sconfitte + a.pareggi,
      });
      if (error) throw error;
      return a.id;
    },
    onSuccess: (id) => {
      setExisting((ids) => ({ ...ids, [id]: "confermata" }));
      setMsg("Atleta iscritto e confermato.");
      for (const key of ["iscritti", "mie-iscrizioni", "conteggi-iscritti", "iscrizioni-atleta", "public-pools"]) qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) => setMsg(error.message),
  });

  return <section className="border-t border-border pt-5">
    <h2 className="font-display text-xl uppercase">Iscrivi atleti</h2>
    {!aperto ? <p className="mt-2 text-sm text-muted-foreground">Le iscrizioni per questo evento sono chiuse.</p> : !userId ? <p className="mt-2 text-sm"><Link to="/auth" className="text-primary underline">Accedi</Link> con la tua società per iscrivere gli atleti.</p> : <div className="mt-4 space-y-3">
      {atleti.length === 0 && <p className="text-sm text-muted-foreground">Nessun atleta nel roster. <Link to="/area" className="text-primary underline">Aggiungi un atleta</Link>.</p>}
      {atleti.map((a) => <div key={a.id} className="border-b border-border py-2 text-sm"><label className="flex cursor-pointer items-center gap-2 font-semibold">
        <input type="checkbox" checked={!!existing[a.id]} disabled={!!existing[a.id] || save.isPending} onChange={() => { setMsg(""); save.mutate(a); }} />
        {a.cognome} {a.nome} <span className="text-xs font-normal text-muted-foreground">{categoriaPesoIfma(a.peso_kg, a.sesso, a.data_nascita, evento.data_evento) ?? "Peso da completare"}</span>
        {existing[a.id] && <span className="text-xs font-normal text-muted-foreground">Iscritto · {existing[a.id]}</span>}
        {save.isPending && save.variables?.id === a.id && <span className="text-xs font-normal text-muted-foreground">Iscrizione…</span>}
      </label>{etaAllaData(a.data_nascita, evento.data_evento) !== null && [17, 18].includes(etaAllaData(a.data_nascita, evento.data_evento) ?? -1) && !existing[a.id] && <label className="ml-5 mt-2 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={senior[a.id] ?? false} onChange={(e) => setSenior((prev) => ({ ...prev, [a.id]: e.target.checked }))} />Iscrivi questo atleta nella categoria Senior</label>}</div>)}
      {msg && <p role="status" className="text-xs text-muted-foreground">{msg}</p>}
    </div>}
  </section>;
}