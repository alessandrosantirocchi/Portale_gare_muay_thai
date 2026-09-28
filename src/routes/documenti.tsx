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

function GuidaIscrizioni() {
  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide">
        Guida rapida — Registrare la società e iscrivere gli atleti
      </h2>
      <Pannello className="flex flex-col gap-6 px-5 py-5 text-sm leading-relaxed">
        <section>
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-primary">
            1. Registrazione della società
          </h3>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Apri FIGHT HUB e clicca <strong>Accedi</strong> in alto a destra.</li>
            <li>Scegli <strong>Registrati</strong> e accedi con il tuo account Google, oppure con email e password.</li>
            <li>Al primo accesso inserisci il <strong>nome della società</strong> con le iniziali maiuscole (es. NKT Muay Thai).</li>
            <li>Dal profilo puoi caricare il <strong>logo della società</strong> (PNG o JPG, max 2 MB).</li>
          </ol>
          <p className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            Un account gestisce una sola società: se ne gestisci più di una, registrati con account diversi.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-primary">
            2. Inserimento degli atleti (roster)
          </h3>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Entra nell'<strong>Area riservata</strong> e apri la scheda <strong>Atleti</strong>.</li>
            <li>Nel modulo <strong>Nuovi atleti</strong> ogni atleta occupa una riga: con <strong>+ Aggiungi atleta</strong> li inserisci tutti insieme.</li>
            <li>Compila <strong>tutti i campi</strong> (sono obbligatori):</li>
          </ol>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Campo</th>
                  <th className="py-1.5 font-medium">Indicazioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="py-1.5 pr-4 font-medium">Nome e Cognome</td><td className="py-1.5">Salvati automaticamente con le iniziali maiuscole.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Data di nascita</td><td className="py-1.5">Determina in automatico la categoria d'età (Senior, Junior, Cadetti…).</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Sesso</td><td className="py-1.5">M o F: il menu delle categorie di peso si adatta in automatico.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Peso (kg)</td><td className="py-1.5">Il peso reale dell'atleta (es. 72).</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Categoria di peso</td><td className="py-1.5">Uomini da −48 a +91 kg, donne da −45 a −75 kg.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Classe</td><td className="py-1.5">A, B, C, N oppure Light.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Disciplina</td><td className="py-1.5">Muay Thai, Kickboxing, K1, Fight Code, Altro.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Cognome coach</td><td className="py-1.5">Il cognome dell'allenatore di riferimento.</td></tr>
                <tr><td className="py-1.5 pr-4 font-medium">Totale match</td><td className="py-1.5">Numero totale di incontri disputati.</td></tr>
              </tbody>
            </table>
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5" start={4}>
            <li>Clicca <strong>Salva atleti</strong>: il roster resta permanente e riutilizzabile per ogni evento.</li>
            <li>Dalla scheda del singolo atleta puoi caricare il <strong>certificato medico</strong> e modificare i dati.</li>
          </ol>
        </section>

        <section>
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-primary">
            3. Iscrizione a un evento
          </h3>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Apri la pagina dell'evento dal <strong>Calendario</strong>.</li>
            <li><strong>Spunta la casella</strong> accanto all'atleta: l'iscrizione è subito confermata, senza altre conferme.</li>
            <li>Il sistema assegna automaticamente la <strong>categoria di peso ufficiale</strong> da peso reale, sesso ed età alla data dell'evento (es. 72 kg → −75 kg).</li>
            <li>Per un atleta di 17 anni puoi scegliere <strong>“Iscrivi nella categoria Senior”</strong> per la singola gara.</li>
            <li>Controlla tutte le iscrizioni nella scheda <strong>Le mie iscrizioni</strong> dell'area riservata.</li>
          </ol>
          <p className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            Attenzione: un atleta con certificato medico scaduto non può essere iscritto. Verifica la scadenza prima dell'evento.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-primary">
            4. Pool e abbinamenti
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>I <strong>pool si creano in automatico</strong> quando ci sono atleti compatibili per classe, categoria di peso ed età: non devi fare nulla.</li>
            <li>Chiunque può vedere pool e abbinamenti pubblicati nella pagina dell'evento, sezione <strong>Atleti iscritti e abbinamenti</strong>: il badge lampeggiante <strong>“Pool da N”</strong> indica l'atleta abbinato.</li>
            <li>L'organizzatore gestisce matchmaking ed export Excel dalla propria area riservata.</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-primary">
            5. Problemi frequenti
          </h3>
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
        </section>
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
