import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DISCIPLINE_GARA, CLASSI, CATEGORIE, etaAllaData } from "@/lib/fight-hub";
import { Pannello, Vuoto } from "@/components/ui-blocchi";
import { Button } from "@/components/ui/button";
import { nomeProprio } from "@/lib/format";
import { TUTTE_CATEGORIE_PESO } from "@/lib/pesi-ifma";
import { z } from "zod";

const empty = { nome: "", cognome: "", data_nascita: "", sesso: "M", peso_kg: "", categoria_peso: "", disciplina: "MUAY THAI", serie: "N", categoria: "SENIOR", coach: "", totale_match: "0", certificato_rilascio: "", certificato_scadenza: "", certificato_tipo: "", certificato_disciplina: "" };
type Form = typeof empty;

function fasciaEta(nascita: string) {
  const eta = new Date().getFullYear() - Number(nascita.slice(0, 4));
  if (eta >= 19) return CATEGORIE[0];
  if (eta >= 16) return CATEGORIE[1];
  if (eta >= 13) return CATEGORIE[2];
  if (eta >= 10) return CATEGORIE[3];
  return CATEGORIE[4];
}

const atletaSchema = z.object({ nome: z.string().trim().min(1).max(100), cognome: z.string().trim().min(1).max(100), data_nascita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sesso: z.enum(["M", "F"]), peso_kg: z.string(), categoria_peso: z.string() });
function validaAtleta(row: Form) {
  const parsed = atletaSchema.safeParse(row);
  const birth = row.data_nascita;
  if (!parsed.success || !birth || !Number.isFinite(Date.parse(birth)) || birth > new Date().toISOString().slice(0, 10) || birth <= "1900-01-01") throw new Error("Compila nome, cognome e una data di nascita valida per ogni atleta.");
  if (!TUTTE_CATEGORIE_PESO.some((option) => option === row.categoria_peso)) throw new Error("Seleziona una categoria di peso valida.");
  if (row.peso_kg && (!Number.isFinite(Number(row.peso_kg)) || Number(row.peso_kg) <= 0)) throw new Error("Inserisci un peso reale valido.");
}

export function RosterSocieta({ userId, nomeSocieta }: { userId: string; nomeSocieta: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
  const [nuovi, setNuovi] = useState<Form[]>([{ ...empty }]);
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { data: atleti = [], isLoading } = useQuery({
    queryKey: ["miei-atleti", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("atleti").select("*").eq("societa_id", userId).order("cognome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      validaAtleta(form);
      const values = { nome: nomeProprio(form.nome), cognome: nomeProprio(form.cognome), data_nascita: form.data_nascita, sesso: form.sesso, peso_kg: form.peso_kg ? Number(form.peso_kg) : null, categoria_peso: form.categoria_peso, disciplina: form.disciplina, serie: form.serie, categoria: fasciaEta(form.data_nascita), coach: form.coach.trim() || null, totale_match: Number(form.totale_match) || 0, certificato_rilascio: form.certificato_rilascio || null, certificato_scadenza: form.certificato_scadenza || null, certificato_tipo: form.certificato_tipo || null, certificato_disciplina: form.certificato_disciplina || null };
      const { error } = editId ? await supabase.from("atleti").update(values).eq("id", editId).eq("societa_id", userId) : await supabase.from("atleti").insert({ ...values, societa_id: userId, nome_societa: nomeSocieta });
      if (error) throw error;
    },
    onSuccess: () => { setMessage("Atleta salvato."); setForm(empty); setEditId(null); qc.invalidateQueries({ queryKey: ["miei-atleti"] }); qc.invalidateQueries({ queryKey: ["atleti"] }); },
    onError: (e) => setMessage(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("atleti").delete().eq("id", id).eq("societa_id", userId); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["miei-atleti"] }); qc.invalidateQueries({ queryKey: ["atleti"] }); },
    onError: (e) => setMessage(e.message),
  });
  const saveMany = useMutation({
    mutationFn: async () => {
      const validi = nuovi.filter((r) => r.nome.trim() || r.cognome.trim() || r.data_nascita || r.peso_kg || r.coach.trim() || r.categoria_peso);
      if (!validi.length) throw new Error("Compila almeno un atleta.");
      validi.forEach(validaAtleta);
      const { error } = await supabase.from("atleti").insert(validi.map((r) => ({ nome: nomeProprio(r.nome), cognome: nomeProprio(r.cognome), data_nascita: r.data_nascita, sesso: r.sesso, peso_kg: r.peso_kg ? Number(r.peso_kg) : null, categoria_peso: r.categoria_peso, disciplina: r.disciplina, serie: r.serie, categoria: fasciaEta(r.data_nascita), coach: r.coach.trim() || null, totale_match: Number(r.totale_match) || 0, societa_id: userId, nome_societa: nomeSocieta })));
      if (error) throw error;
      return validi.length;
    },
    onSuccess: (count) => { setMessage(`${count} atlet${count === 1 ? "a salvato" : "i salvati"}.`); setNuovi([{ ...empty }]); qc.invalidateQueries({ queryKey: ["miei-atleti"] }); qc.invalidateQueries({ queryKey: ["atleti"] }); },
    onError: (e) => setMessage(e.message),
  });
  const batchField = (index: number, key: keyof Form, label: string, type = "text") => <label className="min-w-0 text-xs text-muted-foreground">{label}<input aria-label={`${label} atleta ${index + 1}`} type={type} required={key === "data_nascita" && !!(nuovi[index]?.nome || nuovi[index]?.cognome)} max={type === "date" ? new Date().toISOString().slice(0, 10) : undefined} min={type === "number" ? "0" : undefined} step={key === "peso_kg" ? "0.1" : undefined} value={nuovi[index]?.[key] ?? ""} onChange={(e) => setNuovi((rows) => rows.map((r, n) => n === index ? { ...r, [key]: e.target.value } : r))} className="mt-1 block w-full min-w-0 rounded-md border border-input bg-background p-2 text-sm text-foreground" /></label>;
  const batchSelect = (index: number, key: keyof Form, label: string, values: readonly string[]) => <label className="min-w-0 text-xs text-muted-foreground">{label}<select aria-label={`${label} atleta ${index + 1}`} required={key === "categoria_peso" && !!(nuovi[index]?.nome || nuovi[index]?.cognome)} value={nuovi[index]?.[key] ?? ""} onChange={(e) => setNuovi((rows) => rows.map((r, n) => n === index ? { ...r, [key]: e.target.value } : r))} className="mt-1 block w-full min-w-0 rounded-md border border-input bg-background p-2 text-sm text-foreground">{key === "categoria_peso" && <option value="">Seleziona…</option>}{values.map((v) => <option key={v}>{v}</option>)}</select></label>;
  const field = (key: keyof Form, label: string, type = "text") => <label className="text-xs text-muted-foreground">{label}<input type={type} required={key === "data_nascita"} max={type === "date" ? new Date().toISOString().slice(0, 10) : undefined} min={type === "number" ? "0" : undefined} step={key === "peso_kg" ? "0.1" : undefined} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm text-foreground" /></label>;
  const select = (key: keyof Form, label: string, values: readonly string[]) => <label className="text-xs text-muted-foreground">{label}<select required={key === "categoria_peso"} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm text-foreground">{key === "categoria_peso" && <option value="">Seleziona…</option>}{values.map((v) => <option key={v}>{v}</option>)}</select></label>;
  return <div className="grid min-w-0 gap-6">
    {!editId && <form onSubmit={(e) => { e.preventDefault(); setMessage(""); saveMany.mutate(); }} className="min-w-0 max-w-full border-y border-border py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl uppercase">Nuovi atleti</h2><Button type="button" variant="outline" onClick={() => setNuovi((rows) => [...rows, { ...empty }])}>Aggiungi atleta</Button></div>
      <div className="max-w-full space-y-3 overflow-x-auto">{nuovi.map((r, index) => <div key={index} className="grid min-w-[1340px] grid-cols-[repeat(3,minmax(0,1fr))_80px_110px_145px_100px_160px_130px_100px_88px] gap-3 border-b border-border pb-4">
        {batchField(index, "nome", "Nome")}{batchField(index, "cognome", "Cognome")}{batchField(index, "data_nascita", "Data di nascita", "date")}{batchSelect(index, "sesso", "Genere", ["M", "F"])}{batchField(index, "peso_kg", "Peso reale (kg)", "number")}{batchSelect(index, "disciplina", "Disciplina", DISCIPLINE_GARA)}{batchSelect(index, "serie", "Classe", CLASSI)}{batchSelect(index, "categoria_peso", "Categoria di peso", TUTTE_CATEGORIE_PESO)}{batchField(index, "coach", "Coach")}{batchField(index, "totale_match", "Totale match", "number")}
        <div className="flex items-end">{nuovi.length > 1 && <Button type="button" variant="outline" onClick={() => setNuovi((rows) => rows.filter((_, n) => n !== index))}>Rimuovi</Button>}</div>
      </div>)}</div>
      <div className="mt-4 flex items-center gap-3"><Button type="submit" disabled={saveMany.isPending}>{saveMany.isPending ? "Salvataggio…" : "Salva atleti"}</Button>{!editId && message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}</div>
    </form>}
    {editId && <Pannello className="p-5"><h2 className="font-display text-xl uppercase">Modifica atleta</h2><form onSubmit={(e) => { e.preventDefault(); setMessage(""); save.mutate(); }} className="mt-4 grid grid-cols-2 gap-3">
      {field("nome", "Nome")}{field("cognome", "Cognome")}{field("data_nascita", "Data di nascita", "date")}{select("sesso", "Genere", ["M", "F"])}{field("peso_kg", "Peso reale (kg)", "number")}{select("categoria_peso", "Categoria di peso", TUTTE_CATEGORIE_PESO)}{field("totale_match", "Totale match", "number")}{select("disciplina", "Disciplina", DISCIPLINE_GARA)}{select("serie", "Classe", CLASSI)}<div className="col-span-2">{field("coach", "Coach")}</div>
      <h3 className="col-span-2 mt-2 border-t border-border pt-3 text-sm font-semibold">Certificato medico</h3>{field("certificato_rilascio", "Rilascio", "date")}{field("certificato_scadenza", "Scadenza", "date")}{field("certificato_tipo", "Tipo")}{field("certificato_disciplina", "Disciplina certificata")}
      <div className="col-span-2"><label className="text-xs text-muted-foreground">Documento (PDF o immagine)<input type="file" accept="application/pdf,image/*" className="mt-1 block w-full text-xs" onChange={async (ev) => { const file = ev.target.files?.[0]; if (!file || !editId) { setMessage("Salva prima l'atleta, poi carica il documento."); return; } if (file.size > 10_000_000) { setMessage("Il documento supera 10 MB."); return; } const path = `${userId}/${editId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`; const { error } = await supabase.storage.from("certificati").upload(path, file); if (error) { setMessage(error.message); return; } const update = await supabase.from("atleti").update({ certificato_path: path }).eq("id", editId); setMessage(update.error ? update.error.message : "Documento caricato."); qc.invalidateQueries({ queryKey: ["miei-atleti"] }); }} /></label></div>
      <Button type="submit" disabled={save.isPending} className="col-span-2">{save.isPending ? "Salvataggio…" : "Salva atleta"}</Button>{editId && <Button type="button" variant="outline" className="col-span-2" onClick={() => { setEditId(null); setForm(empty); }}>Annulla</Button>}{message && <p role="status" className="col-span-2 text-xs text-muted-foreground">{message}</p>}
    </form></Pannello>}
    <div><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl uppercase">Roster permanente</h2><span className="text-xs text-muted-foreground">{atleti.length} atleti</span></div><div className="divide-y divide-border border-y border-border">{isLoading && <Vuoto testo="Caricamento…" />}{!isLoading && atleti.length === 0 && <Vuoto testo="Nessun atleta inserito." />}{atleti.map((a) => { const eta = etaAllaData(a.data_nascita, new Date().toISOString().slice(0,10)); const certificato = !a.certificato_scadenza ? "MISSING" : a.certificato_scadenza < new Date().toISOString().slice(0,10) ? "EXPIRED" : "VALID"; return <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{a.cognome} {a.nome} <span className="text-xs font-normal text-muted-foreground">{eta === null ? "" : `· ${eta} anni`}</span></p><p className="text-xs text-muted-foreground">{a.disciplina} · Classe {a.serie || "—"} · {a.categoria || "—"} · {a.categoria_peso || "Peso IFMA da definire"} · {a.peso_kg ?? "—"} kg · {a.totale_match ?? 0} match</p><p className="mt-1 text-xs text-muted-foreground">Certificato: {certificato}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditId(a.id); setForm({ nome: a.nome, cognome: a.cognome, data_nascita: a.data_nascita ?? "", sesso: a.sesso, peso_kg: String(a.peso_kg ?? ""), categoria_peso: a.categoria_peso ?? "", disciplina: a.disciplina, serie: a.serie ?? "N", categoria: a.categoria ?? "SENIOR", coach: a.coach ?? "", totale_match: String(a.totale_match ?? 0), certificato_rilascio: a.certificato_rilascio ?? "", certificato_scadenza: a.certificato_scadenza ?? "", certificato_tipo: a.certificato_tipo ?? "", certificato_disciplina: a.certificato_disciplina ?? "" }); }}>Modifica</Button><Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => { if (confirm(`Eliminare ${a.nome} ${a.cognome}?`)) remove.mutate(a.id); }}>Elimina</Button></div></div>; })}</div></div>
  </div>;
}