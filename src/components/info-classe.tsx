import { useState } from "react";
import { Info } from "lucide-react";

const TESTO = (
  <>
    <p className="font-semibold">Classificazione atleti Fight1</p>
    <p className="mt-1">La classe dell'atleta viene definita in base all'esperienza agonistica e al numero di vittorie conseguite.</p>
    <ul className="mt-1.5 list-disc space-y-1 pl-4">
      <li><strong>Classe N (Novizi):</strong> da 0 a 3 incontri disputati.</li>
      <li><strong>Classe C:</strong> fino a 5 vittorie in classe C, anche non consecutive.</li>
      <li><strong>Classe B:</strong> accesso dopo 5 vittorie in classe C.</li>
      <li><strong>Classe A:</strong> accesso possibile dopo oltre 5 vittorie in classe B, previa valutazione della Commissione Tecnica Fight1.</li>
    </ul>
    <p className="mt-1.5"><strong>Nota:</strong> vengono considerate anche le esperienze agonistiche maturate in altre discipline a contatto pieno. Il passaggio di classe non è necessariamente automatico e può richiedere una valutazione tecnica.</p>
    <p className="mt-1.5 italic">Riferimento: Regolamento Fight1 – Sport da Ring, art. 6.</p>
  </>
);

export function InfoClasse() {
  const [aperto, setAperto] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Classificazione atleti Fight1"
        aria-expanded={aperto}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAperto((v) => !v); }}
        className="ml-1 inline-flex align-middle text-muted-foreground transition-colors hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {aperto && (
        <span className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setAperto(false)}>
          <span role="dialog" aria-label="Classificazione atleti Fight1" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-md border border-border bg-popover p-4 text-left text-xs leading-relaxed text-popover-foreground shadow-lg">
            {TESTO}
          </span>
        </span>
      )}
    </span>
  );
}
