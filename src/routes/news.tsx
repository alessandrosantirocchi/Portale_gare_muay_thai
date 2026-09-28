import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/queries";
import { formatDataCompleta } from "@/lib/format";
import { Pannello, Vuoto } from "@/components/ui-blocchi";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News e comunicati — FIGHT HUB" },
      {
        name: "description",
        content: "Comunicati ufficiali, aperture iscrizioni e aggiornamenti sui regolamenti.",
      },
      { property: "og:title", content: "News e comunicati — FIGHT HUB" },
      {
        property: "og:description",
        content: "Tutti gli aggiornamenti per le società affiliate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: News,
});

function News() {
  const { data: news = [], isLoading } = useQuery({ queryKey: ["news"], queryFn: fetchNews });

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">News</h1>
      <div className="mt-6 flex flex-col gap-4">
        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && news.length === 0 && <Vuoto testo="Nessuna news pubblicata." />}
        {news.map((n: any) => (
          <Pannello key={n.id} className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {formatDataCompleta(n.data_pubblicazione)}
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold uppercase leading-tight">
              {n.titolo}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{n.contenuto}</p>
          </Pannello>
        ))}
      </div>
    </div>
  );
}
