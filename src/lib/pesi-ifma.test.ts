import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { categoriePesoPerCategoria, categoriaPesoIfma } from "./pesi-ifma";

const migration = readFileSync(new URL("../../drizzle/migrations/0034_align_athlete_weight_constraint_with_cadet_divisions.sql", import.meta.url), "utf8");
const accepted = new Set([...migration.matchAll(/'([+-][\d.]+ kg)'/g)].map((match) => match[1]));

describe("Categorie giovanili accettate dal roster e dal database", () => {
  test("Young Cadet di 67 kg rientra nella -67", () => {
    expect(categoriaPesoIfma(67, "M", "2015-01-01", "2026-10-22")).toBe("-67 kg");
    expect(accepted.has("-67 kg")).toBe(true);
  });
  test("Older Cadet maschio di 67 kg rientra nella -69", () => {
    expect(categoriaPesoIfma(67, "M", "2012-01-01", "2026-10-22")).toBe("-69 kg");
    expect(accepted.has("-69 kg")).toBe(true);
  });
  test("Gioco Sport parte dalla -24", () => {
    expect(categoriePesoPerCategoria("M", "GIOCO SPORT 6–9 ANNI")[0]).toBe("-24 kg");
    expect(accepted.has("-24 kg")).toBe(true);
  });
  test("Tutte le opzioni giovanili dei due generi sono salvabili", () => {
    for (const gender of ["M", "F"]) {
      for (const band of ["GIOCO SPORT 6–9 ANNI", "YOUNG CADET 10–12 ANNI", "OLD CADET 13–15 ANNI"]) {
        const options = categoriePesoPerCategoria(gender, band);
        expect(options.length).toBeGreaterThan(0);
        for (const option of options) expect(accepted.has(option)).toBe(true);
      }
    }
  });
});