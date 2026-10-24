import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Atleta = { id: string; nome: string; cognome: string; nome_societa: string; data_nascita: string | null; fermo_medico: boolean; fermo_medico_fino_al: string | null; fermo_medico_note: string | null };

export function fermoAttivo(a: { fermo_medico?: boolean | null; fermo_medico_fino_al?: string | null }, data?: string) {
  if (!a.fermo_medico) return false;
  const rif = data ?? new Date().toISOString().slice(0, 10);
  return !a.fermo_medico_fino_al || a.fermo_medico_fino_al >= rif;
}

export function BadgeFermo({ fino }: { fino: string | null }) {
  return <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">Fermo medico{fino ? ` fino al ${fino.split("-").reverse().join("/")}` : ""}</span>;
}

function Riga({ a }: { a: Atleta }) {
  const qc = useQueryClient();
  const [attivo, setAttivo] = useState(a.fermo_medico);
  const [fino, setFino] = useState(a.fermo_medico_fino_al ?? "");
  const [note, setNote] = useState(a.fermo_medico_note ?? "");
  const [msg, setMsg] = useState("");
  async function salva() {
    setMsg("");
    const { error } = await supabase.from("atleti").update({ fermo_medico: attivo, fermo_medico_fino_al: attivo && fino ? fino : null, fermo_medico_note: attivo ? note || null : null }).eq("id", a.id);
    setMsg(error ? error.message : "Salvato");
    for (const k of ["fermo-medico", "miei-atleti"]) qc.invalidateQueries({ queryKey: [k] });
  }
  return (
    <tr className={`border-t border-border ${fermoAttivo(a) ? "bg-destructive/10" : ""}`}>
      <td className="p-2 text-sm font-medium">{a.cognome} {a.nome}</td>
      <td className="p-2 text-xs text-muted-foreground">{a.nome_societa}</td>
      <td className="p-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={attivo} onChange={(e) => setAttivo(e.target.checked)} /> Fermo</label></td>
      <td className="p-2"><input type="date" disabled={!attivo} value={fino} onChange={(e) => setFino(e.target.value)} className="w-[150px] rounded-md border border-input bg-background p-1.5 text-sm" /></td>
      <td className="p-2"><input disabled={!attivo} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motivo" className="w-full min-w-[140px] rounded-md border border-input bg-background p-1.5 text-sm" /></td>
      <td className="p-2 whitespace-nowrap"><Button size="sm" type="button" onClick={salva}>Salva</Button> <span className="text-[11px] text-muted-foreground">{msg}</span></td>
    </tr>
  );
}

export function FermoMedico() {
  const [cerca, setCerca] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  const { data = [], isLoading } = useQuery({
    queryKey: ["fermo-medico"],
    queryFn: async (): Promise<Atleta[]> => {
      const { data, error } = await supabase.from("atleti").select("id, nome, cognome, nome_societa, data_nascita, fermo_medico, fermo_medico_fino_al, fermo_medico_note").order("cognome");
      if (error) throw error;
      return data ?? [];
    },
  });
  const q = cerca.trim().toLocaleLowerCase("it-IT");
  const vis = data.filter((a) => (filtro === "tutti" || (filtro === "fermo") === fermoAttivo(a)) && (!q || `${a.nome} ${a.cognome} ${a.nome_societa}`.toLocaleLowerCase("it-IT").includes(q)));
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Gli atleti in fermo medico non possono essere iscritti a gare che si svolgono entro la data indicata. Senza data, il fermo vale finché non lo togli.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted-foreground">Cerca<input value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Nome o società" className="mt-1 block rounded-md border border-input bg-background p-2 text-sm text-foreground" /></label>
        <label className="text-xs text-muted-foreground">Mostra<select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="mt-1 block rounded-md border border-input bg-background p-2 text-sm text-foreground"><option value="tutti">Tutti</option><option value="fermo">In fermo medico</option><option value="liberi">Non bloccati</option></select></label>
        {!isLoading && <span className="text-xs text-muted-foreground">{vis.length} atleti</span>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-muted text-[11px] uppercase text-muted-foreground"><tr><th className="p-2">Atleta</th><th className="p-2">Società</th><th className="p-2">Fermo</th><th className="p-2">Fino al</th><th className="p-2">Note</th><th className="p-2"></th></tr></thead>
          <tbody>{vis.map((a) => <Riga key={a.id} a={a} />)}</tbody>
        </table>
        {isLoading && <p className="p-3 text-sm text-muted-foreground">Caricamento…</p>}
      </div>
    </div>
  );
}
