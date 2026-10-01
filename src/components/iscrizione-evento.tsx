import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Atleta, Evento } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { categoriaPesoIfma } from "@/lib/pesi-ifma";
import { CLASSI, categorieEtaDisponibili, etaAllaData } from "@/lib/fight-hub";

type Riga = {
  disciplina: string;
  peso_kg: string;
  serie: string;
  categoria: string;
  coach: string;
  totale_match: string;
  senior: boolean;
};

const campoClass = "mt-1 block w-full min-w-0 rounded-md border border-input bg-background px-1.5 py-1 text-[11px] text-foreground disabled:cursor-not-allowed disabled:opacity-60";

export function IscrizioneEvento({ evento, atleti, userId }: { evento: Evento; atleti: Atleta[]; userId: string | null }) {
  const qc = useQueryClient();
  const [existing, setExisting] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [sel, setSel] = useState("");
  const [riga, setRiga] = useState<Riga | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase.from("iscrizioni").select("atleta_id, stato").eq("evento_id", evento.id).eq("societa_id", userId).then(({ data }) => {
      if (active) setExisting(Object.fromEntries((data ?? []).map((i) => [i.atleta_id, i.stato])));
    });
    return () => { active = false; };
  }, [userId, evento.id]);

  const discipline = useMemo(() => {
    const lista = (evento.discipline_ammesse ?? []).filter(Boolean);
    return lista.length ? lista : [evento.disciplina];
  }, [evento]);

  const atleta = atleti.find((a) => a.id === sel) ?? null;
  const eta = atleta ? etaAllaData(atleta.data_nascita, evento.data_evento) : null;
  const catPeso = atleta && riga ? categoriaPesoIfma(riga.peso_kg ? Number(riga.peso_kg) : null, atleta.sesso, atleta.data_nascita, evento.data_evento) : null;

  function scegli(id: string) {
    setSel(id);
    setMsg("");
    const a = atleti.find((x) => x.id === id);
    if (!a) { setRiga(null); return; }
    const formato = a.formato ?? "KO";
    const disponibili = categorieEtaDisponibili(formato);
    setRiga({
      disciplina: discipline.find((d) => d.toUpperCase() === (a.disciplina ?? "").toUpperCase()) ?? discipline[0] ?? "",
      peso_kg: String(a.peso_kg ?? ""),
      serie: formato === "Light" ? "" : (a.serie ?? "N"),
      categoria: a.categoria && disponibili.includes(a.categoria) ? a.categoria : (disponibili[0] ?? ""),
      coach: a.coach ?? "",
      totale_match: String(a.totale_match ?? 0),
      senior: false,
    });
  }

  const aperto = ["aperto", "iscrizioni aperte"].includes(evento.stato) && new Date(evento.fine_iscrizioni).getTime() > Date.now() && (!evento.apertura_iscrizioni || new Date(evento.apertura_iscrizioni).getTime() <= Date.now());

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Accedi per iscriverti.");
      if (!atleta || !riga) throw new Error("Seleziona un atleta dal tuo roster.");
      const peso = riga.peso_kg ? Number(riga.peso_kg) : null;
      const categoriaPeso = categoriaPesoIfma(peso, atleta.sesso, atleta.data_nascita, evento.data_evento);
      if (!categoriaPeso) throw new Error("Inserisci un peso di gara valido (e controlla data di nascita e genere dell'atleta).");
      const { error } = await supabase.from("iscrizioni").insert({
        evento_id: evento.id, atleta_id: atleta.id, societa_id: userId, stato: "confermata",
        categoria_peso: categoriaPeso, disciplina: riga.disciplina,
        snapshot_nome: atleta.nome, snapshot_cognome: atleta.cognome,
        snapshot_sesso: atleta.sesso, snapshot_data_nascita: atleta.data_nascita,
        snapshot_team: atleta.nome_societa, snapshot_peso_kg: peso,
        snapshot_serie: riga.serie || null,
        snapshot_categoria: riga.senior ? "SENIOR" : riga.categoria || "SENIOR",
        senior_17: riga.senior,
        snapshot_coach: riga.coach || null,
        snapshot_totale_match: Number(riga.totale_match) || 0,
      });
      if (error) throw error;
      return atleta.id;
    },
    onSuccess: (id) => {
      setExisting((ids) => ({ ...ids, [id]: "confermata" }));
      setMsg("Atleta iscritto e confermato.");
      setSel(""); setRiga(null);
      for (const key of ["iscritti", "mie-iscrizioni", "conteggi-iscritti", "iscrizioni-atleta", "public-pools"]) qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) => setMsg(error.message),
  });

  const iscritti = atleti.filter((a) => existing[a.id]);

  return <section className="border-t border-border pt-5">
    <h2 className="font-display text-xl uppercase">Iscrivi atleti</h2>
    {!aperto ? <p className="mt-2 text-sm text-muted-foreground">Le iscrizioni per questo evento sono chiuse.</p>
      : !userId ? <p className="mt-2 text-sm"><Link to="/auth" className="text-primary underline">Accedi</Link> con la tua società per iscrivere gli atleti.</p>
      : <div className="mt-4 space-y-4">
        {atleti.length === 0 && <p className="text-sm text-muted-foreground">Nessun atleta nel roster. <Link to="/area" className="text-primary underline">Aggiungi un atleta</Link>.</p>}

        <label className="block max-w-md text-xs text-muted-foreground">Seleziona atleta dal tuo roster
          <select value={sel} onChange={(e) => scegli(e.target.value)} className="mt-1 block w-full rounded-md border border-input bg-background p-2 text-sm text-foreground">
            <option value="">— Scegli un atleta —</option>
            {atleti.map((a) => <option key={a.id} value={a.id} disabled={!!existing[a.id]}>
              {a.cognome} {a.nome} · {a.formato ?? "KO"} · {a.peso_kg ?? "—"} kg{existing[a.id] ? " (già iscritto)" : ""}
            </option>)}
          </select>
        </label>

        {atleta && riga && <form onSubmit={(e) => { e.preventDefault(); setMsg(""); save.mutate(); }} className="max-w-full overflow-x-auto">
          <div className="grid min-w-[1100px] grid-cols-[0.9fr_0.9fr_1.05fr_0.6fr_0.6fr_1.55fr_0.7fr_0.95fr_0.5fr_0.9fr_0.5fr_0.9fr] items-end gap-1.5 border-y border-border py-4">
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Nome<input disabled value={atleta.nome} className={campoClass} /></label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Cognome<input disabled value={atleta.cognome} className={campoClass} /></label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Data nascita<input disabled type="date" value={atleta.data_nascita ?? ""} className={campoClass} /></label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Genere<input disabled value={atleta.sesso} className={campoClass} /></label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">KO / Light<input disabled value={atleta.formato ?? "KO"} className={campoClass} /></label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Categoria di età
              <select disabled={riga.senior} value={riga.categoria} onChange={(e) => setRiga({ ...riga, categoria: e.target.value })} className={campoClass}>
                {[...new Set([riga.categoria, ...categorieEtaDisponibili(atleta.formato ?? "KO")])].filter(Boolean).map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Peso gara (kg)
              <input required type="number" min="0" step="0.1" value={riga.peso_kg} onChange={(e) => setRiga({ ...riga, peso_kg: e.target.value })} className={campoClass} />
            </label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Disciplina
              <select required value={riga.disciplina} onChange={(e) => setRiga({ ...riga, disciplina: e.target.value })} className={campoClass}>
                {discipline.map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Classe
              <select disabled={(atleta.formato ?? "KO") === "Light"} value={riga.serie} onChange={(e) => setRiga({ ...riga, serie: e.target.value })} className={campoClass}>
                <option value="">—</option>
                {CLASSI.map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Cat. di peso<input disabled value={catPeso ?? "—"} className={campoClass} /></label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Match
              <input type="number" min="0" value={riga.totale_match} onChange={(e) => setRiga({ ...riga, totale_match: e.target.value })} className={campoClass} />
            </label>
            <label className="min-w-0 text-[11px] leading-tight text-muted-foreground">Cognome coach
              <input value={riga.coach} onChange={(e) => setRiga({ ...riga, coach: e.target.value })} className={campoClass} />
            </label>
          </div>
          {eta !== null && [17, 18].includes(eta) && <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={riga.senior} onChange={(e) => setRiga({ ...riga, senior: e.target.checked })} />
            Iscrivi questo atleta nella categoria Senior
          </label>}
          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Iscrizione…" : "Conferma iscrizione all'evento"}</Button>
            <Button type="button" variant="outline" onClick={() => { setSel(""); setRiga(null); }}>Annulla</Button>
          </div>
        </form>}

        {msg && <p role="status" className="text-xs text-muted-foreground">{msg}</p>}

        {iscritti.length > 0 && <div className="border-t border-border pt-4">
          <h3 className="font-display text-lg uppercase">Atleti già iscritti</h3>
          <div className="mt-2 divide-y divide-border border-y border-border">
            {iscritti.map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span className="font-medium">{a.cognome} {a.nome}</span>
              <span className="text-[12px] text-muted-foreground">
                {categoriaPesoIfma(a.peso_kg, a.sesso, a.data_nascita, evento.data_evento) ?? "—"} · {existing[a.id]}
              </span>
            </div>)}
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">Per cambiare peso, disciplina o ritirare un atleta usa <Link to="/area" className="text-primary underline">Le mie iscrizioni</Link>.</p>
        </div>}
      </div>}
  </section>;
}
