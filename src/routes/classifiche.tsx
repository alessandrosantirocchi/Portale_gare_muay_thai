import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAtleti } from "@/lib/queries";
import { DISCIPLINE, iniziali } from "@/lib/format";
import { Pannello, Vuoto } from "@/components/ui-blocchi";
import { FiltriDisciplina } from "@/components/tabella-eventi";

export const Route = createFileRoute("/classifiche")({
  head: () => ({
    meta: [
      { title: "Classifiche atleti — FIGHT HUB" },
      {
        name: "description",
        content:
          "Ranking ufficiale degli atleti: punti, vittorie, sconfitte e pareggi per ogni disciplina.",
      },
      { property: "og:title", content: "Classifiche atleti — FIGHT HUB" },
      {
        property: "og:description",
        content: "Punteggi e record degli atleti per disciplina e categoria di peso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Classifiche,
});

function Classifiche() {
  const [disciplina, setDisciplina] = useState("Tutti");
  const { data: atleti = [], isLoading } = useQuery({ queryKey: ["atleti"], queryFn: fetchAtleti });
  const filtrati =
    disciplina === "Tutti" ? atleti : atleti.filter((a) => a.disciplina === disciplina);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">Classifiche</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
        Punteggi aggiornati degli atleti tesserati, ordinati per punti conquistati in stagione.
      </p>

      <div className="mt-6">
        <FiltriDisciplina valore={disciplina} onChange={setDisciplina} opzioni={DISCIPLINE} />
      </div>

      <Pannello className="mt-5 overflow-hidden">
        <div className="hidden grid-cols-12 gap-4 border-b border-border px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:grid">
          <span className="col-span-1">Pos</span>
          <span className="col-span-4">Atleta</span>
          <span className="col-span-3">Società</span>
          <span className="col-span-2">Disciplina</span>
          <span className="col-span-1 text-right">W-L-D</span>
          <span className="col-span-1 text-right">Punti</span>
        </div>
        <div className="divide-y divide-border">
          {isLoading && <Vuoto testo="Caricamento…" />}
          {!isLoading && filtrati.length === 0 && <Vuoto testo="Nessun atleta in classifica." />}
          {filtrati.map((a, i) => (
            <div
              key={a.id}
              className="grid grid-cols-2 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted md:grid-cols-12 md:gap-4"
            >
              <span className="col-span-1 font-display text-lg font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="col-span-1 flex items-center gap-3 md:col-span-4">
                <span className="grid size-9 place-items-center rounded-full bg-muted font-display text-sm font-semibold">
                  {iniziali(a.nome, a.cognome)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {a.nome} {a.cognome}
                  </span>
                  <span className="block text-[11px] text-muted-foreground md:hidden">
                    {a.nome_societa}
                  </span>
                  <span className="hidden font-mono text-[11px] text-muted-foreground md:block">
                    {a.peso_kg ?? "—"} kg · {a.sesso}
                  </span>
                </span>
              </span>
              <span className="col-span-3 hidden text-[13px] md:block">{a.nome_societa}</span>
              <span className="col-span-2 hidden text-[13px] text-muted-foreground md:block">
                {a.disciplina}
              </span>
              <span className="col-span-1 hidden font-mono text-[12px] md:block md:text-right">
                {a.vittorie}-{a.sconfitte}-{a.pareggi}
              </span>
              <span className="col-span-1 text-right font-display text-lg font-semibold">
                {a.punti}
              </span>
            </div>
          ))}
        </div>
      </Pannello>
    </div>
  );
}
