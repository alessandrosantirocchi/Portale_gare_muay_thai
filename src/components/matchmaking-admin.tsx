import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { compatibilita, datiGara, motivoSenzaMatch, proponiAbbinamenti, type Iscrizione } from "@/lib/fight-hub";
import type { Evento } from "@/lib/queries";
import { esportaMatchCard } from "@/lib/export-match-card";

export function MatchmakingAdmin({ admin, userId }: { admin: boolean; userId: string }) {
  const qc = useQueryClient();
  const [eventoId, setEventoId] = useState("");
  const [editingPool, setEditingPool] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const { data: eventi = [] } = useQuery({ queryKey: ["eventi-admin-match"], queryFn: async () => { let richiesta = supabase.from("eventi").select("*"); if (!admin) richiesta = richiesta.eq("organizzatore_id", userId); const { data, error } = await richiesta.order("data_evento", { ascending: false }); if (error) throw error; return data as Evento[]; } });
  const evento = eventi.find((e) => e.id === eventoId);
  const { data: iscrizioni = [] } = useQuery({ queryKey: ["match-iscrizioni", eventoId], enabled: !!eventoId, queryFn: async () => { const { data, error } = await supabase.from("iscrizioni").select("*, atleti(nome,cognome,nome_societa,sesso,data_nascita,peso_kg,disciplina,serie,categoria,totale_match)").eq("evento_id", eventoId).eq("stato", "confermata"); if (error) throw error; return data as Iscrizione[]; } });
  const { data: cards = [] } = useQuery({ queryKey: ["match-cards", eventoId], enabled: !!eventoId, queryFn: async () => { const { data, error } = await supabase.from("match_cards").select("*").eq("evento_id", eventoId).order("numero"); if (error) throw error; return data ?? []; } });
  const { data: pools = [] } = useQuery({ queryKey: ["match-pools", eventoId], enabled: !!eventoId, refetchInterval: 30000, queryFn: async () => { const { data, error } = await supabase.from("pools").select("*").eq("evento_id", eventoId).order("numero"); if (error) throw error; return data ?? []; } });
  const occupati = new Set([...cards.flatMap((c) => [c.rosso_id, c.blu_id]), ...pools.flatMap((p) => p.iscrizione_ids)]);
  const liberi = iscrizioni.filter((i) => !occupati.has(i.id));
  const proposta = evento ? proponiAbbinamenti(liberi, evento.data_evento) : { coppie: [], senzaMatch: [] };
  const poolDi = (id: string) => pools.find((p) => p.iscrizione_ids.includes(id));
  const matchDi = (id: string) => cards.find((c) => c.rosso_id === id || c.blu_id === id);
  const name = (id: string) => { const i = iscrizioni.find((v) => v.id === id); if (!i || !evento) return "—"; const d = datiGara(i, evento.data_evento); return `${d.cognome} ${d.nome} · ${d.team} · ${d.peso ?? "—"} kg`; };
  const refresh = () => { qc.invalidateQueries({ queryKey: ["match-cards", eventoId] }); qc.invalidateQueries({ queryKey: ["match-pools", eventoId] }); qc.invalidateQueries({ queryKey: ["public-pools", eventoId] }); qc.invalidateQueries({ queryKey: ["public-matches", eventoId] }); };
  async function run(action: () => PromiseLike<{ error: { message: string } | null }>, success = "Salvato.") { setMsg(""); try { const { error } = await action(); if (error) throw error; setMsg(success); refresh(); } catch (e) { setMsg(e instanceof Error ? e.message : "Operazione non riuscita."); } }
  async function addMatch(a: string, b: string) { if (!evento || a === b || occupati.has(a) || occupati.has(b)) return; const ai = iscrizioni.find((i) => i.id === a), bi = iscrizioni.find((i) => i.id === b); const score = ai && bi ? compatibilita(ai, bi, evento.data_evento)?.score ?? null : null; await run(() => supabase.from("match_cards").insert({ evento_id: evento.id, rosso_id: a, blu_id: b, numero: Math.max(0, ...cards.map((c) => c.numero ?? 0)) + 1, score }), "Match creato."); }
  async function editPool(id: string, ids: string[], autoGenerato: boolean) {
    if (ids.length < 2 || ids.length > 4 || new Set(ids).size !== ids.length || ids.some((athlete) => occupati.has(athlete) && !pools.some((p) => p.id === id && p.iscrizione_ids.includes(athlete)))) return;
    await run(() => supabase.from("pools").update({ iscrizione_ids: ids, auto_generato: false, ...(autoGenerato ? { stato: "confermato" } : {}) }).eq("id", id), "Pool aggiornato.");
    setEditingPool(null);
  }
  async function splitPool(id: string, ids: string[]) {
    if (!evento || ids.length !== 4) return;
    setMsg("");
    const numero = Math.max(0, ...cards.map((c) => c.numero ?? 0));
    const pairs = [[ids[0], ids[1]], [ids[2], ids[3]]];
    const rows = pairs.map(([a, b], index) => {
      const first = iscrizioni.find((i) => i.id === a), second = iscrizioni.find((i) => i.id === b);
      return { evento_id: evento.id, rosso_id: a ?? "", blu_id: b ?? "", numero: numero + index + 1, score: first && second ? compatibilita(first, second, evento.data_evento)?.score ?? null : null };
    });
    const removed = await supabase.from("pools").delete().eq("id", id);
    if (removed.error) { setMsg(removed.error.message); return; }
    const inserted = await supabase.from("match_cards").insert(rows);
    if (inserted.error) { await supabase.from("pools").insert({ evento_id: evento.id, iscrizione_ids: ids, auto_generato: false, stato: "confermato" }); setMsg(inserted.error.message); } else setMsg("Pool trasformato in due match.");
    refresh();
  }
  async function esporta() {
    if (!evento) return;
    setMsg("");
    try { await esportaMatchCard(evento, iscrizioni, cards, pools); }
    catch (error) { setMsg(error instanceof Error ? error.message : "Impossibile esportare l'Excel."); }
  }
  const selectClass = "rounded-md border border-input bg-background p-2 text-sm text-foreground";
  const badge = (id: string) => { const pool = poolDi(id); const match = matchDi(id); if (pool) return <span className="animate-pulse rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">Pool da {pool.iscrizione_ids.length}</span>; if (match) return <span className="text-xs font-semibold text-primary">Match #{match.numero ?? "—"}</span>; return <span className="text-xs text-muted-foreground">—</span>; };
  const rigaAtleta = (i: Iscrizione, extra?: React.ReactNode) => {
    const d = evento ? datiGara(i, evento.data_evento) : null;
    return <div key={i.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(5,minmax(0,0.6fr))_minmax(0,0.9fr)] items-center gap-2 border-b border-border px-2 py-2 text-xs last:border-b-0">
      <span className="min-w-0 truncate font-semibold text-foreground">{d?.cognome} {d?.nome}</span>
      <span className="min-w-0 truncate text-muted-foreground">{d?.team}</span>
      <span className="text-muted-foreground">{d?.disciplina}</span>
      <span className="text-muted-foreground">{d?.sesso}</span>
      <span className="text-muted-foreground">{d?.serie}</span>
      <span className="text-muted-foreground">{i.categoria_peso ?? "—"}</span>
      <span className="text-muted-foreground">{d?.peso ?? "—"} kg</span>
      <span className="flex items-center gap-2">{badge(i.id)}{extra}</span>
    </div>;
  };
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><label className="grid gap-1 text-xs text-muted-foreground">Evento<select className={selectClass} value={eventoId} onChange={(e) => { setEventoId(e.target.value); }}><option value="">Seleziona evento…</option>{eventi.map((e) => <option key={e.id} value={e.id}>{e.nome} · {e.data_evento}</option>)}</select></label>{evento && <Button variant="outline" onClick={esporta}>Esporta Excel</Button>}</div>
    {evento && <><p className="text-sm text-muted-foreground">{iscrizioni.length} iscritti confermati · {cards.length} match · {pools.length} pool · {liberi.length} senza abbinamento</p>
    <section><h2 className="mb-3 font-display text-xl uppercase">Atleti iscritti</h2><div className="rounded-md border border-border"><div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(5,minmax(0,0.6fr))_minmax(0,0.9fr)] gap-2 border-b border-border bg-muted/40 px-2 py-2 text-[11px] font-semibold uppercase text-muted-foreground"><span>Atleta</span><span>Società</span><span>Disciplina</span><span>Sesso</span><span>Classe</span><span>Cat. peso</span><span>Peso</span><span>Abbinamento</span></div>{iscrizioni.map((i) => rigaAtleta(i))}{iscrizioni.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Nessun iscritto confermato.</p>}</div></section>
    <section><h2 className="mb-3 font-display text-xl uppercase">Proposte automatiche</h2><div className="space-y-2">{proposta.coppie.map(({ a, b, c }) => <div key={`${a.id}-${b.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm"><div><strong>{name(a.id)}</strong> vs <strong>{name(b.id)}</strong><p className="text-xs text-muted-foreground">Compatibilità {c.score}/100 · Δ peso {c.peso ?? "—"} kg · Δ età {c.eta ?? "—"} · Δ esperienza {c.esperienza} · {datiGara(a, evento.data_evento).disciplina} · {datiGara(a, evento.data_evento).serie} · {datiGara(a, evento.data_evento).categoria}</p></div><Button size="sm" onClick={() => addMatch(a.id, b.id)}>Conferma match</Button></div>)}{!proposta.coppie.length && <p className="text-sm text-muted-foreground">Nessuna proposta disponibile.</p>}</div></section>
    <section><h2 className="mb-3 font-display text-xl uppercase">Match card</h2>{cards.map((c) => <div key={c.id} className="border-b border-border py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>#{c.numero} · Rosso: {name(c.rosso_id)} / Blu: {name(c.blu_id)} · {c.score ?? "—"}/100</span><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditingMatch(editingMatch === c.id ? null : c.id)}>Modifica</Button><Button size="sm" variant="outline" onClick={() => run(() => supabase.from("match_cards").update({ rosso_id: c.blu_id, blu_id: c.rosso_id }).eq("id", c.id))}>Scambia angoli</Button><Button size="sm" variant="outline" onClick={() => run(() => supabase.from("match_cards").update({ stato: c.stato === "pubblicato" ? "confermato" : "pubblicato" }).eq("id", c.id))}>{c.stato === "pubblicato" ? "Nascondi" : "Pubblica"}</Button><Button size="sm" variant="destructive" onClick={() => run(() => supabase.from("match_cards").delete().eq("id", c.id))}>Rimuovi</Button></div></div>{editingMatch === c.id && <div className="mt-3 flex flex-wrap gap-2">{(["rosso_id", "blu_id"] as const).map((angolo) => <label key={angolo} className="grid gap-1 text-xs">{angolo === "rosso_id" ? "Angolo rosso" : "Angolo blu"}<select className={selectClass} value={c[angolo]} onChange={async (e) => { if (e.target.value === c[angolo === "rosso_id" ? "blu_id" : "rosso_id"]) return; await run(() => supabase.from("match_cards").update(angolo === "rosso_id" ? { rosso_id: e.target.value } : { blu_id: e.target.value }).eq("id", c.id)); }}><option value={c[angolo]}>{name(c[angolo])}</option>{liberi.map((i) => <option key={i.id} value={i.id}>{name(i.id)}</option>)}</select></label>)}</div>}</div>)}{cards.length === 0 && <p className="text-sm text-muted-foreground">Nessun match.</p>}</section>
    <section><h2 className="mb-3 font-display text-xl uppercase">Pool</h2>{pools.map((p) => <div key={p.id} className="border-b border-border py-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold"><span className="animate-pulse rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">Pool da {p.iscrizione_ids.length}</span> <span className="ml-2">#{p.numero}</span> <span className="font-normal text-muted-foreground">· {p.auto_generato ? "Automatico" : "Manuale"} · {p.stato}</span></p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditingPool(editingPool === p.id ? null : p.id)}>Modifica</Button><Button size="sm" variant="outline" onClick={() => run(() => supabase.from("pools").update({ stato: p.stato === "pubblicato" ? "confermato" : "pubblicato", auto_generato: false }).eq("id", p.id))}>{p.stato === "pubblicato" ? "Nascondi" : "Pubblica"}</Button>{p.iscrizione_ids.length === 4 && <Button size="sm" variant="outline" onClick={() => splitPool(p.id, p.iscrizione_ids)}>In match singoli</Button>}<Button size="sm" variant="destructive" onClick={() => run(() => supabase.from("pools").delete().eq("id", p.id), "Pool sciolto.")}>Sciogli</Button></div></div><div className="mt-3 rounded-md border border-border">{p.iscrizione_ids.map((id) => { const i = iscrizioni.find((v) => v.id === id); return i ? rigaAtleta(i) : null; })}</div>{editingPool === p.id && <div className="mt-3 flex flex-wrap items-end gap-2">{p.iscrizione_ids.map((id, index) => <label key={`${p.id}-${index}`} className="grid gap-1 text-xs">Atleta {index + 1}<select className={selectClass} value={id} onChange={(e) => { const next = [...p.iscrizione_ids]; next[index] = e.target.value; editPool(p.id, next, p.auto_generato); }}><option value={id}>{name(id)}</option>{liberi.map((athlete) => <option key={athlete.id} value={athlete.id}>{name(athlete.id)}</option>)}</select></label>)}{p.iscrizione_ids.length < 4 && <select aria-label="Aggiungi atleta al pool" className={selectClass} value="" onChange={(e) => editPool(p.id, [...p.iscrizione_ids, e.target.value], p.auto_generato)}><option value="">Aggiungi atleta…</option>{liberi.map((athlete) => <option key={athlete.id} value={athlete.id}>{name(athlete.id)}</option>)}</select>}{p.iscrizione_ids.length > 2 && <Button variant="outline" size="sm" onClick={() => editPool(p.id, p.iscrizione_ids.slice(0, -1), p.auto_generato)}>Rimuovi ultimo</Button>}</div>}</div>)}{pools.length === 0 && <p className="text-sm text-muted-foreground">Nessun pool compatibile.</p>}</section>
    <section><h2 className="mb-3 font-display text-xl uppercase">Atleti senza match</h2><div className="rounded-md border border-border">{liberi.map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-2 py-2 text-xs last:border-b-0">{rigaAtleta(i)}<span className="px-2 text-muted-foreground">{motivoSenzaMatch(i, liberi, evento.data_evento)}</span></div>)}{liberi.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Tutti gli iscritti sono abbinati.</p>}</div></section>{msg && <p role="status" className="text-sm text-muted-foreground">{msg}</p>}</>}
  </div>;
}
