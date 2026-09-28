import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDocumenti } from "@/lib/queries";
import { Pannello, Vuoto } from "@/components/ui-blocchi";

export const Route = createFileRoute("/documenti")({
  head: () => ({
    meta: [
      { title: "Area documenti — FIGHT HUB" },
      {
        name: "description",
        content: "Regolamenti di disciplina, guide alle iscrizioni e modulistica per le società.",
      },
      { property: "og:title", content: "Area documenti — FIGHT HUB" },
      {
        property: "og:description",
        content: "Regolamenti, guide e moduli ufficiali da scaricare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Documenti,
});

function Documenti() {
  const { data: documenti = [], isLoading } = useQuery({
    queryKey: ["documenti"],
    queryFn: fetchDocumenti,
  });

  const categorie = Array.from(new Set(documenti.map((d: any) => d.categoria)));

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-10">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">
        Area documenti
      </h1>
      {isLoading && <Vuoto testo="Caricamento…" />}
      <div className="mt-6 flex flex-col gap-6">
        {categorie.map((cat) => (
          <div key={cat as string}>
            <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide">
              {cat as string}
            </h2>
            <Pannello className="divide-y divide-border overflow-hidden">
              {documenti
                .filter((d: any) => d.categoria === cat)
                .map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium">{d.titolo}</p>
                      <p className="text-[12px] text-muted-foreground">{d.descrizione}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-muted-foreground">
                      {d.url ? (
                        <a href={d.url} className="text-primary">
                          Apri
                        </a>
                      ) : (
                        "In pubblicazione"
                      )}
                    </span>
                  </div>
                ))}
            </Pannello>
          </div>
        ))}
      </div>
    </div>
  );
}
