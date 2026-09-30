// IFMA Rules & Regulations, Rule 4 — fasce e limiti di peso come da tabella fornita.
// Fasce: Young Cadet 10–12, Older Cadet 13–15, Junior 16–18, Senior 19–40.
type Limiti = { M: number[]; F: number[] };

// Gioco Sport (fino a 9 anni, solo Light): parte da -24 e riprende i limiti Young Cadet.
const GIOCO_SPORT: Limiti = { M: [24, 28, 32, 37, 42, 47, 52, 57, 60], F: [24, 28, 32, 37, 42, 47, 52, 57, 60] };
const YOUNG_CADET: Limiti = { M: [28, 32, 37, 42, 47, 52, 57, 60], F: [28, 32, 37, 42, 47, 52, 57, 60] };
const OLDER_CADET: Limiti = { M: [32, 37, 42, 47, 52, 57, 63, 69], F: [32, 37, 42, 46, 50, 55, 60, 65] };
const JUNIOR: Limiti = { M: [45, 48, 51, 54, 57, 60, 63.5, 67, 71, 75, 81, 86, 91], F: [42, 45, 48, 51, 54, 57, 60, 63.5, 67, 71, 75] };
const SENIOR: Limiti = { M: [48, 51, 54, 57, 60, 63.5, 67, 71, 75, 81, 86, 91], F: [45, 48, 51, 54, 57, 60, 63.5, 67, 71, 75] };

// Roster choices follow the supplied weight chart. Event registrations still use
// the official weight calculation below, independently of this chosen roster value.
const pesiUomini = [48, 51, 54, 57, 60, 63.5, 67, 71, 75, 81, 86, 91];
const pesiDonne = [45, 48, 51, 54, 57, 60, 63.5, 67, 71, 75];
export function categoriePesoRoster(sesso: string): string[] {
  const base = (sesso === "F" ? pesiDonne : pesiUomini).map((peso) => `-${peso} kg`);
  return sesso === "F" ? base : [...base, "+91 kg"];
}

// Categorie di peso coerenti con la fascia di età scelta (es. Gioco Sport parte da -24).
export function categoriePesoPerCategoria(sesso: string, categoria: string): string[] {
  const gender = sesso === "F" ? "F" : "M";
  const c = categoria.toUpperCase();
  const fascia = c.includes("GIOCO SPORT") ? GIOCO_SPORT : c.includes("YOUNG") ? YOUNG_CADET : c.includes("OLD CADET") ? OLDER_CADET : c.includes("JUNIOR") ? JUNIOR : SENIOR;
  const limiti = fascia[gender];
  const base = limiti.map((peso) => `-${peso} kg`);
  // Gioco Sport e Young Cadet hanno la +60 per entrambi i generi; per le altre fasce la + resta solo maschile.
  const conPlus = fascia === GIOCO_SPORT || fascia === YOUNG_CADET || gender === "M";
  return conPlus ? [...base, `+${limiti[limiti.length - 1]} kg`] : base;
}

function etaCompiuta(nascita: string, data: string): number | null {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(nascita) || Number.isNaN(Date.parse(nascita)) || new Date(nascita).toISOString().slice(0, 10) !== nascita) return null;
  const y = Number(nascita.slice(0, 4)), m = Number(nascita.slice(5, 7)), d = Number(nascita.slice(8, 10));
  const ey = Number(data.slice(0, 4)), em = Number(data.slice(5, 7)), ed = Number(data.slice(8, 10));
  return ey - y - (em < m || (em === m && ed < d) ? 1 : 0);
}

function limitiPerEta(sesso: string, eta: number | null): number[] {
  const gender = sesso.trim().toUpperCase();
  if ((gender !== "M" && gender !== "F") || eta === null) return [];
  // Master (Light, 40–55) usa gli stessi limiti del Senior.
  const fascia = eta <= 9 ? GIOCO_SPORT : eta <= 12 ? YOUNG_CADET : eta <= 15 ? OLDER_CADET : eta <= 18 ? JUNIOR : SENIOR;
  return fascia[gender as "M" | "F"];
}

export function categoriePesoIfma(sesso: string, nascita: string, dataEvento: string): string[] {
  if (!nascita || !dataEvento) return [];
  const limiti = limitiPerEta(sesso, etaCompiuta(nascita, dataEvento));
  return limiti.length ? [...limiti.map((value) => `-${value} kg`), `+${limiti[limiti.length - 1]} kg`] : [];
}

export function categoriaPesoIfma(peso: number | null, sesso: string, nascita: string | null, dataEvento: string): string | null {
  if (peso === null || !Number.isFinite(peso) || peso <= 0 || !nascita || !dataEvento) return null;
  const limiti = limitiPerEta(sesso, etaCompiuta(nascita, dataEvento));
  if (!limiti.length) return null;
  return `-${limiti.find((v) => peso <= v) ?? `+${limiti[limiti.length - 1]}`} kg`.replace("-+", "+");
}
