import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Firma l'URL della locandina solo se l'evento che la usa è pubblicato.
// Nessun dato personale: la locandina resta visibile a chiunque esattamente
// come prima, ma il controllo avviene lato server.
export const firmaLocandinaPubblica = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string }) => z.object({ path: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: evento } = await supabaseAdmin
      .from("eventi")
      .select("id")
      .eq("locandina_path", data.path)
      .eq("locandina_pubblicata", true)
      .maybeSingle();
    if (!evento) return null;
    const { data: firmata } = await supabaseAdmin.storage
      .from("locandine")
      .createSignedUrl(data.path, 60 * 60 * 24);
    return firmata?.signedUrl ?? null;
  });
