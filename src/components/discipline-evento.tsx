import { DISCIPLINE, disciplinaCanonica } from "@/lib/format";

export function DisciplineEvento({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const options = [...new Map([...value, ...DISCIPLINE].map((v) => [disciplinaCanonica(v), v])).values()];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[12px] font-medium text-muted-foreground">Discipline</legend>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {options.map((discipline) => (
          <label key={discipline} className="flex min-w-0 items-center gap-2 text-xs">
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
        ))}
      </div>
    </fieldset>
  );
}