import { DISCIPLINE, FORMATI_INCONTRO, disciplinaCanonica, type FormatiIncontro } from "@/lib/format";

export function DisciplineEvento({ value, onChange, formati, onFormatiChange }: { value: string[]; onChange: (next: string[]) => void; formati: FormatiIncontro; onFormatiChange: (next: FormatiIncontro) => void }) {
  const options = DISCIPLINE;
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[12px] font-medium text-muted-foreground">Discipline</legend>
       <div className="grid gap-y-3">
        {options.map((discipline) => (
           <div key={discipline} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
           <label className="flex min-w-0 items-center gap-2 font-medium">
            <input
              type="checkbox"
               checked={value.some((v) => disciplinaCanonica(v) === disciplinaCanonica(discipline))}
              onChange={(event) => {
                 const next = event.target.checked ? [...value.filter((item) => disciplinaCanonica(item) !== disciplinaCanonica(discipline)), discipline] : value.filter((item) => disciplinaCanonica(item) !== disciplinaCanonica(discipline));
                if (next.length) onChange(next);
              }}
            />
             <span>{discipline}</span>
           </label>
           {value.some((v) => disciplinaCanonica(v) === disciplinaCanonica(discipline)) && ["Muay Thai", "Kickboxing", "K1"].includes(discipline) && FORMATI_INCONTRO.map((formato) => <label key={formato} className="flex items-center gap-1.5 text-muted-foreground"><input type="checkbox" checked={(formati[discipline] ?? []).includes(formato)} onChange={(event) => onFormatiChange({ ...formati, [discipline]: event.target.checked ? [...(formati[discipline] ?? []), formato] : (formati[discipline] ?? []).filter((f) => f !== formato) })} />{formato}</label>)}
           </div>
        ))}
      </div>
    </fieldset>
  );
}