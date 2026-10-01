// ============= Full file contents =============

import { useState } from "react";
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

function GuidaSezione({
  titolo,
  aperto,
  onToggle,
  children,
}: {
  titolo: string;
  aperto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aperto}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/30"
      >
        <span className="font-display text-sm font-semibold uppercase tracking-wide text-primary">
          {titolo}
        </span>
        <span
          className="shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: aperto ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {aperto && (
        <div className="px-5 pb-5 text-sm leading-relaxed">{children}</div>
      )}
    </div>
  );
}

function GuidaIscrizioni() {
  const [aperte, setAperte] = useState<Record<number, boolean>>({});
  const toggle = (i: number) =>
    setAperte((p) => ({ ...p, [i]: !p[i] }));

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide">
        Guida rapida — Registrare la società e iscrivere gli atleti
      </h2>
      <Pannello className="overflow-hidden p-0">
        <GuidaSezione titolo="1. Registrazione società" aperto={!!aperte[1]} onToggle={() => toggle(1)}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Clicca <strong>Accedi</strong> in alto a destra, poi <strong>Registrati</strong> (con Google o email e password).</li>
            <li>Inserisci <strong>Nome della società</strong>, <strong>Codice Fiscale</strong> (obbligatorio) e <strong>Città</strong>.</li>
            <li>Dal profilo puoi caricare il <strong>logo</strong> sociale.</li>
          </ol>
        </GuidaSezione>

        <GuidaSezione titolo="2. Inserimento atleti (roster)" aperto={!!aperte[2]} onToggle={() => toggle(2)}>
          <p className="mb-2">
            Vai in <strong>La mia area → Atleti</strong> e compila la riga in <strong>Nuovi atleti</strong> (con <strong>+ Aggiungi atleta</strong> ne inserisci più di uno):
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Nome e Cognome</strong>: iniziali maiuscole automatiche.</li>
            <li><strong>Data di nascita</strong> e <strong>Genere</strong> (M o F).</li>
            <li><strong>KO o Light</strong>:
              <ul className="mt-1 list-[circle] space-y-1 pl-5">
                <li><strong>KO</strong> (contatto pieno): 16–40 anni (Junior 16–18, Senior 19–40). Richiede la <strong>Classe</strong> A, B, C o N.</li>
                <li><strong>Light</strong> (contatto leggero): 6–55 anni (Gioco Sport 6–9, Cadetti 10–15, Junior 16–18, Senior 19–40, Master 40–55). Nessuna classe.</li>
              </ul>
            </li>
            <li><strong>Categoria di età</strong>: assegnata in automatico dalla data di nascita.</li>
            <li><strong>Peso reale (kg)</strong>, <strong>Disciplina</strong>, <strong>Categoria di peso</strong>, <strong>Totale match</strong> e <strong>Cognome coach</strong>.</li>
          </ul>
          <p className="mt-2">Clicca <strong>Salva atleti</strong>: il roster resta salvato per tutte le gare.</p>
        </GuidaSezione>

        <GuidaSezione titolo="3. Iscrivere un atleta a una gara" aperto={!!aperte[3]} onToggle={() => toggle(3)}>
          <p className="mb-2">
            Clicca <strong>Iscrivi atleti a una gara</strong> dalla tua area, oppure apri la gara dal <strong>Calendario</strong>:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Apri la tendina <strong>Seleziona atleta dal tuo roster</strong>.</li>
            <li>La riga dell'atleta compare già compilata con i suoi dati.</li>
            <li>Clicca <strong>Conferma iscrizione all'evento</strong>: l'iscrizione è immediata.</li>
          </ol>
          <p className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            Un atleta con certificato medico scaduto non può essere iscritto.
          </p>
        </GuidaSezione>

        <GuidaSezione titolo="4. Cosa puoi modificare" aperto={!!aperte[6]} onToggle={() => toggle(6)}>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Prima di confermare</strong>: peso per la gara (la categoria di peso si ricalcola subito), disciplina, classe, coach e match. Per atleti di 17–18 anni puoi spuntare il <strong>passaggio a Senior</strong>.
            </li>
            <li>
              <strong>Dopo la conferma</strong>: nella tabella in fondo alla pagina dell'evento clicca <strong>Modifica</strong> per cambiare peso o disciplina, fino alla chiusura delle iscrizioni.
            </li>
            <li>
              <strong>Dati anagrafici e certificato</strong>: si aggiornano in qualsiasi momento dalla scheda <strong>Atleti</strong>.
            </li>
          </ul>
        </GuidaSezione>

        <GuidaSezione titolo="5. Controllare le iscrizioni" aperto={!!aperte[7]} onToggle={() => toggle(7)}>
          <p>
            In <strong>La mia area → Le mie iscrizioni</strong> trovi il riepilogo sempre aggiornato: atleti iscritti, gare attive ed elenco diviso per evento.
          </p>
        </GuidaSezione>

        <GuidaSezione
          titolo="4. Pool e abbinamenti"
          aperto={!!aperte[4]}
          onToggle={() => toggle(4)}
        >
          <ul className="list-disc space-y-1 pl-5">
            <li>I <strong>pool si creano in automatico</strong> quando ci sono atleti compatibili per classe, categoria di peso ed età: non devi fare nulla.</li>
            <li>Chiunque può vedere pool e abbinamenti pubblicati nella pagina dell'evento, sezione <strong>Atleti iscritti e abbinamenti</strong>: il badge lampeggiante <strong>"Pool da N"</strong> indica l'atleta abbinato.</li>
            <li>L'organizzatore gestisce matchmaking ed export Excel dalla propria area riservata.</li>
          </ul>
        </GuidaSezione>

        <GuidaSezione
          titolo="5. Problemi frequenti"
          aperto={!!aperte[5]}
          onToggle={() => toggle(5)}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Problema</th>
                  <th className="py-1.5 font-medium">Soluzione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="py-1.5 pr-4 font-medium">Non vedo il mio atleta nella lista iscrizioni</td><td className="py-1.5">Verifica che sia salvato nel roster e che la disciplina sia tra quelle ammesse dall'evento.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Categoria di peso errata</td><td className="py-1.5">Correggi il peso nel roster: l'iscrizione ricalcola la categoria in automatico.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Certificato scaduto</td><td className="py-1.5">Carica il nuovo certificato dalla scheda atleta prima di iscriverlo.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Ho sbagliato iscrizione</td><td className="py-1.5">Contatta l'organizzatore dell'evento o l'amministratore per la rimozione.</td></tr>
              </tbody>
            </table>
          </div>
        </GuidaSezione>
      </Pannello>
    </div>
  );
}

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
        <GuidaIscrizioni />
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
