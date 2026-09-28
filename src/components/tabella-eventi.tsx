import { Link } from "@tanstack/react-router";
import type { Evento } from "@/lib/queries";
import { formatDataBreve, disciplineEvento } from "@/lib/format";
import { Pannello, Vuoto } from "@/components/ui-blocchi";

export function TabellaEventi({
  eventi,
  iscritti,
}: {
  eventi: Evento[];
  iscritti: Record<string, number>;
}) {
  return (
    <Pannello className="overflow-hidden">
      <div className="hidden grid-cols-12 gap-4 border-b border-border px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:grid">
        <span className="col-span-1">Data</span>
        <span className="col-span-4">Evento</span>
        <span className="col-span-3">Sede</span>
        <span className="col-span-2 text-right">Fine iscrizioni</span>
        <span className="col-span-2 text-right">Iscritti</span>
      </div>
      <div className="divide-y divide-border">
        {eventi.length === 0 && <Vuoto testo="Nessun evento con questi filtri." />}
        {eventi.map((e) => (
          <Link
            key={e.id}
            to="/eventi/$id"
            params={{ id: e.id }}
            className="grid grid-cols-2 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted md:grid-cols-12 md:gap-4"
          >
            <span className="col-span-1 font-mono text-[13px]">{formatDataBreve(e.data_evento)}</span>
            <span className="col-span-1 md:col-span-4">
              <span className="block text-sm font-medium">{e.nome}</span>
              <span className="block text-[11px] text-muted-foreground md:hidden">
                  {e.luogo} · {disciplineEvento(e).join(" · ")}
              </span>
              <span className="hidden text-[11px] text-muted-foreground md:inline">
                  {disciplineEvento(e).join(" · ")} · {e.tipo}
              </span>
            </span>
            <span className="col-span-3 hidden text-[13px] md:block">
              {e.sede ? `${e.sede} · ` : ""}
              {e.luogo}
            </span>
            <span className="col-span-1 font-mono text-[12px] text-primary md:col-span-2 md:text-right">
              {formatDataBreve(e.fine_iscrizioni)}
            </span>
            <span className="col-span-1 font-mono text-[13px] md:col-span-2 md:text-right">
              {iscritti[e.id] ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </Pannello>
  );
}

export function FiltriDisciplina({
  valore,
  onChange,
  opzioni,
}: {
  valore: string;
  onChange: (v: string) => void;
  opzioni: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2 text-[13px] font-medium">
      {["Tutti", ...opzioni].map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={
            valore === o
              ? "rounded-full bg-ink px-3 py-1.5 text-ink-foreground"
              : "rounded-full bg-card px-3 py-1.5 text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}
