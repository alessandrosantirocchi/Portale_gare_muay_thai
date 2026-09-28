export const MESI = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

export function formatDataBreve(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, "0")} ${MESI[d.getMonth()]}`;
}

export function formatDataCompleta(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, "0")} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

export function iniziali(nome: string, cognome: string) {
  return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase();
}

export function nomeProprio(value: string) {
  return value.trim().toLocaleLowerCase("it-IT").replace(/(^|[\s'’\-])([^\s'’\-])/gu, (_, separator: string, initial: string) => separator + initial.toLocaleUpperCase("it-IT"));
}

export function contoAllaRovescia(fine: string) {
  const diff = new Date(fine).getTime() - Date.now();
  if (diff <= 0) return null;
  const giorni = Math.floor(diff / 86400000);
  const ore = Math.floor((diff % 86400000) / 3600000);
  const minuti = Math.floor((diff % 3600000) / 60000);
  return { giorni, ore, minuti };
}

export const DISCIPLINE = [
  "Muay Thai",
  "Kickboxing",
  "K1",
  "FIGHT CODE",
  "ALTRO",
];

export const FORMATI_INCONTRO = ["Light", "Contatto pieno"] as const;
export type FormatiIncontro = Record<string, string[]>;

export function disciplineEvento(evento: { disciplina: string; discipline_ammesse?: string[] | null }) {
  const values = evento.discipline_ammesse?.length ? evento.discipline_ammesse : [evento.disciplina];
  return [...new Map(values.map((v) => {
    const value = v.trim().toLocaleLowerCase("it-IT");
    const normalized = value === "contatto pieno" || value === "light contact" ? "Kickboxing" : v;
    return [disciplinaCanonica(normalized), normalized] as const;
  })).values()];
}

export function disciplinaCanonica(value: string) {
  return value.trim().toLocaleUpperCase("it-IT");
}
