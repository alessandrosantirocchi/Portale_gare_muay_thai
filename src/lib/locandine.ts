import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { firmaLocandinaPubblica } from "@/lib/locandine.functions";

export const BUCKET_LOCANDINE = "locandine";

export async function urlLocandina(path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET_LOCANDINE)
    .createSignedUrl(path, 60 * 60 * 24);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export function useLocandina(path: string | null | undefined) {
  return useQuery({
    queryKey: ["locandina", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: () => urlLocandina(path),
  });
}

// Per le pagine pubbliche: l'URL viene firmato dal server solo se l'evento
// che usa la locandina è pubblicato.
export function useLocandinaPubblica(path: string | null | undefined) {
  const firma = useServerFn(firmaLocandinaPubblica);
  return useQuery({
    queryKey: ["locandina-pubblica", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: () => firma({ data: { path } }),
  });
}
