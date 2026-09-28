import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchConteggiIscritti, fetchEventi } from "@/lib/queries";
import { DISCIPLINE } from "@/lib/format";
import { FiltriDisciplina, TabellaEventi } from "@/components/tabella-eventi";
import { SezioneTitolo } from "@/components/ui-blocchi";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario gare — FIGHT HUB" },
      {
        name: "description",
        content:
          "Tutti gli eventi in programma: data, disciplina, sede, chiusura iscrizioni e numero di atleti iscritti.",
      },
      { property: "og:title", content: "Calendario gare — FIGHT HUB" },
      {
        property: "og:description",
        content: "Eventi in programma, chiusura iscrizioni e iscritti aggiornati.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Calendario,
});

function Calendario() {
  const [disciplina, setDisciplina] = useState("Tutti");
  const [stato, setStato] = useState<"aperti" | "conclusi" | "tutti">("aperti");
  const { data: eventi = [], isLoading } = useQuery({ queryKey: ["eventi"], queryFn: fetchEventi });
  const { data: iscritti = {} } = useQuery({
    queryKey: ["conteggi-iscritti"],
    queryFn: fetchConteggiIscritti,
  });

  const oggi = new Date().toISOString().slice(0, 10);
  const filtrati = eventi.filter((e) => {
    if (disciplina !== "Tutti" && e.disciplina !== disciplina) return false;
    if (stato === "aperti") return e.data_evento >= oggi;
    if (stato === "conclusi") return e.data_evento < oggi;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">
        Calendario eventi
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
        Consulta le gare in programma, filtra per disciplina e apri la scheda evento per iscrivere
        i tuoi atleti.
      </p>

      <div className="mt-8">
        <SezioneTitolo
          titolo=""
          azione={
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2 text-[13px] font-medium">
                {(["aperti", "conclusi", "tutti"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStato(s)}
                    className={
                      stato === s
                        ? "rounded-full bg-primary px-3 py-1.5 capitalize text-primary-foreground"
                        : "rounded-full bg-card px-3 py-1.5 capitalize text-muted-foreground ring-1 ring-border hover:text-foreground"
                    }
                  >
                    {s === "aperti" ? "In programma" : s === "conclusi" ? "Conclusi" : "Tutti"}
                  </button>
                ))}
              </div>
              <FiltriDisciplina
                valore={disciplina}
                onChange={setDisciplina}
                opzioni={DISCIPLINE}
              />
            </div>
          }
        />
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>
        ) : (
          <TabellaEventi eventi={filtrati} iscritti={iscritti} />
        )}
      </div>
    </div>
  );
}
