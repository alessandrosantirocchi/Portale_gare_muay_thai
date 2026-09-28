import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAtleti, type Atleta } from "@/lib/queries";
import { formatDataBreve, iniziali } from "@/lib/format";
import { Pannello, SezioneTitolo, Vuoto } from "@/components/ui-blocchi";

export const Route = createFileRoute("/atleti")({
  head: () => ({
    meta: [
      { title: "Le mie iscrizioni — FIGHT HUB" },
      {
        name: "description",
        content:
          "Cerca il tuo nome e controlla tutte le iscrizioni agli eventi con lo stato: confermata, in attesa o respinta.",
      },
      { property: "og:title", content: "Le mie iscrizioni — FIGHT HUB" },
      {
        property: "og:description",
        content:
          "Ogni atleta può verificare lo stato delle proprie iscrizioni agli eventi FIGHT HUB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaAtleti,
});

type IscrizioneAtleta = {
  id: string;
  stato: string;
  categoria_peso: string | null;
  disciplina: string | null;
  created_at: string;
  eventi: {
    nome: string;
    data_evento: string;
    luogo: string;
    disciplina: string;
  } | null;
};

function PaginaAtleti() {
  const [ricerca, setRicerca] = useState("");
  const [selezionato, setSelezionato] = useState<Atleta | null>(null);

  const { data: atleti = [], isLoading } = useQuery({
    queryKey: ["atleti"],
    queryFn: fetchAtleti,
  });

  const risultati = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    if (q.length < 2) return [];
    return atleti
      .filter((a) =>
        `${a.nome} ${a.cognome} ${a.nome_societa}`.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [atleti, ricerca]);

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Atleti
      </p>
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">
        Le mie iscrizioni
      </h1>
      <p className="mt-2 max-w-[640px] text-sm text-muted-foreground">
        Cerca il tuo nome o quello della tua società e controlla lo stato di
        ogni iscrizione: confermata, in attesa oppure respinta.
      </p>

      <Pannello className="mt-6 p-5">
        <label className="text-[12px] font-medium text-muted-foreground">
          Cerca atleta
          <input
            value={ricerca}
            onChange={(e) => {
              setRicerca(e.target.value);
              setSelezionato(null);
            }}
            placeholder="Nome, cognome o società"
            className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && ricerca.trim().length >= 2 && risultati.length === 0 && (
          <Vuoto testo="Nessun atleta trovato." />
        )}

        {risultati.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {risultati.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelezionato(a)}
                className={
                  selezionato?.id === a.id
                    ? "flex items-center gap-3 rounded-[12px] border border-primary bg-primary/10 px-3 py-2.5 text-left"
                    : "flex items-center gap-3 rounded-[12px] border border-border px-3 py-2.5 text-left hover:bg-muted"
                }
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted font-display text-[13px] font-semibold">
                  {iniziali(a.nome, a.cognome)}
                </span>
                <span>
                  <span className="block text-sm font-medium">
                    {a.cognome} {a.nome}
                  </span>
                  <span className="block text-[12px] text-muted-foreground">
                    {a.nome_societa} · {a.disciplina}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Pannello>

      {selezionato && <IscrizioniAtleta atleta={selezionato} />}
    </div>
  );
}

function IscrizioniAtleta({ atleta }: { atleta: Atleta }) {
  const { data: iscrizioni = [], isLoading } = useQuery({
    queryKey: ["iscrizioni-atleta", atleta.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iscrizioni")
        .select(
          "id, stato, categoria_peso, disciplina, created_at, eventi(nome, data_evento, luogo, disciplina)",
        )
        .eq("atleta_id", atleta.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as IscrizioneAtleta[];
    },
  });

  return (
    <section className="mt-10">
      <SezioneTitolo
        titolo={`${atleta.cognome} ${atleta.nome}`}
        azione={
          <span className="text-[12px] text-muted-foreground">
            {atleta.nome_societa} · {atleta.punti} punti
          </span>
        }
      />
      <Pannello className="divide-y divide-border overflow-hidden">
        {isLoading && <Vuoto testo="Caricamento iscrizioni…" />}
        {!isLoading && iscrizioni.length === 0 && (
          <Vuoto testo="Questo atleta non ha ancora iscrizioni." />
        )}
        {iscrizioni.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <div>
              <p className="text-sm font-medium">
                {i.eventi?.nome ?? "Evento"}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {formatDataBreve(i.eventi?.data_evento)}
                {i.eventi?.luogo ? ` · ${i.eventi.luogo}` : ""} ·{" "}
                {i.disciplina || i.eventi?.disciplina || atleta.disciplina}
                {i.categoria_peso ? ` · ${i.categoria_peso}` : ""}
              </p>
            </div>
            <StatoIscrizione stato={i.stato} />
          </div>
        ))}
      </Pannello>
    </section>
  );
}

function StatoIscrizione({ stato }: { stato: string }) {
  const base =
    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide";
  if (stato === "confermata")
    return (
      <span className={`${base} bg-emerald-500/15 text-emerald-400`}>
        Confermata
      </span>
    );
  if (stato === "respinta")
    return (
      <span className={`${base} bg-destructive/15 text-destructive`}>
        Respinta
      </span>
    );
  return (
    <span className={`${base} bg-muted text-muted-foreground`}>{stato}</span>
  );
}
