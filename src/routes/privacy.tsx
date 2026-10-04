import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy e trattamento dati — FIGHT HUB" },
      {
        name: "description",
        content:
          "Informativa privacy di FIGHT HUB ai sensi del Regolamento UE 2016/679 (GDPR): dati di società e atleti, minori, certificati medici e diritti.",
      },
      { property: "og:title", content: "Privacy e trattamento dati — FIGHT HUB" },
      {
        property: "og:description",
        content: "Come FIGHT HUB tratta i dati di società e atleti nel rispetto del GDPR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const EMAIL = "infonktmuaythai@gmail.com";

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-5 last:border-b-0">
      <h2 className="font-display text-base font-semibold uppercase tracking-wide text-primary">
        {titolo}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <div className="mx-auto max-w-[860px] px-5 py-12">
      <div className="h-[3px] barra-tricolore" />
      <h1 className="mt-6 font-display text-3xl font-semibold uppercase tracking-wide">
        Informativa privacy e trattamento dati
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003 come
        modificato dal D.Lgs. 101/2018. Ultimo aggiornamento: ottobre 2026.
      </p>

      <div className="mt-6 rounded-2xl bg-card px-6 ring-1 ring-border">
        <Sezione titolo="1. Titolare del trattamento">
          <p>
            Il titolare del trattamento è FIGHT HUB — "Il portale del fighting italiano". Per qualsiasi
            richiesta relativa ai dati personali puoi scrivere a{" "}
            <a className="text-primary underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            .
          </p>
        </Sezione>

        <Sezione titolo="2. Dati che trattiamo">
          <p>
            <strong>Dati della società:</strong> nome della società, codice fiscale, città, email,
            password (conservata in forma cifrata), logo ed eventuale cognome del coach.
          </p>
          <p>
            <strong>Dati degli atleti:</strong> nome, cognome, data di nascita, genere, peso, disciplina,
            formato (KO/Light), classe, categoria di età e di peso, numero di match disputati e
            risultati sportivi.
          </p>
          <p>
            <strong>Dati relativi alla salute (art. 9 GDPR):</strong> certificato medico di idoneità e
            relativa scadenza, caricati facoltativamente dalla società. Insieme alla tessera federale
            sono trattati solo per verificare l'idoneità alla gara.
          </p>
          <p>
            <strong>Dati tecnici:</strong> dati di accesso e di navigazione strettamente necessari al
            funzionamento e alla sicurezza del sito.
          </p>
        </Sezione>

        <Sezione titolo="3. Finalità e basi giuridiche">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Creazione e gestione dell'account della società, roster atleti e iscrizioni alle gare —
              esecuzione del servizio richiesto (art. 6.1.b).
            </li>
            <li>
              Organizzazione delle competizioni: assegnazione categorie, pool, abbinamenti e match card
              — esecuzione del servizio e legittimo interesse allo svolgimento delle gare (art. 6.1.b e
              6.1.f).
            </li>
            <li>
              Verifica dell'idoneità sanitaria — obblighi di legge in materia di tutela sanitaria
              delle attività sportive e finalità di medicina sportiva (art. 9.2.b e 9.2.h).
            </li>
            <li>
              Pubblicazione di calendario, abbinamenti, risultati e classifiche — legittimo interesse
              alla trasparenza delle competizioni (art. 6.1.f).
            </li>
            <li>Adempimenti di legge, fiscali e difesa in giudizio (art. 6.1.c e 6.1.f).</li>
          </ul>
        </Sezione>

        <Sezione titolo="4. Ruolo delle società e atleti minorenni">
          <p>
            La società che inserisce gli atleti dichiara di averli informati e di aver raccolto, per
            gli atleti minorenni, il consenso di chi esercita la responsabilità genitoriale, nonché
            le autorizzazioni necessarie per il trattamento dei dati sanitari. La società è
            responsabile dell'esattezza dei dati caricati.
          </p>
        </Sezione>

        <Sezione titolo="5. Cosa è pubblico">
          <p>
            Sono visibili a tutti i visitatori solo: nome e cognome dell'atleta, società di
            appartenenza, disciplina, categoria di età e di peso, abbinamenti pubblicati, risultati e
            classifiche. Data di nascita completa, peso reale, certificati medici, tessere, email e
            codice fiscale <strong>non sono mai pubblici</strong>.
          </p>
        </Sezione>

        <Sezione titolo="6. Destinatari">
          <p>
            I dati possono essere comunicati agli organizzatori della gara a cui l'atleta è iscritto,
            ai medici e agli ufficiali di gara, nei limiti necessari allo svolgimento dell'evento, e ai
            fornitori tecnici che ospitano il servizio, nominati responsabili del trattamento. I dati
            non vengono venduti né usati per pubblicità.
          </p>
          <p>
            I fornitori tecnici possono trattare dati anche al di fuori dell'UE; in tal caso il
            trasferimento avviene sulla base di decisioni di adeguatezza o delle clausole contrattuali
            standard della Commissione europea.
          </p>
        </Sezione>

        <Sezione titolo="7. Conservazione">
          <p>
            I dati dell'account e del roster sono conservati finché l'account resta attivo. I
            certificati medici sono conservati fino alla loro scadenza o fino a cancellazione da parte
            della società. Risultati e classifiche possono essere conservati come archivio storico
            sportivo. In caso di chiusura dell'account i dati vengono cancellati o resi anonimi, salvo
            obblighi di legge.
          </p>
        </Sezione>

        <Sezione titolo="8. Sicurezza">
          <p>
            Adottiamo misure tecniche e organizzative adeguate: connessione cifrata, password cifrate,
            accesso ai dati limitato per ruolo, documenti sanitari in archivio privato consultabile
            solo dalla società proprietaria e dagli amministratori.
          </p>
        </Sezione>

        <Sezione titolo="9. I tuoi diritti">
          <p>
            In qualsiasi momento puoi chiedere accesso, rettifica, cancellazione, limitazione,
            portabilità dei dati e opporti al trattamento (artt. 15–22 GDPR), scrivendo a{" "}
            <a className="text-primary underline" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            . Rispondiamo entro 30 giorni. Hai inoltre diritto di proporre reclamo al Garante per la
            protezione dei dati personali (www.garanteprivacy.it).
          </p>
        </Sezione>

        <Sezione titolo="10. Cookie">
          <p>
            Il sito utilizza solo cookie e archiviazione locale tecnici, necessari per mantenere
            l'accesso all'area riservata. Non utilizziamo cookie di profilazione o pubblicitari, quindi
            non è richiesto un consenso specifico.
          </p>
        </Sezione>
      </div>
    </div>
  );
}
