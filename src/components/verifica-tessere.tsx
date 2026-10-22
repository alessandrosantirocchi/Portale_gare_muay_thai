import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function StatoTesseraBadge({ stato }: { stato: string | null | undefined }) {
  if (stato === "verificato") return <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">✓ Verificato</span>;
  if (stato === "irregolare") return <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">Tessera irregolare</span>;
  return <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">In verifica</span>;
}

export function StrisciaIrregolare({ note }: { note?: string | null }) {
  return <div role="alert" className="mb-2 w-full rounded-md border-l-8 border-destructive bg-destructive px-3 py-2 text-sm font-bold uppercase tracking-wide text-destructive-foreground">⚠ Tesseramento irregolare{note ? <span className="block text-xs font-medium normal-case">{note}</span> : null}</div>;
}

type Riga = { key: string; atleta_id: string; cognome: string; nome: string; team: string; tessera_opes: string | null; tessera_fight1: string | null; tessera_stato: string | null; tessera_note: string | null };

export function VerificaTessere({ admin, userId }: { admin: boolean; userId: string }) {
  const qc = useQueryClient();
  const [eventoId, setEventoId] = useState(admin ? "__tutti" : "");
  const [msg, setMsg] = useState("");
  const [filtro, setFiltro] = useState("tutti");
  const [cerca, setCerca] = useState("");
  const { data: eventi = [] } = useQuery({ queryKey: ["eventi-verifica", admin, userId], queryFn: async () => { let q = supabase.from("eventi").select("id,nome,data_evento"); if (!admin) q = q.eq("organizzatore_id", userId); const { data, error } = await q.order("data_evento", { ascending: false }); if (error) throw error; return data ?? []; } });
  const { data: righe = [], isLoading } = useQuery({
    queryKey: ["verifica-tessere", eventoId], enabled: !!eventoId,
    queryFn: async (): Promise<Riga[]> => {
      if (eventoId === "__tutti") {
        const { data, error } = await supabase.from("atleti").select("id, nome, cognome, nome_societa, tessera_opes, tessera_fight1, tessera_stato, tessera_note").order("cognome");
        if (error) throw error;
        const ordine: Record<string, number> = { in_attesa: 0, irregolare: 1, verificato: 2 };
        return (data ?? []).map((a) => ({ key: a.id, atleta_id: a.id, cognome: a.cognome, nome: a.nome, team: a.nome_societa, tessera_opes: a.tessera_opes, tessera_fight1: a.tessera_fight1, tessera_stato: a.tessera_stato, tessera_note: a.tessera_note }))
          .sort((x, y) => (ordine[x.tessera_stato ?? "in_attesa"] ?? 0) - (ordine[y.tessera_stato ?? "in_attesa"] ?? 0));
      }
      const [isc, docs] = await Promise.all([
        supabase.from("iscrizioni").select("id, snapshot_nome, snapshot_cognome, snapshot_team").eq("evento_id", eventoId),
        supabase.rpc("documenti_iscritti_evento", { p_evento_id: eventoId }),
      ]);
      if (isc.error) throw isc.error; if (docs.error) throw docs.error;
      return (docs.data ?? []).map((d) => { const i = isc.data?.find((x) => x.id === d.iscrizione_id); return { key: d.iscrizione_id, atleta_id: d.atleta_id, cognome: i?.snapshot_cognome ?? "", nome: i?.snapshot_nome ?? "", team: i?.snapshot_team ?? "", tessera_opes: d.tessera_opes, tessera_fight1: d.tessera_fight1, tessera_stato: d.tessera_stato, tessera_note: d.tessera_note }; });
    },
  });
  async function imposta(atletaId: string, stato: string) {
    let note: string | null = null;
    if (stato === "irregolare") { note = window.prompt("Motivo dell'irregolarità (visibile alla società):", "") ; if (note === null) return; }
    setMsg("");
    const { error } = await supabase.rpc("verifica_tessera_atleta", { p_atleta_id: atletaId, p_stato: stato, p_note: note ?? "" });
    setMsg(error ? error.message : "Stato aggiornato.");
    for (const k of ["verifica-tessere", "match-documenti", "miei-atleti"]) qc.invalidateQueries({ queryKey: [k] });
  }
  const q = cerca.trim().toLocaleLowerCase("it-IT");
  const visibili = righe.filter((r) => (filtro === "tutti" || r.tessera_stato === filtro) && (!q || `${r.nome} ${r.cognome} ${r.team} ${r.tessera_opes ?? ""} ${r.tessera_fight1 ?? ""}`.toLocaleLowerCase("it-IT").includes(q)));
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-muted-foreground">Elenco<select value={eventoId} onChange={(e) => setEventoId(e.target.value)} className="mt-1 block rounded-md border border-input bg-background p-2 text-sm text-foreground">{admin ? <option value="__tutti">Tutti gli atleti della piattaforma</option> : <option value="">— Scegli evento —</option>}{eventi.map((e) => <option key={e.id} value={e.id}>{e.nome} · {e.data_evento}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">Stato<select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="mt-1 block rounded-md border border-input bg-background p-2 text-sm text-foreground"><option value="tutti">Tutti</option><option value="in_attesa">In verifica</option><option value="verificato">Verificati</option><option value="irregolare">Irregolari</option></select></label>
      <label className="text-xs text-muted-foreground">Cerca<input value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Nome, società, n. tessera" className="mt-1 block rounded-md border border-input bg-background p-2 text-sm text-foreground" /></label>
      {eventoId && !isLoading && <span className="text-xs text-muted-foreground">{visibili.length} atleti</span>}
      {msg && <p role="status" className="text-xs text-muted-foreground">{msg}</p>}
    </div>
    {eventoId && <div className="divide-y divide-border border-y border-border">
      {isLoading && <p className="py-4 text-sm text-muted-foreground">Caricamento…</p>}
      {!isLoading && visibili.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nessun atleta.</p>}
      {visibili.map((r) => <div key={r.key} className="py-3">
        {r.tessera_stato === "irregolare" && <StrisciaIrregolare note={r.tessera_note} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{r.cognome} {r.nome} <span className="text-xs font-normal text-muted-foreground">· {r.team}</span></p>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><StatoTesseraBadge stato={r.tessera_stato} /><span>OPES: <b className="text-foreground">{r.tessera_opes || "—"}</b></span><span>Fight 1: <b className="text-foreground">{r.tessera_fight1 || "—"}</b></span></p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={r.tessera_stato === "verificato"} onClick={() => imposta(r.atleta_id, "verificato")}>✓ Verificato</Button>
            <Button size="sm" variant="destructive" onClick={() => imposta(r.atleta_id, "irregolare")}>Irregolare</Button>
            {r.tessera_stato !== "in_attesa" && <Button size="sm" variant="outline" onClick={() => imposta(r.atleta_id, "in_attesa")}>Annulla</Button>}
          </div>
        </div>
      </div>)}
    </div>}
  </div>;
}
