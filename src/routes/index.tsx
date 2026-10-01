import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  fetchConteggiIscritti,
  fetchEventi,
  type Evento,
} from "@/lib/queries";
import { contoAllaRovescia, formatDataBreve, DISCIPLINE, disciplinaCanonica, disciplineEvento } from "@/lib/format";
import { useLocandinaPubblica } from "@/lib/locandine";
import { SezioneTitolo, Pannello, Etichetta } from "@/components/ui-blocchi";
import { FiltriDisciplina, TabellaEventi } from "@/components/tabella-eventi";
import logo from "@/assets/fight-hub-cropped.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FIGHT HUB — Iscrizioni, calendario gare e classifiche" },
      {
        name: "description",
        content:
          "Il portale delle società: iscrivi i tuoi atleti agli eventi, consulta il calendario gare, le classifiche ufficiali e gli incontri titolati.",
      },
      { property: "og:title", content: "FIGHT HUB — Il portale del fighting italiano" },
      {
        property: "og:description",
        content:
          "Calendario gare, iscrizioni online delle società e classifiche degli sport da combattimento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [filtro, setFiltro] = useState("Tutti");
  const { data: eventi = [] } = useQuery({ queryKey: ["eventi"], queryFn: fetchEventi });
  const { data: iscritti = {} } = useQuery({
    queryKey: ["conteggi-iscritti"],
    queryFn: fetchConteggiIscritti,
  });

  const oggi = new Date().toISOString().slice(0, 10);
  const prossimi = eventi.filter((e) => e.data_evento >= oggi).slice(0, 3);
  const filtrati =
    filtro === "Tutti" ? eventi.slice(0, 6) : eventi.filter((e) => disciplineEvento(e).some((d) => disciplinaCanonica(d) === disciplinaCanonica(filtro)));

  return (
    <div className="mx-auto max-w-[1200px] px-5">
      <section className="grid gap-8 border-b border-border py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12 lg:py-12">
        <div className="flex flex-col justify-center">
          <h1 className="w-full max-w-[520px]">
            <img src={logo.url} alt="FIGHT HUB" className="h-auto w-full max-w-[520px]" />
            <span className="mt-2 block text-center text-base font-normal italic text-foreground sm:text-lg">Il portale del fighting italiano</span>
          </h1>
          <p className="mt-5 max-w-[42ch] text-pretty text-sm text-muted-foreground sm:text-base">
            Iscrivi gli atleti della tua società, segui il calendario gare e tieni d'occhio le classifiche.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/calendario"
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span aria-hidden="true">→</span>
              Apri calendario
            </Link>
            <Link
              to="/classifiche"
              className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium ring-1 ring-foreground/20 transition-colors hover:ring-foreground/40"
            >
              Classifiche
            </Link>
          </div>
        </div>

        <div className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:py-1 lg:pl-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold uppercase">Eventi imminenti</h2>
            <Link to="/calendario" className="shrink-0 text-xs font-medium text-primary hover:underline">Calendario →</Link>
          </div>
          <div className="mt-3 divide-y divide-border">
            {prossimi.length === 0 && <p className="py-5 text-sm text-muted-foreground">Nessun evento imminente.</p>}
            {prossimi.map((e) => (
              <Link key={e.id} to="/eventi/$id" params={{ id: e.id }} className="group flex items-center gap-4 py-4">
                <span className="flex w-14 shrink-0 flex-col border-l-2 border-primary pl-2 font-display uppercase leading-none">
                  <span className="text-2xl font-semibold">{e.data_evento.slice(8, 10)}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{formatDataBreve(e.data_evento).split(" ")[1]}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-medium uppercase leading-tight transition-colors group-hover:text-primary">{e.nome}</span>
                   <span className="mt-1 block text-xs text-muted-foreground">{e.luogo} · {disciplineEvento(e).join(" · ")}</span>
                </span>
                <span className="text-primary" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {prossimi[0] && <LocandinaInEvidenza evento={prossimi[0]} />}

      <section className="py-8">
        <SezioneTitolo
          titolo="Prossimi eventi"
          azione={
            <Link to="/calendario" className="text-[13px] font-medium text-primary">
              Tutti gli eventi →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prossimi.map((e) => (
            <CardEvento key={e.id} evento={e} iscritti={iscritti[e.id] ?? 0} />
          ))}
        </div>
      </section>

      <section className="py-8 pb-16">
        <SezioneTitolo
          titolo="Calendario eventi"
          azione={<FiltriDisciplina valore={filtro} onChange={setFiltro} opzioni={DISCIPLINE} />}
        />
        <TabellaEventi eventi={filtrati} iscritti={iscritti} />
      </section>
    </div>
  );
}

function CardEvento({ evento, iscritti }: { evento: Evento; iscritti: number }) {
  const countdown = contoAllaRovescia(evento.fine_iscrizioni);
  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-black/5 transition-colors hover:ring-primary/30">
      <div className="flex items-center justify-between">
        <Etichetta>{disciplineEvento(evento).join(" · ")}</Etichetta>
        <span className="font-mono text-[11px] text-muted-foreground">{iscritti} iscritti</span>
      </div>
      <div>
        <p className="font-display text-xl font-semibold uppercase leading-tight">{evento.nome}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {evento.sede ? `${evento.sede} · ` : ""}
          {evento.luogo}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        {countdown ? (
          <span className="flex gap-2 text-[12px]">
            <span className="font-mono">
              {countdown.giorni} <span className="text-muted-foreground">Gi</span>
            </span>
            <span className="font-mono">
              {countdown.ore} <span className="text-muted-foreground">Ore</span>
            </span>
            <span className="font-mono">
              {countdown.minuti} <span className="text-muted-foreground">Min</span>
            </span>
          </span>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            Iscrizioni chiuse il {formatDataBreve(evento.fine_iscrizioni)}
          </span>
        )}
        {countdown && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Chiude tra
          </span>
        )}
      </div>
      <Link
        to="/eventi/$id"
        params={{ id: evento.id }}
        className="inline-flex items-center justify-center rounded-[10px] bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground transition-colors hover:bg-ink/90"
      >
        Dettagli e iscrizione
      </Link>
    </article>
  );
}

function LocandinaInEvidenza({ evento }: { evento: Evento }) {
  const { data: url } = useLocandinaPubblica(evento.locandina_pubblicata ? evento.locandina_path : null);
  if (!url) return null;
  return (
    <section className="py-8">
      <Pannello className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <img
            src={url}
            alt={`Locandina ufficiale dell'evento ${evento.nome}`}
            className="w-full rounded-xl ring-1 ring-border"
            loading="eager"
          />
        </div>
        <div className="flex flex-col justify-center lg:col-span-7">
          <Etichetta>Prossimo evento</Etichetta>
          <h2 className="mt-2 font-display text-3xl font-semibold uppercase leading-none sm:text-4xl">
            {evento.nome}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {formatDataBreve(evento.data_evento)} · {evento.sede ? `${evento.sede} · ` : ""}
            {evento.luogo}
          </p>
          {evento.orario && <p className="mt-1 text-sm text-muted-foreground">{evento.orario}</p>}
          <Link
            to="/eventi/$id"
            params={{ id: evento.id }}
            className="mt-5 inline-flex w-fit items-center justify-center rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Dettagli e iscrizione
          </Link>
        </div>
      </Pannello>
    </section>
  );
}
