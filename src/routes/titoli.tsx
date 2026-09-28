import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTitoli } from "@/lib/queries";
import { formatDataCompleta } from "@/lib/format";
import { Pannello, Vuoto } from "@/components/ui-blocchi";

export const Route = createFileRoute("/titoli")({
  head: () => ({
    meta: [
      { title: "Incontri titolati — FIGHT HUB" },
      {
        name: "description",
        content: "Gli ultimi titoli assegnati: sfidanti, esito, data ed evento di svolgimento.",
      },
      { property: "og:title", content: "Incontri titolati — FIGHT HUB" },
      {
        property: "og:description",
        content: "Cinture e titoli assegnati negli eventi della federazione.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Titoli,
});

function Titoli() {
  const { data: titoli = [], isLoading } = useQuery({ queryKey: ["titoli"], queryFn: fetchTitoli });

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">
        Ultimi titoli svolti
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
        Gli incontri titolati disputati negli eventi ufficiali.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && titoli.length === 0 && <Vuoto testo="Nessun titolo pubblicato." />}
        {titoli.map((t: any) => (
          <Pannello key={t.id} className="p-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              {t.titolo}
            </span>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <p className="font-display text-lg font-semibold uppercase leading-tight">
                {t.atleta_a}
              </p>
              <span className="font-mono text-xs text-muted-foreground">VS</span>
              <p className="text-right font-display text-lg font-semibold uppercase leading-tight">
                {t.atleta_b}
              </p>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-sm">{t.esito}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {formatDataCompleta(t.data_incontro)} · {t.evento} · {t.luogo}
            </p>
          </Pannello>
        ))}
      </div>
    </div>
  );
}
