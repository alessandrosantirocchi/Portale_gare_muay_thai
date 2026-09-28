export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atleti: {
        Row: {
          categoria: string | null
          certificato_disciplina: string | null
          certificato_path: string | null
          certificato_rilascio: string | null
          certificato_scadenza: string | null
          certificato_tipo: string | null
          coach: string | null
          cognome: string
          created_at: string
          data_nascita: string | null
          disciplina: string
          id: string
          nome: string
          nome_societa: string
          pareggi: number
          peso_kg: number | null
          punti: number
          sconfitte: number
          serie: string | null
          sesso: string
          societa_id: string | null
          totale_match: number | null
          vittorie: number
        }
        Insert: {
          categoria?: string | null
          certificato_disciplina?: string | null
          certificato_path?: string | null
          certificato_rilascio?: string | null
          certificato_scadenza?: string | null
          certificato_tipo?: string | null
          coach?: string | null
          cognome: string
          created_at?: string
          data_nascita?: string | null
          disciplina?: string
          id?: string
          nome: string
          nome_societa?: string
          pareggi?: number
          peso_kg?: number | null
          punti?: number
          sconfitte?: number
          serie?: string | null
          sesso?: string
          societa_id?: string | null
          totale_match?: number | null
          vittorie?: number
        }
        Update: {
          categoria?: string | null
          certificato_disciplina?: string | null
          certificato_path?: string | null
          certificato_rilascio?: string | null
          certificato_scadenza?: string | null
          certificato_tipo?: string | null
          coach?: string | null
          cognome?: string
          created_at?: string
          data_nascita?: string | null
          disciplina?: string
          id?: string
          nome?: string
          nome_societa?: string
          pareggi?: number
          peso_kg?: number | null
          punti?: number
          sconfitte?: number
          serie?: string | null
          sesso?: string
          societa_id?: string | null
          totale_match?: number | null
          vittorie?: number
        }
        Relationships: [
          {
            foreignKeyName: "atleti_societa_id_fkey"
            columns: ["societa_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documenti: {
        Row: {
          categoria: string
          created_at: string
          descrizione: string | null
          id: string
          titolo: string
          url: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          descrizione?: string | null
          id?: string
          titolo: string
          url?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descrizione?: string | null
          id?: string
          titolo?: string
          url?: string | null
        }
        Relationships: []
      }
      eventi: {
        Row: {
          apertura_iscrizioni: string | null
          blocca_certificato_scaduto: boolean | null
          categorie_ammesse: string[] | null
          created_at: string
          data_evento: string
          descrizione: string | null
          disciplina: string
          discipline_ammesse: string[] | null
          fine_iscrizioni: string
          formati_incontro: Json
          id: string
          limite_partecipanti: number | null
          locandina_path: string | null
          luogo: string
          nome: string
          orario: string | null
          organizzatore: string | null
          originale_richiesto: boolean | null
          programma: string | null
          regione: string | null
          sede: string | null
          serie_ammesse: string[] | null
          stato: string
          tipo: string
        }
        Insert: {
          apertura_iscrizioni?: string | null
          blocca_certificato_scaduto?: boolean | null
          categorie_ammesse?: string[] | null
          created_at?: string
          data_evento: string
          descrizione?: string | null
          disciplina?: string
          discipline_ammesse?: string[] | null
          fine_iscrizioni: string
          formati_incontro?: Json
          id?: string
          limite_partecipanti?: number | null
          locandina_path?: string | null
          luogo: string
          nome: string
          orario?: string | null
          organizzatore?: string | null
          originale_richiesto?: boolean | null
          programma?: string | null
          regione?: string | null
          sede?: string | null
          serie_ammesse?: string[] | null
          stato?: string
          tipo?: string
        }
        Update: {
          apertura_iscrizioni?: string | null
          blocca_certificato_scaduto?: boolean | null
          categorie_ammesse?: string[] | null
          created_at?: string
          data_evento?: string
          descrizione?: string | null
          disciplina?: string
          discipline_ammesse?: string[] | null
          fine_iscrizioni?: string
          formati_incontro?: Json
          id?: string
          limite_partecipanti?: number | null
          locandina_path?: string | null
          luogo?: string
          nome?: string
          orario?: string | null
          organizzatore?: string | null
          originale_richiesto?: boolean | null
          programma?: string | null
          regione?: string | null
          sede?: string | null
          serie_ammesse?: string[] | null
          stato?: string
          tipo?: string
        }
        Relationships: []
      }
      iscrizioni: {
        Row: {
          atleta_id: string
          categoria_peso: string | null
          created_at: string
          disciplina: string | null
          evento_id: string
          id: string
          note: string | null
          senior_17: boolean | null
          snapshot_categoria: string | null
          snapshot_coach: string | null
          snapshot_cognome: string | null
          snapshot_data_nascita: string | null
          snapshot_nome: string | null
          snapshot_peso_kg: number | null
          snapshot_serie: string | null
          snapshot_sesso: string | null
          snapshot_team: string | null
          snapshot_totale_match: number | null
          societa_id: string
          stato: string
        }
        Insert: {
          atleta_id: string
          categoria_peso?: string | null
          created_at?: string
          disciplina?: string | null
          evento_id: string
          id?: string
          note?: string | null
          senior_17?: boolean | null
          snapshot_categoria?: string | null
          snapshot_coach?: string | null
          snapshot_cognome?: string | null
          snapshot_data_nascita?: string | null
          snapshot_nome?: string | null
          snapshot_peso_kg?: number | null
          snapshot_serie?: string | null
          snapshot_sesso?: string | null
          snapshot_team?: string | null
          snapshot_totale_match?: number | null
          societa_id: string
          stato?: string
        }
        Update: {
          atleta_id?: string
          categoria_peso?: string | null
          created_at?: string
          disciplina?: string | null
          evento_id?: string
          id?: string
          note?: string | null
          senior_17?: boolean | null
          snapshot_categoria?: string | null
          snapshot_coach?: string | null
          snapshot_cognome?: string | null
          snapshot_data_nascita?: string | null
          snapshot_nome?: string | null
          snapshot_peso_kg?: number | null
          snapshot_serie?: string | null
          snapshot_sesso?: string | null
          snapshot_team?: string | null
          snapshot_totale_match?: number | null
          societa_id?: string
          stato?: string
        }
        Relationships: [
          {
            foreignKeyName: "iscrizioni_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atleti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizioni_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "classifica_pubblica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizioni_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizioni_societa_id_fkey"
            columns: ["societa_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_cards: {
        Row: {
          blu_id: string
          created_at: string
          evento_id: string
          id: string
          numero: number | null
          pool_id: string | null
          rosso_id: string
          score: number | null
          stato: string
        }
        Insert: {
          blu_id: string
          created_at?: string
          evento_id: string
          id?: string
          numero?: number | null
          pool_id?: string | null
          rosso_id: string
          score?: number | null
          stato?: string
        }
        Update: {
          blu_id?: string
          created_at?: string
          evento_id?: string
          id?: string
          numero?: number | null
          pool_id?: string | null
          rosso_id?: string
          score?: number | null
          stato?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_cards_blu_id_fkey"
            columns: ["blu_id"]
            isOneToOne: false
            referencedRelation: "iscrizioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_cards_blu_id_fkey"
            columns: ["blu_id"]
            isOneToOne: false
            referencedRelation: "iscrizioni_pubbliche"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_cards_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_cards_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_cards_rosso_id_fkey"
            columns: ["rosso_id"]
            isOneToOne: false
            referencedRelation: "iscrizioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_cards_rosso_id_fkey"
            columns: ["rosso_id"]
            isOneToOne: false
            referencedRelation: "iscrizioni_pubbliche"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          contenuto: string
          created_at: string
          data_pubblicazione: string
          id: string
          titolo: string
        }
        Insert: {
          contenuto: string
          created_at?: string
          data_pubblicazione?: string
          id?: string
          titolo: string
        }
        Update: {
          contenuto?: string
          created_at?: string
          data_pubblicazione?: string
          id?: string
          titolo?: string
        }
        Relationships: []
      }
      pools: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          iscrizione_ids: string[]
          numero: number | null
          score: number | null
          stato: string
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          iscrizione_ids?: string[]
          numero?: number | null
          score?: number | null
          stato?: string
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          iscrizione_ids?: string[]
          numero?: number | null
          score?: number | null
          stato?: string
        }
        Relationships: [
          {
            foreignKeyName: "pools_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventi"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          citta: string | null
          codice_affiliazione: string | null
          codice_fiscale: string | null
          codice_societa: string | null
          cognome_coach: string | null
          created_at: string
          email: string | null
          id: string
          nome_coach: string | null
          nome_societa: string
          partita_iva: string | null
          provincia: string | null
          regione: string | null
          telefono: string | null
        }
        Insert: {
          citta?: string | null
          codice_affiliazione?: string | null
          codice_fiscale?: string | null
          codice_societa?: string | null
          cognome_coach?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome_coach?: string | null
          nome_societa?: string
          partita_iva?: string | null
          provincia?: string | null
          regione?: string | null
          telefono?: string | null
        }
        Update: {
          citta?: string | null
          codice_affiliazione?: string | null
          codice_fiscale?: string | null
          codice_societa?: string | null
          cognome_coach?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_coach?: string | null
          nome_societa?: string
          partita_iva?: string | null
          provincia?: string | null
          regione?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      titoli: {
        Row: {
          atleta_a: string
          atleta_b: string
          created_at: string
          data_incontro: string
          esito: string | null
          evento: string | null
          id: string
          luogo: string | null
          titolo: string
        }
        Insert: {
          atleta_a: string
          atleta_b: string
          created_at?: string
          data_incontro: string
          esito?: string | null
          evento?: string | null
          id?: string
          luogo?: string | null
          titolo: string
        }
        Update: {
          atleta_a?: string
          atleta_b?: string
          created_at?: string
          data_incontro?: string
          esito?: string | null
          evento?: string | null
          id?: string
          luogo?: string | null
          titolo?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      classifica_pubblica: {
        Row: {
          cognome: string | null
          disciplina: string | null
          id: string | null
          nome: string | null
          nome_societa: string | null
          pareggi: number | null
          peso_kg: number | null
          punti: number | null
          sconfitte: number | null
          vittorie: number | null
        }
        Insert: {
          cognome?: string | null
          disciplina?: string | null
          id?: string | null
          nome?: string | null
          nome_societa?: string | null
          pareggi?: number | null
          peso_kg?: number | null
          punti?: number | null
          sconfitte?: number | null
          vittorie?: number | null
        }
        Update: {
          cognome?: string | null
          disciplina?: string | null
          id?: string | null
          nome?: string | null
          nome_societa?: string | null
          pareggi?: number | null
          peso_kg?: number | null
          punti?: number | null
          sconfitte?: number | null
          vittorie?: number | null
        }
        Relationships: []
      }
      iscrizioni_pubbliche: {
        Row: {
          atleta_id: string | null
          categoria: string | null
          cognome: string | null
          created_at: string | null
          disciplina: string | null
          evento_id: string | null
          id: string | null
          nome: string | null
          nome_societa: string | null
          peso_kg: number | null
          stato: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iscrizioni_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atleti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizioni_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "classifica_pubblica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizioni_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventi"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "societa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "societa"],
    },
  },
} as const
