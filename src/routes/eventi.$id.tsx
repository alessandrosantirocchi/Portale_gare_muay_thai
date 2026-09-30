import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvento, fetchIscrittiEvento, type Atleta } from "@/lib/queries";
import { formatDataCompleta, disciplineEvento, disciplinaCanonica, type FormatiIncontro } from "@/lib/format";
import { Pannello, Vuoto, Etichetta } from "@/components/ui-blocchi";
import { useSession } from "@/lib/auth";
import { IscrizioneEvento } from "@/components/iscrizione-evento";
import { useLocandinaPubblica } from "@/lib/locandine";

export const Route = createFileRoute("/eventi/$id")({
  head: () => ({
    meta: [
      { title: "Scheda evento — FIGHT HUB" },
      {
        name: "description",
        content: "Dettagli dell'evento, chiusura iscrizioni ed elenco degli atleti iscritti.",
      },
      { property: "og:title", content: "Scheda evento — FIGHT HUB" },
      {
        property: "og:description",
        content: "Informazioni sull'evento e iscrizione degli atleti della tua società.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedaEvento,
});

function SchedaEvento() {
  const { id } = useParams({ from: "/eventi/$id" });
  const { session } = useSession();
  const [cercaAbbinamento, setCercaAbbinamento] = useState("");

  const { data: evento, isLoading } = useQuery({
    queryKey: ["evento", id],
    queryFn: () => fetchEvento(id),
  });
  const { data: iscritti = [] } = useQuery({
    queryKey: ["iscritti", id],
    queryFn: () => fetchIscrittiEvento(id),
  });
  const { data: matches = [] } = useQuery({ queryKey: ["public-matches", id], queryFn: async () => { const { data, error } = await supabase.from("match_cards").select("id, numero, rosso_id, blu_id").eq("evento_id", id).eq("stato", "pubblicato").order("numero"); if (error) throw error; return data ?? []; } });
  const { data: pools = [] } = useQuery({ queryKey: ["public-pools", id], refetchInterval: 30000, queryFn: async () => { const { data, error } = await supabase.from("pools").select("id, numero, iscrizione_ids").eq("evento_id", id).eq("stato", "pubblicato").order("numero"); if (error) throw error; return data ?? []; } });
  const { data: mieiAtleti = [] } = useQuery({
    queryKey: ["miei-atleti", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atleti")
        .select("*")
        .eq("societa_id", session?.user.id ?? "")
        .order("cognome");
      if (error) throw error;
      return (data ?? []) as Atleta[];
    },
  });

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }
  if (!evento) {
    return (
      <div className="mx-auto max-w-[900px] px-5 py-20 text-center">
        <p className="text-sm text-muted-foreground">Evento non trovato.</p>
        <Link to="/calendario" className="mt-4 inline-block text-sm text-primary">
          Torna al calendario
        </Link>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <Link to="/calendario" className="text-[13px] text-muted-foreground hover:text-foreground">
        ← Calendario eventi
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
           <Etichetta>{disciplineEvento(evento).join(" · ")}</Etichetta>
           {Object.entries((evento.formati_incontro ?? {}) as FormatiIncontro).filter(([, formats]) => formats.length).map(([discipline, formats]) => <p key={discipline} className="mt-2 text-xs text-muted-foreground">{discipline}: {formats.join(" · ")}</p>)}
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase leading-none">
            {evento.nome}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{evento.descrizione}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Data</dt>
              <dd className="mt-1 font-display text-xl">{formatDataCompleta(evento.data_evento)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Orario</dt>
              <dd className="mt-1 text-sm">{evento.orario ?? "Da definire"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Luogo</dt>
              <dd className="mt-1 text-sm">
                {evento.sede}
                <br />
                {evento.luogo}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Fine iscrizioni
              </dt>
              <dd className="mt-1 text-sm text-primary">
                {formatDataCompleta(evento.fine_iscrizioni)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Iscritti</dt>
              <dd className="mt-1 font-display text-xl">{iscritti.length}</dd>
            </div>
          </dl>

          {evento.programma && (
            <>
              <h2 className="mt-8 mb-3 font-display text-xl font-semibold uppercase tracking-wide">
                Programma della giornata
              </h2>
              <Pannello className="divide-y divide-border overflow-hidden">
                {evento.programma
                  .split("\n")
                  .map((r) => r.trim())
                  .filter(Boolean)
                  .map((riga, idx) => (
                    <p key={idx} className="px-5 py-3 text-sm">
                      {riga}
                    </p>
                  ))}
              </Pannello>
            </>
          )}
         </div>

        <div className="lg:col-span-5">
          {evento.locandina_pubblicata && <LocandinaEvento path={evento.locandina_path} nome={evento.nome} />}
          <IscrizioneEvento evento={evento} atleti={mieiAtleti} userId={session?.user.id ?? null} />
        </div>
      </div>

      <section className="mt-9 border-t border-border pt-6" aria-label="Atleti iscritti e abbinamenti">
             <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-xl uppercase">Atleti iscritti e abbinamenti</h2><p className="mt-1 text-xs text-muted-foreground">{iscritti.length} atleti iscritti · {pools.length} pool · {matches.length} match pubblicati</p></div><label className="grid gap-1 text-xs text-muted-foreground">Cerca atleta o società<input type="search" value={cercaAbbinamento} onChange={(e) => setCercaAbbinamento(e.target.value)} placeholder="Nome, cognome o società" className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground sm:w-64" /></label></div>
             {(() => {
               const testo = cercaAbbinamento.trim().toLocaleLowerCase("it-IT");
               const corrisponde = (t: string) => !testo || t.includes(testo);
               const poolDi = new Map<string, number>();
               pools.forEach((p) => p.iscrizione_ids.forEach((entryId) => poolDi.set(entryId, p.iscrizione_ids.length)));
               const matchDi = new Map<string, number>();
               matches.forEach((m) => { if (m.numero != null) { matchDi.set(m.rosso_id, m.numero); matchDi.set(m.blu_id, m.numero); } });
               const abbrDisciplina: Record<string, string> = { "MUAY THAI": "MT", KICKBOXING: "KICK", K1: "K1", "FIGHT CODE": "FC", ALTRO: "ALTRO" };
               const righe = iscritti.filter((i: any) => corrisponde(`${i.nome} ${i.cognome} ${i.nome_societa}`.toLocaleLowerCase("it-IT")));
               const nome = (entryId: string) => { const i = iscritti.find((x: any) => x.id === entryId); return i ? `${i.cognome} ${i.nome} · ${i.nome_societa}` : "Atleta non disponibile"; };
               const matchVisibili = matches.filter((m) => corrisponde(`${nome(m.rosso_id)} ${nome(m.blu_id)}`.toLocaleLowerCase("it-IT")));
               return <>
                 {pools.length === 0 && matches.length === 0 && <p className="mt-5 border-y border-border py-5 text-sm text-muted-foreground">Gli abbinamenti non sono ancora stati pubblicati.</p>}
                 <div className="mt-5 overflow-x-auto">
                   <table className="w-full border-collapse text-sm">
                     <thead>
                       <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                         {["Cognome", "Nome", "Società", "Disc.", "Sesso", "Classe", "Cat. peso", "Peso (kg)", "Coach", "Pool"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                       {righe.length === 0 && <tr><td colSpan={10} className="px-2 py-4 text-sm text-muted-foreground">Nessun atleta trovato.</td></tr>}
                       {righe.map((i: any) => {
                         const pool = poolDi.get(i.id);
                         const match = matchDi.get(i.id);
                         return (
                           <tr key={i.id} className="transition-colors hover:bg-muted/40">
                             <td className="px-2 py-2 font-medium">{i.cognome}</td>
                             <td className="px-2 py-2">{i.nome}</td>
                             <td className="px-2 py-2 text-muted-foreground">{i.nome_societa}</td>
                             <td className="px-2 py-2 font-semibold text-primary">{abbrDisciplina[disciplinaCanonica(i.disciplina ?? "")] ?? (i.disciplina ?? "—")}</td>
                             <td className="px-2 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{i.snapshot_sesso ?? "—"}</span></td>
                             <td className="px-2 py-2 text-muted-foreground">{i.snapshot_serie ?? "—"}</td>
                             <td className="px-2 py-2 text-muted-foreground">{i.categoria ?? "—"}</td>
                             <td className="px-2 py-2">{i.peso_kg ?? "—"}</td>
                             <td className="px-2 py-2 text-muted-foreground">{i.snapshot_coach ?? "—"}</td>
                             <td className="px-2 py-2">{pool ? <span className="animate-pulse rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">Pool da {pool}</span> : match ? <span className="text-xs font-semibold text-primary">Match #{match}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
                 {matchVisibili.length > 0 && <div className="mt-6"><h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Match</h3><div className="grid gap-3 sm:grid-cols-2">{matchVisibili.map((m) => <div key={m.id} className="rounded-md border border-border bg-card p-4"><h4 className="border-b border-border pb-3 font-display text-lg uppercase">Match #{m.numero ?? "—"}</h4><div className="divide-y divide-border">{[m.rosso_id, m.blu_id].map((entryId, index) => <div key={`${entryId}-${index}`} className="flex items-center gap-3 py-2"><span className="shrink-0 text-xs text-muted-foreground">Angolo {index + 1}</span><span className="flex min-w-0 flex-col"><strong className="text-sm text-foreground">{nome(entryId)}</strong></span></div>)}</div></div>)}</div></div>}
               </>;
             })()}
      </section>
    </div>
  );
}

function LocandinaEvento({ path, nome }: { path: string | null; nome: string }) {
  const { data: url } = useLocandinaPubblica(path);
  if (!path || !url) return null;
  return (
    <Pannello className="mb-6 overflow-hidden">
      <img
        src={url}
        alt={`Locandina ufficiale dell'evento ${nome}`}
        loading="lazy"
        className="w-full object-cover"
      />
    </Pannello>
  );
}
