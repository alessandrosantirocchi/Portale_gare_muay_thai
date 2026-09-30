import type { Database } from "@/integrations/supabase/types";

export const CLASSI = ["A", "B", "C", "N"] as const;
export const CATEGORIE = ["SENIOR", "JUNIOR 16–18 ANNI", "OLD CADETTI 13–15 ANNI", "YOUNG CADETTI 10–12 ANNI", "GIOCO SPORT 6–9 ANNI", "ALTRO"] as const;
export const FORMATI_ATLETA = ["KO", "Light"] as const;
export const CATEGORIE_ETA_PER_FORMATO: Record<string, readonly string[]> = {
  KO: ["JUNIOR 16–18 ANNI", "SENIOR 19–40 ANNI"],
  Light: ["GIOCO SPORT 6–9 ANNI", "YOUNG CADET 10–12 ANNI", "OLD CADET 13–15 ANNI", "JUNIOR 16–18 ANNI", "SENIOR 19–40 ANNI", "MASTER 40–55 ANNI"],
};
export function categorieEtaDisponibili(formato: string) {
  return [...(CATEGORIE_ETA_PER_FORMATO[formato] ?? [])];
}
export const DISCIPLINE_PER_FORMATO: Record<string, readonly string[]> = {
  KO: ["Muay Thai", "K1 Rules", "Fight Code Rules", "MMA"],
  Light: ["Muay Thai", "K1 Rules", "Kick Light", "A-MMA"],
};
const KO_DISCIPLINE: readonly string[] = ["Muay Thai", "K1 Rules", "Fight Code Rules", "MMA"];
export const disciplinePerFormato = (formato: string): readonly string[] => DISCIPLINE_PER_FORMATO[formato] ?? KO_DISCIPLINE;
export const DISCIPLINE_GARA = ["Muay Thai", "K1 Rules", "Fight Code Rules", "MMA", "Kick Light", "A-MMA"] as const;
export const STATI_EVENTO = ["bozza", "iscrizioni aperte", "iscrizioni chiuse", "matchmaking", "pubblicato", "concluso"] as const;

export type Iscrizione = Database["public"]["Tables"]["iscrizioni"]["Row"] & { atleti?: { nome: string; cognome: string; nome_societa: string; sesso: string; data_nascita: string | null; peso_kg: number | null; disciplina: string; serie: string | null; categoria: string | null; totale_match: number | null } | null };

export function etaAllaData(nascita: string | null, dataEvento: string) {
  if (!nascita) return null;
  const y = Number(nascita.slice(0, 4)), m = Number(nascita.slice(5, 7)), d = Number(nascita.slice(8, 10));
  const ey = Number(dataEvento.slice(0, 4)), em = Number(dataEvento.slice(5, 7)), ed = Number(dataEvento.slice(8, 10));
  return ey - y - (em < m || (em === m && ed < d) ? 1 : 0);
}

export function datiGara(i: Iscrizione, dataEvento: string) {
  return {
    nome: i.snapshot_nome ?? i.atleti?.nome ?? "",
    cognome: i.snapshot_cognome ?? i.atleti?.cognome ?? "",
    team: i.snapshot_team ?? i.atleti?.nome_societa ?? "",
    sesso: i.snapshot_sesso ?? i.atleti?.sesso ?? "",
    data_nascita: i.snapshot_data_nascita ?? i.atleti?.data_nascita ?? null,
    eta: etaAllaData(i.snapshot_data_nascita ?? i.atleti?.data_nascita ?? null, dataEvento),
    peso: i.snapshot_peso_kg ?? i.atleti?.peso_kg ?? null,
    disciplina: i.disciplina ?? i.atleti?.disciplina ?? "",
    serie: i.snapshot_serie ?? i.atleti?.serie ?? "",
    categoria: i.snapshot_categoria ?? i.atleti?.categoria ?? "",
    coach: i.snapshot_coach ?? "",
    match: i.snapshot_totale_match ?? i.atleti?.totale_match ?? 0,
  };
}

export function compatibilita(a: Iscrizione, b: Iscrizione, dataEvento: string) {
  const x = datiGara(a, dataEvento), y = datiGara(b, dataEvento);
  if (a.id === b.id || a.societa_id === b.societa_id) return null;
  if (x.sesso !== y.sesso || x.disciplina.toUpperCase() !== y.disciplina.toUpperCase()) return null;
  const peso = x.peso == null || y.peso == null ? null : Math.abs(x.peso - y.peso);
  const eta = x.eta == null || y.eta == null ? null : Math.abs(x.eta - y.eta);
  const esperienza = Math.abs(x.match - y.match);
  const serieDiversa = !!x.serie && !!y.serie && x.serie !== y.serie;
  const categoriaDiversa = !!x.categoria && !!y.categoria && x.categoria !== y.categoria;
  const score = Math.max(0, Math.round(100 - (peso ?? 5) * 5 - (eta ?? 3) * 2 - esperienza * 3 - (serieDiversa ? 20 : 0) - (categoriaDiversa ? 22 : 0)));
  return { score, peso, eta, esperienza, serieDiversa, categoriaDiversa };
}

export function motivoSenzaMatch(i: Iscrizione, altri: Iscrizione[], dataEvento: string) {
  const d = datiGara(i, dataEvento);
  const disponibili = altri.filter((a) => a.id !== i.id && a.societa_id !== i.societa_id);
  if (!disponibili.some((a) => datiGara(a, dataEvento).sesso === d.sesso)) return "Nessun avversario dello stesso genere";
  if (!disponibili.some((a) => datiGara(a, dataEvento).sesso === d.sesso && datiGara(a, dataEvento).disciplina.toUpperCase() === d.disciplina.toUpperCase())) return "Disciplina non compatibile";
  const candidati = disponibili.map((a) => compatibilita(i, a, dataEvento)).filter((c) => c !== null);
  if (candidati.every((c) => c.categoriaDiversa)) return "Nessun atleta compatibile nella stessa categoria";
  if (candidati.every((c) => c.serieDiversa)) return "Classe non compatibile";
  if (candidati.every((c) => c.peso !== null && c.peso > 5)) return "Differenza peso elevata";
  if (candidati.every((c) => c.esperienza > 5)) return "Differenza esperienza elevata";
  return "Nessun abbinamento confermato";
}

export function proponiAbbinamenti(iscrizioni: Iscrizione[], dataEvento: string) {
  const candidati = iscrizioni.flatMap((a, ix) => iscrizioni.slice(ix + 1).map((b) => ({ a, b, c: compatibilita(a, b, dataEvento) })));
  const compatibili = candidati.filter((v): v is typeof v & { c: NonNullable<typeof v.c> } => v.c !== null && v.c.score >= 55).sort((a, b) => b.c.score - a.c.score);
  const usati = new Set<string>();
  const coppie: typeof compatibili = [];
  for (const p of compatibili) {
    if (usati.has(p.a.id) || usati.has(p.b.id)) continue;
    coppie.push(p);
    usati.add(p.a.id); usati.add(p.b.id);
  }
  return { coppie, senzaMatch: iscrizioni.filter((i) => !usati.has(i.id)) };
}

export function proponiPool(iscrizioni: Iscrizione[], dataEvento: string) {
  const gruppi: { ids: string[]; score: number }[] = [];
  // Evaluate manageable groups independently; large event rosters must not freeze the browser.
  const candidati = [...iscrizioni];
  while (candidati.length >= 4) {
    let migliore: { ids: string[]; score: number } | null = null;
    const limite = Math.min(candidati.length, 36);
    for (let a = 0; a < limite - 3; a++) for (let b = a + 1; b < limite - 2; b++) for (let c = b + 1; c < limite - 1; c++) for (let d = c + 1; d < limite; d++) {
      const gruppo = [candidati[a], candidati[b], candidati[c], candidati[d]].filter((i): i is Iscrizione => i !== undefined);
      if (gruppo.length !== 4) continue;
      const scores = gruppo.flatMap((x, ix) => gruppo.slice(ix + 1).map((y) => compatibilita(x, y, dataEvento)?.score ?? 0));
      const score = Math.round(scores.reduce((sum, n) => sum + n, 0) / 6);
      if (scores.every((n) => n >= 55) && (!migliore || score > migliore.score)) migliore = { ids: gruppo.map((i) => i.id), score };
    }
    if (!migliore) {
      if (candidati.length > 36) { candidati.splice(0, 36); continue; }
      break;
    }
    gruppi.push(migliore);
    for (const id of migliore.ids) candidati.splice(candidati.findIndex((i) => i.id === id), 1);
  }
  return gruppi;
}