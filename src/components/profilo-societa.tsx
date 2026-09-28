import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

type Profilo = Database["public"]["Tables"]["profiles"]["Row"];
const fields = [
  ["nome_societa", "Nome società"], ["codice_fiscale", "Codice fiscale società"], ["nome_coach", "Nome coach"], ["cognome_coach", "Cognome coach"], ["email", "Email"], ["telefono", "Telefono"], ["citta", "Città"], ["provincia", "Provincia"], ["partita_iva", "Partita IVA (opzionale)"], ["codice_affiliazione", "Codice affiliazione (opzionale)"],
] as const;

export function useLogoUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let attivo = true;
    if (!path) { setUrl(null); return; }
    supabase.storage.from("logos").createSignedUrl(path, 3600).then(({ data }) => { if (attivo) setUrl(data?.signedUrl ?? null); });
    return () => { attivo = false; };
  }, [path]);
  return url;
}

export function ProfiloSocieta({ profilo }: { profilo: Profilo | null | undefined }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const logoUrl = useLogoUrl(profilo?.logo_path);
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
  async function caricaLogo(file: File) {
    if (!profilo) return;
    setMessage(""); setUploading(true);
    try {
      if (file.size > 2_000_000) throw new Error("Il logo supera 2 MB.");
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      if (!["png", "jpg", "jpeg", "webp"].includes(ext)) throw new Error("Formato non supportato: usa PNG, JPG o WEBP.");
      const path = `${profilo.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("logos").upload(path, file);
      if (error) throw error;
      if (profilo.logo_path) await supabase.storage.from("logos").remove([profilo.logo_path]);
      const { error: agg } = await supabase.from("profiles").update({ logo_path: path }).eq("id", profilo.id);
      if (agg) throw agg;
      setMessage("Logo caricato.");
      qc.invalidateQueries({ queryKey: ["profilo"] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Caricamento non riuscito.");
    } finally {
      setUploading(false);
    }
  }
  async function rimuoviLogo() {
    if (!profilo?.logo_path) return;
    setMessage("");
    await supabase.storage.from("logos").remove([profilo.logo_path]);
    const { error } = await supabase.from("profiles").update({ logo_path: null }).eq("id", profilo.id);
    setMessage(error ? error.message : "Logo rimosso.");
    qc.invalidateQueries({ queryKey: ["profilo"] });
  }
  if (!profilo) return <p className="text-sm text-muted-foreground">Caricamento società…</p>;
  return <section className="max-w-[700px]"><h2 className="font-display text-xl uppercase">La mia società</h2>
    <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-border py-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-xl font-bold text-muted-foreground">{logoUrl ? <img src={logoUrl} alt={`Logo ${profilo.nome_societa}`} className="h-full w-full object-contain" /> : (profilo.nome_societa?.[0]?.toUpperCase() ?? "?")}</div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-[10px] border border-border px-4 py-2 text-sm font-medium hover:bg-muted">{uploading ? "Caricamento…" : profilo.logo_path ? "Cambia logo" : "Carica logo"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) caricaLogo(f); e.target.value = ""; }} /></label>
        {profilo.logo_path && <Button type="button" variant="outline" size="sm" onClick={rimuoviLogo}>Rimuovi logo</Button>}
        <span className="text-xs text-muted-foreground">PNG, JPG o WEBP · max 2 MB</span>
      </div>
    </div>
    <form onSubmit={(e) => { e.preventDefault(); setMessage(""); save.mutate(); }} className="mt-4 grid gap-4 sm:grid-cols-2">
    {fields.map(([key,label]) => <label key={key} className="text-xs text-muted-foreground">{label}<input value={form[key] ?? ""} type={key === "email" ? "email" : "text"} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm text-foreground" /></label>)}
    <div className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>Salva dati</Button>{message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}</div>
  </form></section>;
}
