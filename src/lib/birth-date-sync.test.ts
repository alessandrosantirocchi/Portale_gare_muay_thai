import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { datiGara, etaAllaData, type Iscrizione } from "./fight-hub";

const sql = readFileSync(new URL("../../drizzle/migrations/0051_sync_athlete_birth_date_open_registrations.sql", import.meta.url), "utf8");

test("Scurtarelli is 17, not 18, at Blackout on 15 November 2026", () => {
  assert.equal(etaAllaData("2009-02-15", "2026-11-15"), 17);
  const registration = { snapshot_data_nascita: "2009-02-15", snapshot_categoria: "JUNIOR 16–18 ANNI", senior_17: false } as Iscrizione;
  assert.equal(datiGara(registration, "2026-11-15").eta, 17);
  assert.equal(datiGara(registration, "2026-11-15").categoria, "JUNIOR 16–18 ANNI");
});

test("A roster birth-date correction synchronizes the same athlete's registration snapshot", () => {
  assert.match(sql, /AFTER UPDATE OF data_nascita ON public\.atleti/);
  assert.match(sql, /NEW\.data_nascita IS DISTINCT FROM OLD\.data_nascita/);
  assert.match(sql, /SET snapshot_data_nascita = NEW\.data_nascita/);
  assert.match(sql, /i\.atleta_id = NEW\.id/);
});

test("Birth-date synchronization preserves closed and past registration history", () => {
  assert.match(sql, /e\.id = i\.evento_id/);
  assert.match(sql, /e\.fine_iscrizioni > now\(\)/);
  assert.match(sql, /e\.stato IN \('aperto', 'iscrizioni aperte'\)/);
});

test("Registration validation accepts only the roster birth date for an open event", () => {
  const validator = readFileSync(new URL("../../drizzle/migrations/0052_allow_validated_birth_snapshot_sync.sql", import.meta.url), "utf8");
  assert.match(validator, /NEW\.snapshot_data_nascita IS NOT DISTINCT FROM a\.data_nascita/);
  assert.match(validator, /AND e\.stato IN \('aperto', 'iscrizioni aperte'\) AND e\.fine_iscrizioni > now\(\)/);
  assert.match(validator, /ELSE\s+NEW\.snapshot_data_nascita := OLD\.snapshot_data_nascita/);
});