import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assicuratiAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Permesso negato: solo gli amministratori.");
}

export type UtenteAdmin = {
  id: string;
  email: string | null;
  nome_societa: string | null;
  codice_fiscale: string | null;
  citta: string | null;
  created_at: string | null;
  ruoli: string[];
};

export const listaUtenti = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UtenteAdmin[]> => {
    await assicuratiAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profili, error: e1 } = await supabaseAdmin
      .from("profiles")
      .select("id, email, nome_societa, codice_fiscale, citta, created_at")
      .order("created_at", { ascending: false });
    if (e1) throw new Error(e1.message);

    const { data: ruoli, error: e2 } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (e2) throw new Error(e2.message);

    const mappa = new Map<string, string[]>();
    for (const r of ruoli ?? []) {
      const lista = mappa.get(r.user_id) ?? [];
      lista.push(r.role as string);
      mappa.set(r.user_id, lista);
    }

    return (profili ?? []).map((p: any) => ({
      ...p,
      ruoli: mappa.get(p.id) ?? [],
    }));
  });

export const creaUtente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        nome_societa: z.string().min(1),
        codice_fiscale: z.string().optional().default(""),
        citta: z.string().optional().default(""),
        ruolo: z.enum(["societa", "admin", "organizzatore"]).default("societa"),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assicuratiAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: creato, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nome_societa: data.nome_societa,
        codice_fiscale: data.codice_fiscale,
        citta: data.citta,
      },
    });
    if (error) throw new Error(error.message);
    const id = creato.user?.id;
    if (!id) throw new Error("Creazione account non riuscita.");

    await supabaseAdmin.from("profiles").upsert({
      id,
      email: data.email,
      nome_societa: data.nome_societa,
      codice_fiscale: data.codice_fiscale.replace(/\s+/g, "").toUpperCase() || null,
      citta: data.citta || null,
    });

    if (data.ruolo !== "societa") {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: id, role: data.ruolo },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    }

    return { id };
  });

export const impostaRuolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        user_id: z.string().uuid(),
        ruolo: z.enum(["admin", "organizzatore"]),
        attivo: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assicuratiAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId && data.ruolo === "admin" && !data.attivo) {
      throw new Error("Non puoi rimuovere il ruolo amministratore a te stesso.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.attivo) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.ruolo }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.ruolo);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
