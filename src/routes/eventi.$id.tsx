import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvento, fetchIscrittiEvento, type Atleta } from "@/lib/queries";
import { formatDataCompleta, disciplineEvento, disciplinaCanonica, type FormatiIncontro } from "@/lib/format";
import { Pannello, Vuoto, Etichetta } from "@/components/ui-blocchi";
import { useSession } from "@/lib/auth";
import { IscrizioneEvento } from "@/components/iscrizione-evento";
import { useLocandina } from "@/lib/locandine";

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

          <h2 className="mt-8 mb-3 font-display text-xl font-semibold uppercase tracking-wide">
            Atleti iscritti
          </h2>
          <Pannello className="divide-y divide-border overflow-hidden">
            {iscritti.length === 0 && <Vuoto testo="Nessun atleta iscritto per ora." />}
            {iscritti.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {i.nome} {i.cognome}
                  </p>
                  <p className="text-[12px] text-muted-foreground">{i.nome_societa}</p>
                </div>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {i.categoria ?? `${i.peso_kg ?? "—"} kg`} · {i.stato}
                </span>
              </div>
            ))}
          </Pannello>
         </div>

        <div className="lg:col-span-5">
          {evento.locandina_pubblicata && <LocandinaEvento path={evento.locandina_path} nome={evento.nome} />}
          <IscrizioneEvento evento={evento} atleti={mieiAtleti} userId={session?.user.id ?? null} />
        </div>
      </div>
    </div>
  );
}

function LocandinaEvento({ path, nome }: { path: string | null; nome: string }) {
  const { data: url } = useLocandina(path);
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
