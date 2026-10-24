import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../../drizzle/migrations/0046_remove_medical_certificate_registration_gate.sql", import.meta.url), "utf8");
const body = migration.split("AS $function$")[1]?.split("$function$;")[0];

test("Registration validation never requires a medical certificate, including legacy events", () => {
  assert.ok(body, "The migration must replace the registration validator");
  assert.equal(/\b(?:blocca_certificato_scaduto|certificato_scadenza|certificato_path)\b/.test(body), false);
});