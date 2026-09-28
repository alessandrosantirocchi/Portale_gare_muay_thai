// IFMA Rules & Regulations v3.057 (11 May 2026), Rule 4.
// https://muaythai.sport/wp-content/uploads/2026/05/IFMA-Rules-and-Regulations-v3.057_110526.pdf
const elite = [45, 48, 51, 54, 57, 60, 63.5, 67, 71, 75];

export function categoriaPesoIfma(peso: number | null, sesso: string, nascita: string | null, dataEvento: string): string | null {
  if (peso === null || !Number.isFinite(peso) || peso <= 0 || !nascita || !dataEvento) return null;
  const gender = sesso.trim().toUpperCase();
  if (gender !== "M" && gender !== "F") return null;
  const eta = Number(dataEvento.slice(0, 4)) - Number(nascita.slice(0, 4));
  let limiti: number[];
  if (eta >= 18) limiti = gender === "M" ? [...elite, 81, 86, 91] : elite;
  else if (eta >= 16) limiti = gender === "M" ? [...elite, 81, 86, 91] : [42, ...elite];
  else if (eta >= 14) limiti = gender === "M" ? [38, 40, 42, ...elite.slice(0, 3), ...elite.slice(3), 81].filter((x, i, arr) => arr.indexOf(x) === i) : [36, 38, 40, 42, ...elite.slice(0, 3), ...elite.slice(3)].filter((x, i, arr) => arr.indexOf(x) === i);
  else if (eta >= 12) limiti = gender === "M" ? [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 63.5, 67, 71] : [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 63.5];
  else if (eta >= 10) limiti = gender === "M" ? [30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 63.5, 67] : [30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60];
  else return null;
  return `-${limiti.find((v) => peso <= v) ?? `+${limiti[limiti.length - 1]}`} kg`.replace("-+", "+");
}