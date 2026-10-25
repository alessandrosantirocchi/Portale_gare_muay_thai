import { describe, expect, test } from "bun:test";
import { compatibilita, type Iscrizione } from "./fight-hub";

const base = (o: Partial<Iscrizione> & { formato: string }): Iscrizione => ({
  id: crypto.randomUUID(), evento_id: "e", atleta_id: "a", societa_id: crypto.randomUUID(), categoria_peso: "-63 kg", disciplina: "Muay Thai", stato: "confermata", note: null, created_at: "", snapshot_nome: "A", snapshot_cognome: "B", snapshot_data_nascita: "2010-01-01", snapshot_sesso: "M", snapshot_team: "T", snapshot_coach: null, snapshot_peso_kg: 63, snapshot_serie: null, snapshot_categoria: "OLD CADET 13–15 ANNI", snapshot_totale_match: 5, senior_17: false,
  atleti: { nome: "A", cognome: "B", nome_societa: "T", sesso: "M", data_nascita: null, peso_kg: null, disciplina: "Muay Thai", serie: null, categoria: null, totale_match: null, formato: o.formato },
  ...o,
} as Iscrizione);

describe("proposte automatiche", () => {
  test("KO e Light non vengono mai abbinati", () => {
    const ko = base({ formato: "KO", snapshot_serie: "N", snapshot_categoria: "JUNIOR 16–18 ANNI", categoria_peso: "-63.5 kg", snapshot_peso_kg: 63.5 });
    const light = base({ formato: "Light" });
    expect(compatibilita(ko, light, "2026-11-15")).toBeNull();
  });
  test("fasce d'età diverse non vengono abbinate", () => {
    expect(compatibilita(base({ formato: "Light" }), base({ formato: "Light", snapshot_categoria: "JUNIOR 16–18 ANNI" }), "2026-11-15")).toBeNull();
  });
  test("categorie di peso diverse non vengono abbinate", () => {
    expect(compatibilita(base({ formato: "Light" }), base({ formato: "Light", categoria_peso: "-67 kg" }), "2026-11-15")).toBeNull();
  });
  test("nel KO serve la stessa classe", () => {
    const k = { formato: "KO", snapshot_categoria: "SENIOR 19–40 ANNI" };
    expect(compatibilita(base({ ...k, snapshot_serie: "N" }), base({ ...k, snapshot_serie: "C" }), "2026-11-15")).toBeNull();
    expect(compatibilita(base({ ...k, snapshot_serie: "C" }), base({ ...k, snapshot_serie: "C" }), "2026-11-15")).not.toBeNull();
  });
});
