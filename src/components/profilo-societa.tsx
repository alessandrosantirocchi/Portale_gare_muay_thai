import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

type Profilo = Database["public"]["Tables"]["profiles"]["Row"];
const fields = [
  ["nome_societa", "Nome società"], ["codice_fiscale", "Codice fiscale società"], ["nome_coach", "Nome coach"], ["cognome_coach", "Cognome coach"], ["email", "Email"], ["telefono", "Telefono"], ["citta", "Città"], ["provincia", "Provincia"], ["partita_iva", "Partita IVA (opzionale)"], ["codice_affiliazione", "Codice affiliazione (opzionale)"],
] as const;

export function ProfiloSocieta({ profilo }: { profilo: Profilo | null | undefined }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  useEffect(() => { if (profilo) setForm(Object.fromEntries(fields.map(([key]) => [key, String(profilo[key] ?? "")]))); }, [profilo]);
  const save = useMutation({
    mutationFn: async () => {
      if (!profilo) throw new Error("Profilo non disponibile.");
      const nome = form["nome_societa"]?.trim().replace(/\s+/g, " ").replace(/\s+(ASD|A\.S\.D\.)$/i, "").trim();
      if (!nome) throw new Error("Inserisci il nome della società.");
      const { error } = await supabase.from("profiles").update({
        nome_societa: nome, codice_fiscale: form["codice_fiscale"]?.replace(/\s+/g, "").toUpperCase() || null,
        nome_coach: form["nome_coach"]?.trim() || null, cognome_coach: form["cognome_coach"]?.trim() || null,
        email: form["email"]?.trim() || null, telefono: form["telefono"]?.trim() || null, citta: form["citta"]?.trim() || null,
        provincia: form["provincia"]?.trim() || null, partita_iva: form["partita_iva"]?.trim() || null,
        codice_affiliazione: form["codice_affiliazione"]?.trim() || null,
      }).eq("id", profilo.id);
      if (error) throw error;
    },
    onSuccess: () => { setMessage("Dati società salvati."); qc.invalidateQueries({ queryKey: ["profilo"] }); },
    onError: (e) => setMessage(e.message),
  });
  if (!profilo) return <p className="text-sm text-muted-foreground">Caricamento società…</p>;
  return <section className="max-w-[700px]"><h2 className="font-display text-xl uppercase">La mia società</h2><form onSubmit={(e) => { e.preventDefault(); setMessage(""); save.mutate(); }} className="mt-4 grid gap-4 sm:grid-cols-2">
    {fields.map(([key,label]) => <label key={key} className="text-xs text-muted-foreground">{label}<input value={form[key] ?? ""} type={key === "email" ? "email" : "text"} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm text-foreground" /></label>)}
    <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>Salva dati</Button>{message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}</div>
  </form></section>;
}