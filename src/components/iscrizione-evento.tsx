import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Atleta, Evento } from "@/lib/queries";
import { CATEGORIE, DISCIPLINE_GARA, CLASSI, etaAllaData } from "@/lib/fight-hub";
import { Button } from "@/components/ui/button";

type Dati = { peso: string; disciplina: string; serie: string; categoria: string; coach: string; match: string; senior: boolean };
const vuoto: Dati = { peso: "", disciplina: "", serie: "", categoria: "", coach: "", match: "0", senior: false };
const inputClass = "mt-1 w-full rounded-md border border-input bg-background p-2 text-sm text-foreground";

export function IscrizioneEvento({ evento, atleti, userId }: { evento: Evento; atleti: Atleta[]; userId: string | null }) {
  const qc = useQueryClient();
  const [ids, setIds] = useState<string[]>([]);
  const [dati, setDati] = useState<Record<string, Dati>>({});
  const [modo, setModo] = useState<"solo gara" | "aggiorna roster">("solo gara");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<string[]>([]);
  useEffect(() => { if (!userId) return; let active = true; supabase.from("iscrizioni").select("atleta_id").eq("evento_id", evento.id).eq("societa_id", userId).then(({ data }) => { if (active) setExisting((data ?? []).map((i) => i.atleta_id)); }); return () => { active = false; }; }, [userId, evento.id]);

  const aperto = ["aperto", "iscrizioni aperte"].includes(evento.stato) && new Date(evento.fine_iscrizioni).getTime() > Date.now() && (!evento.apertura_iscrizioni || new Date(evento.apertura_iscrizioni).getTime() <= Date.now());
  const toggle = (a: Atleta) => {
    setIds((current) => current.includes(a.id) ? current.filter((id) => id !== a.id) : [...current, a.id]);
    setDati((current) => ({ ...current, [a.id]: current[a.id] ?? { peso: String(a.peso_kg ?? ""), disciplina: evento.discipline_ammesse?.includes(a.disciplina) || !evento.discipline_ammesse?.length ? a.disciplina : (evento.discipline_ammesse[0] ?? evento.disciplina), serie: a.serie ?? "N", categoria: a.categoria ?? "SENIOR", coach: a.coach ?? "", match: String(a.totale_match ?? a.vittorie + a.sconfitte + a.pareggi), senior: false } }));
  };
  const set = (id: string, key: keyof Dati, val: string | boolean) => setDati((old) => ({ ...old, [id]: { ...(old[id] ?? vuoto), [key]: val } }));
  const save = useMutation({ mutationFn: async () => {
    if (!userId) throw new Error("Accedi per iscriverti.");
    if (!ids.length) throw new Error("Seleziona almeno un atleta.");
    setBusy(true);
    try {
      for (const id of ids) {
        const a = atleti.find((row) => row.id === id), d = dati[id];
        if (!a || !d) continue;
        const changed = a.peso_kg !== (d.peso ? Number(d.peso) : null) || a.disciplina !== d.disciplina || (a.serie ?? "") !== d.serie || (a.categoria ?? "") !== d.categoria || (a.coach ?? "") !== d.coach || (a.totale_match ?? 0) !== Number(d.match);
        const { error } = await supabase.from("iscrizioni").insert({ evento_id: evento.id, atleta_id: id, societa_id: userId, disciplina: d.disciplina, snapshot_nome: a.nome, snapshot_cognome: a.cognome, snapshot_sesso: a.sesso, snapshot_data_nascita: a.data_nascita, snapshot_team: a.nome_societa, snapshot_peso_kg: d.peso ? Number(d.peso) : null, snapshot_serie: d.serie, snapshot_categoria: d.senior ? "SENIOR" : d.categoria, snapshot_coach: d.coach, snapshot_totale_match: Number(d.match) || 0, senior_17: d.senior });
        if (error) throw error;
        if (modo === "aggiorna roster" && changed) {
          const { error: updateError } = await supabase.from("atleti").update({ peso_kg: d.peso ? Number(d.peso) : null, disciplina: d.disciplina, serie: d.serie, categoria: d.categoria, coach: d.coach, totale_match: Number(d.match) || 0 }).eq("id", id).eq("societa_id", userId);
          if (updateError) throw updateError;
        }
      }
    } finally { setBusy(false); }
  }, onSuccess: () => { setExisting((x) => [...x, ...ids]); setIds([]); setMsg("Iscrizione salvata."); qc.invalidateQueries({ queryKey: ["iscritti"] }); qc.invalidateQueries({ queryKey: ["mie-iscrizioni"] }); qc.invalidateQueries({ queryKey: ["conteggi-iscritti"] }); qc.invalidateQueries({ queryKey: ["miei-atleti"] }); }, onError: (e) => setMsg(e.message) });

  return <section className="border-t border-border pt-5"><h2 className="font-display text-xl uppercase">Iscrivi atleti</h2>{!aperto ? <p className="mt-2 text-sm text-muted-foreground">Le iscrizioni per questo evento sono chiuse.</p> : !userId ? <p className="mt-2 text-sm"><Link to="/auth" className="text-primary underline">Accedi</Link> con la tua società per iscrivere gli atleti.</p> : <form onSubmit={(e) => { e.preventDefault(); setMsg(""); save.mutate(); }} className="mt-4 space-y-4">
    {atleti.length === 0 && <p className="text-sm text-muted-foreground">Nessun atleta nel roster. <Link to="/area" className="text-primary underline">Aggiungi un atleta</Link>.</p>}
    {atleti.map((a) => { const d = dati[a.id]; const selected = ids.includes(a.id); const eta = etaAllaData(a.data_nascita, evento.data_evento); return <div key={a.id} className="border-b border-border pb-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" disabled={existing.includes(a.id)} checked={selected || existing.includes(a.id)} onChange={() => toggle(a)} />{a.cognome} {a.nome}{existing.includes(a.id) && <span className="text-xs font-normal text-muted-foreground">Già iscritto</span>}</label>{selected && d && <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs">Peso reale (kg)<input required type="number" min="0" step="0.1" className={inputClass} value={d.peso} onChange={(e) => set(a.id, "peso", e.target.value)} /></label><label className="text-xs">Totale match<input type="number" min="0" className={inputClass} value={d.match} onChange={(e) => set(a.id, "match", e.target.value)} /></label><label className="text-xs">Disciplina<select className={inputClass} value={d.disciplina} onChange={(e) => set(a.id, "disciplina", e.target.value)}>{[...new Set(evento.discipline_ammesse?.length ? evento.discipline_ammesse : [d.disciplina, ...DISCIPLINE_GARA])].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs">Classe<select className={inputClass} value={d.serie} onChange={(e) => set(a.id, "serie", e.target.value)}>{[...new Set([d.serie, ...CLASSI])].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs">Categoria<select className={inputClass} value={d.categoria} disabled={d.senior} onChange={(e) => set(a.id, "categoria", e.target.value)}>{[...new Set([d.categoria, ...CATEGORIE])].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs">Coach<input className={inputClass} value={d.coach} onChange={(e) => set(a.id, "coach", e.target.value)} /></label>{eta === 17 && <label className="sm:col-span-2 flex gap-2 text-xs"><input type="checkbox" checked={d.senior} onChange={(e) => set(a.id, "senior", e.target.checked)} />Iscrivi questo atleta nella categoria Senior solo per questa gara</label>}</div>}</div>; })}
    {ids.length > 0 && <fieldset className="text-xs"><legend className="mb-2 font-semibold">Dati modificati rispetto al roster</legend><label className="mr-4 inline-flex gap-2"><input type="radio" checked={modo === "solo gara"} onChange={() => setModo("solo gara")} />Usa il valore solo per questa gara</label><label className="inline-flex gap-2"><input type="radio" checked={modo === "aggiorna roster"} onChange={() => setModo("aggiorna roster")} />Aggiorna anche il roster</label></fieldset>}
    <Button type="submit" disabled={!ids.length || busy || save.isPending}>{busy ? "Salvataggio…" : `Conferma ${ids.length} iscrizion${ids.length === 1 ? "e" : "i"}`}</Button>{msg && <p role="status" className="text-xs text-muted-foreground">{msg}</p>}
  </form>}</section>;
}