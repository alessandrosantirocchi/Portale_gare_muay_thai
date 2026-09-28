import { DISCIPLINE } from "@/lib/format";

export function DisciplineEvento({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const options = [...new Set([...DISCIPLINE, ...value])];
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[12px] font-medium text-muted-foreground">Discipline</legend>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {options.map((discipline) => (
          <label key={discipline} className="flex min-w-0 items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={value.includes(discipline)}
              onChange={(event) => {
                const next = event.target.checked ? [...value, discipline] : value.filter((item) => item !== discipline);
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