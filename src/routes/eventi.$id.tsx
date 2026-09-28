import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvento, fetchIscrittiEvento, type Atleta } from "@/lib/queries";
import { contoAllaRovescia, formatDataCompleta } from "@/lib/format";
import { Pannello, Vuoto, Etichetta } from "@/components/ui-blocchi";
import { useSession } from "@/lib/auth";
import { useLocandina } from "@/lib/locandine";

export const Route = createFileRoute("/eventi/$id")({
  head: () => ({
    meta: [
      { title: "Scheda evento — FIGHT HUB" },
      {
        name: "description",
        content: "Dettagli dell'evento, chiusura iscrizioni ed elenco degli atleti iscritti.",
      },
      { property: "og:title", content: "Scheda evento — FIGHT HUB" },
      {
        property: "og:description",
        content: "Informazioni sull'evento e iscrizione degli atleti della tua società.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedaEvento,
});

function SchedaEvento() {
  const { id } = useParams({ from: "/eventi/$id" });
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [atletaId, setAtletaId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [messaggio, setMessaggio] = useState<string | null>(null);

  const { data: evento, isLoading } = useQuery({
    queryKey: ["evento", id],
    queryFn: () => fetchEvento(id),
  });
  const { data: iscritti = [] } = useQuery({
    queryKey: ["iscritti", id],
    queryFn: () => fetchIscrittiEvento(id),
  });
  const { data: mieiAtleti = [] } = useQuery({
    queryKey: ["miei-atleti", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atleti")
        .select("*")
        .eq("societa_id", session!.user.id)
        .order("cognome");
      if (error) throw error;
      return (data ?? []) as Atleta[];
    },
  });

  const iscrivi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("iscrizioni").insert({
        evento_id: id,
        atleta_id: atletaId,
        societa_id: session!.user.id,
        categoria_peso: categoria || null,
        disciplina: evento?.disciplina ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessaggio("Atleta iscritto correttamente.");
      setAtletaId("");
      setCategoria("");
      queryClient.invalidateQueries({ queryKey: ["iscritti", id] });
      queryClient.invalidateQueries({ queryKey: ["conteggi-iscritti"] });
    },
    onError: (e: any) =>
      setMessaggio(
        e?.code === "23505" ? "Questo atleta è già iscritto." : "Non è stato possibile iscrivere l'atleta.",
      ),
  });

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Caricamento…</p>;
  }
  if (!evento) {
    return (
      <div className="mx-auto max-w-[900px] px-5 py-20 text-center">
        <p className="text-sm text-muted-foreground">Evento non trovato.</p>
        <Link to="/calendario" className="mt-4 inline-block text-sm text-primary">
          Torna al calendario
        </Link>
      </div>
    );
  }

  const countdown = contoAllaRovescia(evento.fine_iscrizioni);
  const aperto = !!countdown;

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <Link to="/calendario" className="text-[13px] text-muted-foreground hover:text-foreground">
        ← Calendario eventi
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Etichetta>{evento.disciplina}</Etichetta>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase leading-none">
            {evento.nome}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{evento.descrizione}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Data</dt>
              <dd className="mt-1 font-display text-xl">{formatDataCompleta(evento.data_evento)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Orario</dt>
              <dd className="mt-1 text-sm">{evento.orario ?? "Da definire"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Luogo</dt>
              <dd className="mt-1 text-sm">
                {evento.sede}
                <br />
                {evento.luogo}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Fine iscrizioni
              </dt>
              <dd className="mt-1 text-sm text-primary">
                {formatDataCompleta(evento.fine_iscrizioni)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Iscritti</dt>
              <dd className="mt-1 font-display text-xl">{iscritti.length}</dd>
            </div>
          </dl>

          {evento.programma && (
            <>
              <h2 className="mt-8 mb-3 font-display text-xl font-semibold uppercase tracking-wide">
                Programma della giornata
              </h2>
              <Pannello className="divide-y divide-border overflow-hidden">
                {evento.programma
                  .split("\n")
                  .map((r) => r.trim())
                  .filter(Boolean)
                  .map((riga, idx) => (
                    <p key={idx} className="px-5 py-3 text-sm">
                      {riga}
                    </p>
                  ))}
              </Pannello>
            </>
          )}

          <h2 className="mt-8 mb-3 font-display text-xl font-semibold uppercase tracking-wide">
            Atleti iscritti
          </h2>
          <Pannello className="divide-y divide-border overflow-hidden">
            {iscritti.length === 0 && <Vuoto testo="Nessun atleta iscritto per ora." />}
            {iscritti.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {i.atleti?.nome} {i.atleti?.cognome}
                  </p>
                  <p className="text-[12px] text-muted-foreground">{i.atleti?.nome_societa}</p>
                </div>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {i.categoria_peso ?? `${i.atleti?.peso_kg ?? "—"} kg`} · {i.stato}
                </span>
              </div>
            ))}
          </Pannello>
        </div>

        <div className="lg:col-span-5">
          <LocandinaEvento path={evento.locandina_path} nome={evento.nome} />
          <Pannello className="p-5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide">
              Iscrivi un atleta
            </h2>
            {!aperto && (
              <p className="mt-2 text-sm text-muted-foreground">
                Le iscrizioni per questo evento sono chiuse.
              </p>
            )}
            {aperto && !session && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Accedi con le credenziali della tua società per iscrivere gli atleti.
                </p>
                <Link
                  to="/auth"
                  className="mt-4 inline-flex rounded-[10px] bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground"
                >
                  Accedi all'area società
                </Link>
              </div>
            )}
            {aperto && session && (
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMessaggio(null);
                  if (atletaId) iscrivi.mutate();
                }}
              >
                <label className="text-[12px] font-medium text-muted-foreground">
                  Atleta
                  <select
                    required
                    value={atletaId}
                    onChange={(e) => setAtletaId(e.target.value)}
                    className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Seleziona un atleta…</option>
                    {mieiAtleti.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.cognome} {a.nome} · {a.peso_kg ?? "—"} kg
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[12px] font-medium text-muted-foreground">
                  Categoria di peso
                  <input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="es. -71 kg senior"
                    className="mt-1 w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                {mieiAtleti.length === 0 && (
                  <p className="text-[12px] text-muted-foreground">
                    Non hai ancora atleti: aggiungili dalla tua area società.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={iscrivi.isPending}
                  className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {iscrivi.isPending ? "Invio…" : "Conferma iscrizione"}
                </button>
                {messaggio && <p className="text-[12px]">{messaggio}</p>}
              </form>
            )}
          </Pannello>
        </div>
      </div>
    </div>
  );
}

function LocandinaEvento({ path, nome }: { path: string | null; nome: string }) {
  const { data: url } = useLocandina(path);
  if (!path || !url) return null;
  return (
    <Pannello className="mb-6 overflow-hidden">
      <img
        src={url}
        alt={`Locandina ufficiale dell'evento ${nome}`}
        loading="lazy"
        className="w-full object-cover"
      />
    </Pannello>
  );
}
