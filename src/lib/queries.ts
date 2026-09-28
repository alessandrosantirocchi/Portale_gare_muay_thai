import { supabase } from "@/integrations/supabase/client";

export type Evento = {
  id: string;
  nome: string;
  disciplina: string;
  tipo: string;
  data_evento: string;
  luogo: string;
  sede: string | null;
  regione: string | null;
  fine_iscrizioni: string;
  descrizione: string | null;
  stato: string;
  orario: string | null;
  programma: string | null;
  locandina_path: string | null;
  locandina_pubblicata: boolean;
  organizzatore: string | null;
  apertura_iscrizioni: string | null;
  discipline_ammesse: string[] | null;
  formati_incontro: Record<string, string[]> | null;
  serie_ammesse: string[] | null;
  categorie_ammesse: string[] | null;
  limite_partecipanti: number | null;
  blocca_certificato_scaduto: boolean | null;
  originale_richiesto: boolean | null;
};

export type Atleta = {
  id: string;
  societa_id: string | null;
  nome_societa: string;
  nome: string;
  cognome: string;
  data_nascita: string | null;
  sesso: string;
  peso_kg: number | null;
  disciplina: string;
  punti: number;
  vittorie: number;
  sconfitte: number;
  pareggi: number;
  coach: string | null;
  serie: string | null;
  categoria: string | null;
  totale_match: number | null;
  certificato_scadenza: string | null;
};

export async function fetchEventi() {
  const { data, error } = await supabase
    .from("eventi")
    .select("*")
    .order("data_evento", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Evento[];
}

export async function fetchEvento(id: string) {
  const { data, error } = await supabase
    .from("eventi")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Evento | null;
}

export async function fetchAtleti() {
  const { data, error } = await supabase
    .from("classifica_pubblica")
    .select("*")
    .order("punti", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Atleta[];
}

export async function fetchConteggiIscritti() {
  const { data, error } = await supabase.from("iscrizioni_pubbliche").select("evento_id");
  if (error) throw error;
  const mappa: Record<string, number> = {};
  for (const riga of data ?? []) {
    if (!riga.evento_id) continue;
    mappa[riga.evento_id] = (mappa[riga.evento_id] ?? 0) + 1;
  }
  return mappa;
}

export async function fetchIscrittiEvento(eventoId: string) {
  const { data, error } = await supabase
    .from("iscrizioni_pubbliche")
    .select("id, evento_id, atleta_id, stato, nome, cognome, nome_societa, peso_kg, categoria, disciplina, created_at")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTitoli() {
  const { data, error } = await supabase
    .from("titoli")
    .select("*")
    .eq("pubblicato", true)
    .order("data_incontro", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNews() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("data_pubblicazione", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDocumenti() {
  const { data, error } = await supabase
    .from("documenti")
    .select("*")
    .eq("pubblicato", true)
    .order("categoria", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
