import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useProfilo, useSession } from "@/lib/auth";
import { formatDataBreve, formatDataCompleta, DISCIPLINE } from "@/lib/format";
import { Pannello, Vuoto } from "@/components/ui-blocchi";
import { RosterSocieta } from "@/components/roster-societa";
import { ProfiloSocieta, useLogoUrl } from "@/components/profilo-societa";
import { MatchmakingAdmin } from "@/components/matchmaking-admin";
import { STATI_EVENTO } from "@/lib/fight-hub";
import { Button } from "@/components/ui/button";
import { DisciplineEvento } from "@/components/discipline-evento";
import { ModificaIscrizione } from "@/components/modifica-iscrizione";
import { BUCKET_LOCANDINE, useLocandina, useLocandinaPubblica } from "@/lib/locandine";
import { listaUtenti, creaUtente, impostaRuolo } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/area")({
  head: () => ({
    meta: [
      { title: "Area società — FIGHT HUB" },
      { name: "description", content: "Gestisci i tuoi atleti e le iscrizioni agli eventi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Area società — FIGHT HUB" },
      { property: "og:description", content: "FIGHT HUB: eventi, atleti e iscrizioni agli sport da combattimento." },
    ],
  }),
  component: AreaSocieta,
});

function AreaSocieta() {
  const { user } = useSession();
  const { data: profilo } = useProfilo(user?.id);
  const logoUrl = useLogoUrl(profilo?.logo_path);
  const { data: admin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<
    "atleti" | "societa" | "iscrizioni" | "eventi" | "conferme" | "matchmaking" | "utenti"
  >("atleti");

  async function esci() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-16 text-sm text-muted-foreground">
        Caricamento area riservata…
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-[1100px] px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          {profilo?.logo_path && (
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted text-lg font-bold text-muted-foreground">
              {logoUrl ? <img src={logoUrl} alt={`Logo ${profilo.nome_societa}`} className="h-full w-full object-contain" /> : profilo.nome_societa?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Area società
          </p>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">
            {profilo?.nome_societa || user?.email}
          </h1>
          {profilo?.codice_societa && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              Codice società: {profilo.codice_societa}
              {profilo?.citta ? ` · ${profilo.citta}` : ""}
            </p>
          )}
          </div>
        </div>
        <button
          type="button"
          onClick={esci}
          className="rounded-[10px] border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Esci
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {([
          ["atleti", "I miei atleti"],
          ["societa", "La mia società"],
          ["iscrizioni", "Iscrizioni"],
          ["eventi", "Gestione eventi"],
          ["matchmaking", "Matchmaking"],
          ...(admin
            ? ([
                ["conferme", "Tutte le iscrizioni"],
                ["utenti", "Utenti e ruoli"],
              ] as const)
            : []),
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={
              tab === k
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "atleti" && <RosterSocieta userId={user.id} nomeSocieta={profilo?.nome_societa ?? ""} />}
        {tab === "societa" && <ProfiloSocieta profilo={profilo} />}
        {tab === "iscrizioni" && <MieIscrizioni userId={user.id} />}
        {tab === "eventi" && <GestioneEventi admin={!!admin} userId={user.id} />}
        {tab === "conferme" && admin && <ConfermaIscrizioni />}
        {tab === "matchmaking" && <MatchmakingAdmin admin={!!admin} userId={user.id} />}
        {tab === "utenti" && admin && <GestioneUtenti mioId={user.id} />}
      </div>
    </div>
  );
}

function MieIscrizioni({ userId }: { userId: string }) {
  const { data: iscrizioni = [], isLoading } = useQuery({
    queryKey: ["mie-iscrizioni", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("iscrizioni")
        .select("id, stato, categoria_peso, atleta_id, evento_id, disciplina, senior_17, snapshot_nome, snapshot_cognome, snapshot_peso_kg, snapshot_sesso, snapshot_data_nascita, snapshot_serie, snapshot_categoria, snapshot_coach, snapshot_totale_match, eventi(nome, data_evento, luogo, stato, fine_iscrizioni, apertura_iscrizioni, discipline_ammesse)")
        .eq("societa_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Pannello className="divide-y divide-border overflow-hidden">
      {isLoading && <Vuoto testo="Caricamento…" />}
      {!isLoading && iscrizioni.length === 0 && (
        <Vuoto testo="Nessuna iscrizione effettuata. Apri un evento dal calendario." />
      )}
      {iscrizioni.map((i: any) => (
        <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm font-medium">{i.snapshot_cognome} {i.snapshot_nome} · {i.eventi?.nome}</p>
            <p className="text-[12px] text-muted-foreground">
              {formatDataCompleta(i.eventi?.data_evento)} · {i.eventi?.luogo}
            </p>
            <ModificaIscrizione iscrizione={i} userId={userId} />
          </div>
          <div className="text-right">
            <p className="text-[12px] text-muted-foreground">
              {i.snapshot_categoria ?? "—"} · {i.categoria_peso ?? "—"} · {i.snapshot_peso_kg ?? "—"} kg
            </p>
            <span className="text-[12px] font-medium capitalize">{i.stato}</span>
          </div>
        </div>
      ))}
    </Pannello>
  );
}

function GestioneEventi({ admin, userId }: { admin: boolean; userId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome: "",
    disciplina: "Muay Thai",
    discipline_ammesse: ["Muay Thai"] as string[],
    formati_incontro: {} as Record<string, string[]>,
    tipo: "Istituzionale",
    data_evento: "",
    luogo: "",
    sede: "",
    fine_iscrizioni: "",
    descrizione: "",
    orario: "",
    programma: "",
    organizzatore: "",
    apertura_iscrizioni: "",
    limite_partecipanti: "",
    blocca_certificato_scaduto: false,
    originale_richiesto: false,
  });
  const [msg, setMsg] = useState<string | null>(null);

  const crea = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventi").insert({
        nome: form.nome,
        disciplina: form.disciplina,
        discipline_ammesse: form.discipline_ammesse,
        formati_incontro: form.formati_incontro,
        tipo: form.tipo,
        data_evento: form.data_evento,
        luogo: form.luogo,
        sede: form.sede || null,
        fine_iscrizioni: form.fine_iscrizioni,
        descrizione: form.descrizione || null,
        orario: form.orario || null,
        programma: form.programma || null,
        organizzatore: form.organizzatore || null,
        apertura_iscrizioni: form.apertura_iscrizioni ? new Date(form.apertura_iscrizioni).toISOString() : null,
        limite_partecipanti: form.limite_partecipanti ? Number(form.limite_partecipanti) : null,
        blocca_certificato_scaduto: form.blocca_certificato_scaduto,
        originale_richiesto: form.originale_richiesto,
        organizzatore_id: userId,
        stato: "iscrizioni aperte",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg("Evento creato.");
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      setForm({
        nome: "",
        disciplina: "Muay Thai",
        discipline_ammesse: ["Muay Thai"],
        formati_incontro: {},
        tipo: "Istituzionale",
        data_evento: "",
        luogo: "",
        sede: "",
        fine_iscrizioni: "",
        descrizione: "",
        orario: "",
        programma: "", organizzatore: "", apertura_iscrizioni: "", limite_partecipanti: "", blocca_certificato_scaduto: false, originale_richiesto: false,
      });
    },
    onError: (e: any) => setMsg(e.message ?? "Errore."),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Pannello className="p-5 lg:col-span-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          Nuovo evento
        </h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            crea.mutate();
          }}
        >
          <Input label="Nome evento" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <DisciplineEvento value={form.discipline_ammesse} onChange={(v) => setForm({ ...form, discipline_ammesse: v, disciplina: v[0] ?? "" })} formati={form.formati_incontro} onFormatiChange={(v) => setForm({ ...form, formati_incontro: v })} />
            <Select label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} options={["Istituzionale", "Non Istituzionale"]} />
          </div>
          <Input label="Data evento" type="date" value={form.data_evento} onChange={(v) => setForm({ ...form, data_evento: v })} required />
          <Input label="Luogo (città)" value={form.luogo} onChange={(v) => setForm({ ...form, luogo: v })} required />
          <Input label="Sede / palazzetto" value={form.sede} onChange={(v) => setForm({ ...form, sede: v })} />
          <Input label="Fine iscrizioni (data-ora)" type="datetime-local" value={form.fine_iscrizioni} onChange={(v) => setForm({ ...form, fine_iscrizioni: v })} required />
          <Input label="Organizzatore" value={form.organizzatore} onChange={(v) => setForm({ ...form, organizzatore: v })} />
          <Input label="Apertura iscrizioni" type="datetime-local" value={form.apertura_iscrizioni} onChange={(v) => setForm({ ...form, apertura_iscrizioni: v })} />
          <Input label="Limite partecipanti (opzionale)" type="number" value={form.limite_partecipanti} onChange={(v) => setForm({ ...form, limite_partecipanti: v })} />
          <label className="flex gap-2 text-xs"><input type="checkbox" checked={form.blocca_certificato_scaduto} onChange={(e) => setForm({ ...form, blocca_certificato_scaduto: e.target.checked })} />Blocca iscrizioni senza certificato valido</label>
          <label className="flex gap-2 text-xs"><input type="checkbox" checked={form.originale_richiesto} onChange={(e) => setForm({ ...form, originale_richiesto: e.target.checked })} />Originale richiesto al check-in</label>
          <Input label="Orario (es. Apertura 9:00 · Gare 10:30)" value={form.orario} onChange={(v) => setForm({ ...form, orario: v })} />
          <label className="text-[12px] font-medium text-muted-foreground">
            Programma della giornata (una voce per riga)
            <textarea
              value={form.programma}
              onChange={(e) => setForm({ ...form, programma: e.target.value })}
              className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              rows={4}
              placeholder={"08:30 Accredito\n10:00 Inizio incontri"}
            />
          </label>
          <label className="text-[12px] font-medium text-muted-foreground">
            Descrizione
            <textarea
              value={form.descrizione}
              onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
              className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              rows={3}
            />
          </label>
          <button
            type="submit"
            disabled={crea.isPending}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {crea.isPending ? "Salvataggio…" : "Crea evento"}
          </button>
          {msg && <p className="text-[12px]">{msg}</p>}
        </form>
      </Pannello>

      <ListaEventiAdmin admin={admin} userId={userId} />
    </div>
  );
}

function ListaEventiAdmin({ admin, userId }: { admin: boolean; userId: string }) {
  const queryClient = useQueryClient();
  const { data: eventi = [], isLoading } = useQuery({
    queryKey: ["eventi"],
    queryFn: async () => {
      const richiesta = admin
        ? supabase.from("eventi").select("*")
        : supabase.from("eventi").select("*").eq("organizzatore_id", userId);
      const { data, error } = await richiesta.order("data_evento", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("iscrizioni").delete().eq("evento_id", id);
      const { error } = await supabase.from("eventi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      queryClient.invalidateQueries({ queryKey: ["iscrizioni"] });
    },
  });

  return (
    <div className="lg:col-span-7">
      <Pannello className="divide-y divide-border overflow-hidden">
        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && eventi.length === 0 && <Vuoto testo="Nessun evento." />}
        {eventi.map((e: any) => (
          <RigaEventoAdmin
            key={e.id}
            evento={e}
            onElimina={() => {
              if (confirm(`Eliminare l'evento "${e.nome}" e le relative iscrizioni?`)) {
                elimina.mutate(e.id);
              }
            }}
          />
        ))}
      </Pannello>
    </div>
  );
}

function ModificaEvento({ evento, onChiudi }: { evento: any; onChiudi: () => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({
    nome: evento.nome ?? "",
    disciplina: evento.disciplina ?? "Muay Thai",
    discipline_ammesse: (evento.discipline_ammesse?.length ? evento.discipline_ammesse as string[] : [evento.disciplina ?? "Muay Thai"]).map((v) => ["Contatto Pieno", "Light Contact"].includes(v) ? "Kickboxing" : v),
    formati_incontro: (evento.formati_incontro ?? {}) as Record<string, string[]>,
    tipo: evento.tipo ?? "Istituzionale",
    data_evento: evento.data_evento ?? "",
    luogo: evento.luogo ?? "",
    sede: evento.sede ?? "",
    fine_iscrizioni: (evento.fine_iscrizioni ?? "").slice(0, 16),
    orario: evento.orario ?? "",
    programma: evento.programma ?? "",
    descrizione: evento.descrizione ?? "",
    stato: evento.stato === "aperto" ? "iscrizioni aperte" : evento.stato === "chiuso" ? "iscrizioni chiuse" : evento.stato ?? "bozza",
    organizzatore: evento.organizzatore ?? "",
    apertura_iscrizioni: evento.apertura_iscrizioni?.slice(0, 16) ?? "",
    limite_partecipanti: String(evento.limite_partecipanti ?? ""),
    blocca_certificato_scaduto: evento.blocca_certificato_scaduto ?? false,
    originale_richiesto: evento.originale_richiesto ?? false,
  });
  const [msg, setMsg] = useState<string | null>(null);

  const salva = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("eventi")
        .update({
          nome: f.nome,
          disciplina: f.disciplina,
          discipline_ammesse: f.discipline_ammesse,
          formati_incontro: f.formati_incontro,
          tipo: f.tipo,
          data_evento: f.data_evento,
          luogo: f.luogo,
          sede: f.sede || null,
          fine_iscrizioni: new Date(f.fine_iscrizioni).toISOString(),
          orario: f.orario || null,
          programma: f.programma || null,
          descrizione: f.descrizione || null,
          stato: f.stato,
          organizzatore: f.organizzatore || null,
          apertura_iscrizioni: f.apertura_iscrizioni ? new Date(f.apertura_iscrizioni).toISOString() : null,
          limite_partecipanti: f.limite_partecipanti ? Number(f.limite_partecipanti) : null,
          blocca_certificato_scaduto: f.blocca_certificato_scaduto,
          originale_richiesto: f.originale_richiesto,
        })
        .eq("id", evento.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      queryClient.invalidateQueries({ queryKey: ["evento"] });
      onChiudi();
    },
    onError: (e: any) => setMsg(e.message ?? "Errore."),
  });

  return (
    <form
      className="mt-3 flex w-full flex-col gap-3 rounded-[12px] border border-border bg-muted/30 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        salva.mutate();
      }}
    >
      <Input label="Nome evento" value={f.nome} onChange={(v) => setF({ ...f, nome: v })} required />
      <div className="grid grid-cols-2 gap-3">
        <DisciplineEvento value={f.discipline_ammesse} onChange={(v) => setF({ ...f, discipline_ammesse: v, disciplina: v[0] ?? "" })} formati={f.formati_incontro} onFormatiChange={(v) => setF({ ...f, formati_incontro: v })} />
        <Select label="Tipo" value={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} options={["Istituzionale", "Non Istituzionale"]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Data evento" type="date" value={f.data_evento} onChange={(v) => setF({ ...f, data_evento: v })} required />
        <Select label="Stato" value={f.stato} onChange={(v) => setF({ ...f, stato: v })} options={STATI_EVENTO} />
      </div>
      <Input label="Luogo (città)" value={f.luogo} onChange={(v) => setF({ ...f, luogo: v })} required />
      <Input label="Sede / palazzetto" value={f.sede} onChange={(v) => setF({ ...f, sede: v })} />
      <Input label="Fine iscrizioni" type="datetime-local" value={f.fine_iscrizioni} onChange={(v) => setF({ ...f, fine_iscrizioni: v })} required />
      <Input label="Organizzatore" value={f.organizzatore} onChange={(v) => setF({ ...f, organizzatore: v })} />
      <Input label="Apertura iscrizioni" type="datetime-local" value={f.apertura_iscrizioni} onChange={(v) => setF({ ...f, apertura_iscrizioni: v })} />
      <Input label="Limite partecipanti" type="number" value={f.limite_partecipanti} onChange={(v) => setF({ ...f, limite_partecipanti: v })} />
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={f.blocca_certificato_scaduto} onChange={(e) => setF({ ...f, blocca_certificato_scaduto: e.target.checked })} />Blocca iscrizioni senza certificato valido</label>
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={f.originale_richiesto} onChange={(e) => setF({ ...f, originale_richiesto: e.target.checked })} />Originale richiesto al check-in</label>
      <Input label="Orario" value={f.orario} onChange={(v) => setF({ ...f, orario: v })} />
      <label className="text-[12px] font-medium text-muted-foreground">
        Programma (una voce per riga)
        <textarea
          value={f.programma}
          onChange={(e) => setF({ ...f, programma: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="text-[12px] font-medium text-muted-foreground">
        Descrizione
        <textarea
          value={f.descrizione}
          onChange={(e) => setF({ ...f, descrizione: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      {msg && <p className="text-[12px] text-destructive">{msg}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={salva.isPending}
          className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {salva.isPending ? "Salvataggio…" : "Salva modifiche"}
        </button>
        <button type="button" onClick={onChiudi} className="text-[12px] text-muted-foreground hover:underline">
          Annulla
        </button>
      </div>
    </form>
  );
}

function RigaEventoAdmin({
  evento,
  onElimina,
}: {
  evento: any;
  onElimina: () => void;
}) {
  const queryClient = useQueryClient();
  const queryClient = useQueryClient();
  const { data: anteprimaPubblica } = useLocandinaPubblica(evento.locandina_pubblicata ? evento.locandina_path : null);
  const { data: anteprimaPrivata } = useLocandina(evento.locandina_pubblicata ? null : evento.locandina_path);
  const anteprima = anteprimaPubblica ?? anteprimaPrivata;
  const [msg, setMsg] = useState<string | null>(null);
  const [modifica, setModifica] = useState(false);

  const carica = useMutation({
    mutationFn: async (file: File) => {
      const est = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${evento.id}-${Date.now()}.${est}`;
      const { error } = await supabase.storage
        .from(BUCKET_LOCANDINE)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("eventi")
        .update({ locandina_path: path, locandina_pubblicata: false })
        .eq("id", evento.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      setMsg("Locandina caricata. Pubblicala quando è pronta.");
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      queryClient.invalidateQueries({ queryKey: ["locandina"] });
      queryClient.invalidateQueries({ queryKey: ["evento"] });
    },
    onError: (e: any) => setMsg(e.message ?? "Caricamento non riuscito."),
  });

  const pubblicaLocandina = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventi").update({ locandina_pubblicata: !evento.locandina_pubblicata }).eq("id", evento.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventi"] });
      queryClient.invalidateQueries({ queryKey: ["evento"] });
      queryClient.invalidateQueries({ queryKey: ["locandina"] });
      setMsg(evento.locandina_pubblicata ? "Locandina nascosta." : "Locandina pubblicata.");
    },
    onError: (e: any) => setMsg(e.message ?? "Operazione non riuscita."),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3">
        {anteprima ? (
          <img
            src={anteprima}
            alt={`Locandina ${evento.nome}`}
            className="h-14 w-10 rounded-[6px] border border-border object-cover"
          />
        ) : (
          <div className="grid h-14 w-10 place-items-center rounded-[6px] border border-dashed border-border text-[10px] text-muted-foreground">
            —
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{evento.nome}</p>
          <p className="text-[12px] text-muted-foreground">
            {formatDataBreve(evento.data_evento)} · {evento.luogo}
          </p>
          {msg && <p className="text-[11px] text-muted-foreground">{msg}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-[10px] border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted">
          {carica.isPending ? "Caricamento…" : evento.locandina_path ? "Cambia locandina" : "Carica locandina"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              setMsg(null);
              if (file) carica.mutate(file);
              ev.target.value = "";
            }}
          />
        </label>
        {evento.locandina_path && <button type="button" disabled={pubblicaLocandina.isPending} onClick={() => pubblicaLocandina.mutate()} className="text-[12px] font-medium text-primary hover:underline disabled:opacity-50">{evento.locandina_pubblicata ? "Nascondi locandina" : "Pubblica locandina"}</button>}
        <button
          type="button"
          onClick={() => setModifica((v) => !v)}
          className="text-[12px] font-medium hover:underline"
        >
          {modifica ? "Chiudi" : "Modifica"}
        </button>
        <button
          type="button"
          onClick={onElimina}
          className="text-[12px] text-destructive hover:underline"
        >
          Elimina
        </button>
      </div>
      {modifica && <ModificaEvento evento={evento} onChiudi={() => setModifica(false)} />}
    </div>
  );
}

function GestioneUtenti({ mioId }: { mioId: string }) {
  const queryClient = useQueryClient();
  const carica = useServerFn(listaUtenti);
  const crea = useServerFn(creaUtente);
  const ruolo = useServerFn(impostaRuolo);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nome_societa: "",
    codice_societa: "",
    citta: "",
    ruolo: "societa",
  });

  const { data: utenti = [], isLoading, error } = useQuery({
    queryKey: ["admin-utenti"],
    queryFn: () => carica(),
  });

  const nuovo = useMutation({
    mutationFn: () =>
      crea({
        data: {
          email: form.email,
          password: form.password,
          nome_societa: form.nome_societa,
          codice_societa: form.codice_societa,
          citta: form.citta,
          ruolo: form.ruolo as "societa" | "admin",
        },
      }),
    onSuccess: () => {
      setMsg("Account creato.");
      setForm({ email: "", password: "", nome_societa: "", codice_societa: "", citta: "", ruolo: "societa" });
      queryClient.invalidateQueries({ queryKey: ["admin-utenti"] });
    },
    onError: (e: any) => setMsg(e?.message ?? "Creazione non riuscita."),
  });

  const cambiaRuolo = useMutation({
    mutationFn: (vars: { user_id: string; ruolo: "societa" | "admin"; attivo: boolean }) =>
      ruolo({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-utenti"] }),
    onError: (e: any) => setMsg(e?.message ?? "Modifica ruolo non riuscita."),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Pannello className="p-5 lg:col-span-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
          Nuovo account società
        </h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            nuovo.mutate();
          }}
        >
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Input label="Password (min. 8 caratteri)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <Input label="Nome società" value={form.nome_societa} onChange={(v) => setForm({ ...form, nome_societa: v })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Codice società" value={form.codice_societa} onChange={(v) => setForm({ ...form, codice_societa: v })} />
            <Input label="Città" value={form.citta} onChange={(v) => setForm({ ...form, citta: v })} />
          </div>
          <Select
            label="Ruolo"
            value={form.ruolo}
            onChange={(v) => setForm({ ...form, ruolo: v })}
            options={["societa", "admin"]}
            etichette={{ societa: "Società", admin: "Amministratore" }}
          />
          <button
            type="submit"
            disabled={nuovo.isPending}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {nuovo.isPending ? "Creazione…" : "Crea account"}
          </button>
          {msg && <p className="text-[12px]">{msg}</p>}
        </form>
      </Pannello>

      <div className="lg:col-span-7">
        <Pannello className="divide-y divide-border overflow-hidden">
          {isLoading && <Vuoto testo="Caricamento…" />}
          {error && <Vuoto testo="Non è stato possibile caricare gli utenti." />}
          {!isLoading && !error && utenti.length === 0 && <Vuoto testo="Nessun utente." />}
          {(utenti as any[]).map((u) => {
            const isAdmin = u.ruoli.includes("admin");
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{u.nome_societa || u.email}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {u.email}
                    {u.citta ? ` · ${u.citta}` : ""}
                    {u.codice_societa ? ` · ${u.codice_societa}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      isAdmin
                        ? "rounded-full bg-oro/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-oro"
                        : "rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    }
                  >
                    {isAdmin ? "Amministratore" : "Società"}
                  </span>
                  <button
                    type="button"
                    disabled={cambiaRuolo.isPending || (isAdmin && u.id === mioId)}
                    onClick={() =>
                      cambiaRuolo.mutate({ user_id: u.id, ruolo: "admin", attivo: !isAdmin })
                    }
                    className="rounded-[10px] border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted disabled:opacity-40"
                  >
                    {isAdmin ? "Rimuovi admin" : "Rendi admin"}
                  </button>
                </div>
              </div>
            );
          })}
        </Pannello>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-[12px] font-medium text-muted-foreground">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  etichette,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  etichette?: Record<string, string>;
}) {
  return (
    <label className="text-[12px] font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {etichette?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConfermaIscrizioni() {
  const queryClient = useQueryClient();
  const [eventoId, setEventoId] = useState<string>("tutti");
  const [stato, setStato] = useState<string>("tutti");
  const [cerca, setCerca] = useState("");

  const { data: eventi = [] } = useQuery({
    queryKey: ["eventi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventi")
        .select("id, nome, data_evento, luogo, stato")
        .order("data_evento", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: iscrizioni = [], isLoading } = useQuery({
    queryKey: ["iscrizioni-admin", eventoId],
    queryFn: async () => {
      let q = supabase
        .from("iscrizioni")
        .select(
          "id, stato, categoria_peso, disciplina, created_at, evento_id, snapshot_nome, snapshot_cognome, snapshot_team, snapshot_peso_kg, snapshot_categoria, atleti(nome, cognome, nome_societa, peso_kg, disciplina), eventi(nome, data_evento, luogo)",
        )
        .order("created_at", { ascending: false });
      if (eventoId !== "tutti") q = q.eq("evento_id", eventoId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const cambiaStato = useMutation({
    mutationFn: async ({ id, stato }: { id: string; stato: string }) => {
      const { error } = await supabase.from("iscrizioni").update({ stato }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iscrizioni-admin"] });
      queryClient.invalidateQueries({ queryKey: ["mie-iscrizioni"] });
      queryClient.invalidateQueries({ queryKey: ["iscritti-evento"] });
    },
  });

  const elimina = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("iscrizioni").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iscrizioni-admin"] });
      queryClient.invalidateQueries({ queryKey: ["mie-iscrizioni"] });
      queryClient.invalidateQueries({ queryKey: ["iscritti-evento"] });
    },
  });

  const testo = cerca.trim().toLowerCase();
  const filtrate = (iscrizioni as any[]).filter((i) => {
    if (stato !== "tutti" && i.stato !== stato) return false;
    if (!testo) return true;
    const blob = `${i.snapshot_nome ?? i.atleti?.nome ?? ""} ${i.snapshot_cognome ?? i.atleti?.cognome ?? ""} ${
      i.snapshot_team ?? i.atleti?.nome_societa ?? ""
    } ${i.eventi?.nome ?? ""}`.toLowerCase();
    return blob.includes(testo);
  });

  const conteggi = {
    totali: filtrate.length,
    confermate: filtrate.filter((i) => i.stato === "confermata").length,
    attesa: filtrate.filter((i) => i.stato === "in attesa").length,
    respinte: filtrate.filter((i) => i.stato === "respinta").length,
  };

  function esportaCsv() {
    const righe = [
      ["Evento", "Data", "Atleta", "Società", "Disciplina", "Peso", "Categoria", "Stato"],
      ...filtrate.map((i) => [
        i.eventi?.nome ?? "",
        i.eventi?.data_evento ?? "",
        `${i.snapshot_cognome ?? i.atleti?.cognome ?? ""} ${i.snapshot_nome ?? i.atleti?.nome ?? ""}`.trim(),
        i.snapshot_team ?? i.atleti?.nome_societa ?? "",
        i.disciplina || i.atleti?.disciplina || "",
        i.snapshot_peso_kg ?? i.atleti?.peso_kg ?? "",
        i.snapshot_categoria ?? i.categoria_peso ?? "",
        i.stato,
      ]),
    ];
    const csv = righe
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "iscrizioni.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <Pannello className="grid gap-4 p-5 md:grid-cols-3">
        <Select
          label="Evento"
          value={eventoId}
          onChange={setEventoId}
          options={["tutti", ...(eventi as any[]).map((e) => e.id)]}
          etichette={{
            tutti: "Tutti gli eventi",
            ...Object.fromEntries(
              (eventi as any[]).map((e) => [
                e.id,
                `${e.nome} — ${formatDataBreve(e.data_evento)}`,
              ]),
            ),
          }}
        />
        <Select
          label="Stato"
          value={stato}
          onChange={setStato}
          options={["tutti", "in attesa", "confermata", "respinta"]}
          etichette={{ tutti: "Tutti gli stati" }}
        />
        <Input label="Cerca atleta, società o evento" value={cerca} onChange={setCerca} />
      </Pannello>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          {conteggi.totali} iscrizioni · {conteggi.confermate} confermate ·{" "}
          {conteggi.attesa} in attesa · {conteggi.respinte} respinte
        </p>
        <button
          type="button"
          onClick={esportaCsv}
          disabled={filtrate.length === 0}
          className="rounded-[10px] border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted disabled:opacity-50"
        >
          Esporta CSV
        </button>
      </div>

      <Pannello className="divide-y divide-border overflow-hidden">
        {isLoading && <Vuoto testo="Caricamento…" />}
        {!isLoading && filtrate.length === 0 && (
          <Vuoto testo="Nessuna iscrizione con questi filtri." />
        )}
        {filtrate.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
          >
            <div>
              <p className="text-sm font-medium">
                {i.snapshot_cognome ?? i.atleti?.cognome} {i.snapshot_nome ?? i.atleti?.nome}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {i.snapshot_team ?? i.atleti?.nome_societa} · {i.disciplina || i.atleti?.disciplina}
                {i.snapshot_peso_kg ?? i.atleti?.peso_kg ? ` · ${i.snapshot_peso_kg ?? i.atleti?.peso_kg} kg` : ""}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {i.eventi?.nome} · {formatDataBreve(i.eventi?.data_evento)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  i.stato === "confermata"
                    ? "rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400"
                    : i.stato === "respinta"
                      ? "rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-destructive"
                      : "rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                }
              >
                {i.stato}
              </span>
              {i.stato !== "confermata" && (
                <button
                  type="button"
                  onClick={() => cambiaStato.mutate({ id: i.id, stato: "confermata" })}
                  className="rounded-[10px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
                >
                  Conferma
                </button>
              )}
              {i.stato !== "in attesa" && (
                <button
                  type="button"
                  onClick={() => cambiaStato.mutate({ id: i.id, stato: "in attesa" })}
                  className="rounded-[10px] border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted"
                >
                  In attesa
                </button>
              )}
              {i.stato !== "respinta" && (
                <button
                  type="button"
                  onClick={() => cambiaStato.mutate({ id: i.id, stato: "respinta" })}
                  className="rounded-[10px] border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-muted"
                >
                  Respingi
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm("Eliminare definitivamente questa iscrizione?")) {
                    elimina.mutate(i.id);
                  }
                }}
                className="text-[12px] text-destructive hover:underline"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </Pannello>
    </div>
  );
}
