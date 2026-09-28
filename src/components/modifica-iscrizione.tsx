import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CLASSI, CATEGORIE, etaAllaData } from "@/lib/fight-hub";
import { Button } from "@/components/ui/button";
import { categoriaPesoIfma } from "@/lib/pesi-ifma";

type Registration = {
  id: string; atleta_id: string; evento_id: string; snapshot_nome: string | null;
  snapshot_cognome: string | null; snapshot_peso_kg: number | null;
  snapshot_serie: string | null; snapshot_categoria: string | null;
  snapshot_sesso?: string | null; snapshot_data_nascita?: string | null; categoria_peso?: string | null;
  senior_17?: boolean | null;
  snapshot_coach: string | null; snapshot_totale_match: number | null;
  disciplina: string | null;
  eventi: { nome: string; data_evento: string; stato: string; fine_iscrizioni: string; apertura_iscrizioni: string | null; discipline_ammesse: string[] | null } | null;
};

export function ModificaIscrizione({ iscrizione: i, userId }: { iscrizione: Registration; userId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ peso: String(i.snapshot_peso_kg ?? ""), classe: i.snapshot_serie ?? "N", categoria: i.snapshot_categoria ?? "SENIOR", coach: i.snapshot_coach ?? "", match: String(i.snapshot_totale_match ?? 0), disciplina: i.disciplina ?? "", senior_17: i.senior_17 ?? false });
  const [roster, setRoster] = useState(false);
  const evento = i.eventi;
  const editable = !!evento && ["aperto", "iscrizioni aperte"].includes(evento.stato) && new Date(evento.fine_iscrizioni).getTime() > Date.now() && (!evento.apertura_iscrizioni || new Date(evento.apertura_iscrizioni).getTime() <= Date.now());
  const refresh = () => { qc.invalidateQueries({ queryKey: ["mie-iscrizioni"] }); qc.invalidateQueries({ queryKey: ["iscritti"] }); qc.invalidateQueries({ queryKey: ["iscrizioni-atleta"] }); qc.invalidateQueries({ queryKey: ["miei-atleti"] }); qc.invalidateQueries({ queryKey: ["conteggi-iscritti"] }); qc.invalidateQueries({ queryKey: ["public-pools"] }); };
  const save = useMutation({ mutationFn: async () => {
    if (!editable) throw new Error("Le iscrizioni sono chiuse.");
    const values = { snapshot_peso_kg: form.peso ? Number(form.peso) : null, snapshot_serie: form.classe, snapshot_categoria: form.senior_17 ? "SENIOR" : form.categoria, senior_17: form.senior_17, snapshot_coach: form.coach, snapshot_totale_match: Number(form.match), disciplina: form.disciplina };
    if (!categoriaPesoIfma(values.snapshot_peso_kg, i.snapshot_sesso ?? "", i.snapshot_data_nascita ?? null, evento?.data_evento ?? "")) throw new Error("Inserisci un peso valido per la categoria IFMA.");
    const { error } = await supabase.from("iscrizioni").update(values).eq("id", i.id).eq("societa_id", userId);
    if (error) throw error;
    if (roster) {
      const { error: rosterError } = await supabase.from("atleti").update({ peso_kg: values.snapshot_peso_kg, serie: form.classe, categoria: form.categoria, coach: form.coach, totale_match: Number(form.match), disciplina: form.disciplina }).eq("id", i.atleta_id).eq("societa_id", userId);
      if (rosterError) throw rosterError;
    }
  }, onSuccess: () => { setMessage("Iscrizione aggiornata."); setOpen(false); refresh(); }, onError: (error) => setMessage(error.message) });
  const remove = useMutation({ mutationFn: async () => { if (!editable) throw new Error("Le iscrizioni sono chiuse."); const { error } = await supabase.from("iscrizioni").delete().eq("id", i.id).eq("societa_id", userId); if (error) throw error; }, onSuccess: refresh, onError: (error) => setMessage(error.message) });
  if (!editable) return null;
  const fieldClass = "mt-1 w-full rounded-md border border-input bg-background p-2 text-sm text-foreground";
  return <div className="mt-2"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setOpen(!open)}>Modifica</Button><Button size="sm" variant="outline" disabled={remove.isPending} onClick={() => { if (confirm(`Ritirare l'iscrizione di ${i.snapshot_nome ?? "questo atleta"}?`)) remove.mutate(); }}>Ritira</Button></div>{open && <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setMessage(""); save.mutate(); }}><label className="text-xs">Peso (kg)<input required type="number" min="0" step="0.1" className={fieldClass} value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} /></label><label className="text-xs">Totale match<input type="number" min="0" className={fieldClass} value={form.match} onChange={(e) => setForm({ ...form, match: e.target.value })} /></label><label className="text-xs">Disciplina<select className={fieldClass} value={form.disciplina} onChange={(e) => setForm({ ...form, disciplina: e.target.value })}>{[...new Set([form.disciplina, ...(evento?.discipline_ammesse ?? [])])].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs">Classe<select className={fieldClass} value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })}>{[...new Set([form.classe, ...CLASSI])].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs">Categoria<select className={fieldClass} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{[...new Set([form.categoria, ...CATEGORIE])].map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs">Coach<input className={fieldClass} value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} /></label><label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" checked={roster} onChange={(e) => setRoster(e.target.checked)} />Aggiorna anche il roster</label><Button disabled={save.isPending} type="submit">Salva iscrizione</Button></form>}{message && <p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p>}</div>;
}