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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      client_meta: {
        Row: {
          allergies: string | null
          created_at: string | null
          custom_notes: string | null
          email: string | null
          favorite_wine: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          custom_notes?: string | null
          email?: string | null
          favorite_wine?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          custom_notes?: string | null
          email?: string | null
          favorite_wine?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content: string
          created_at: string | null
          id: string
          resolved: boolean | null
          role: string
          type: string
          user_email: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          resolved?: boolean | null
          role: string
          type: string
          user_email?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          resolved?: boolean | null
          role?: string
          type?: string
          user_email?: string | null
        }
        Relationships: []
      }
      reservation_status_logs: {
        Row: {
          changed_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["reservation_status"]
          old_status: Database["public"]["Enums"]["reservation_status"] | null
          reservation_id: string
        }
        Insert: {
          changed_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["reservation_status"]
          old_status?: Database["public"]["Enums"]["reservation_status"] | null
          reservation_id: string
        }
        Update: {
          changed_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["reservation_status"]
          old_status?: Database["public"]["Enums"]["reservation_status"] | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_status_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          assigned_tables: string | null
          booking_number: string
          cancellation_reason: string | null
          created_at: string | null
          date: string
          email: string | null
          guests: number
          has_pet: boolean | null
          id: string
          is_walk_in: boolean | null
          language: string | null
          name: string
          notes: string | null
          phone: string
          preference:
            | Database["public"]["Enums"]["reservation_preference"]
            | null
          seated_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          table_number: number | null
          time: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_tables?: string | null
          booking_number: string
          cancellation_reason?: string | null
          created_at?: string | null
          date: string
          email?: string | null
          guests: number
          has_pet?: boolean | null
          id?: string
          is_walk_in?: boolean | null
          language?: string | null
          name: string
          notes?: string | null
          phone: string
          preference?:
            | Database["public"]["Enums"]["reservation_preference"]
            | null
          seated_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          table_number?: number | null
          time: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_tables?: string | null
          booking_number?: string
          cancellation_reason?: string | null
          created_at?: string | null
          date?: string
          email?: string | null
          guests?: number
          has_pet?: boolean | null
          id?: string
          is_walk_in?: boolean | null
          language?: string | null
          name?: string
          notes?: string | null
          phone?: string
          preference?:
            | Database["public"]["Enums"]["reservation_preference"]
            | null
          seated_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          table_number?: number | null
          time?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      shift_notes: {
        Row: {
          content: string
          created_at: string | null
          date: string
        }
        Insert: {
          content: string
          created_at?: string | null
          date: string
        }
        Update: {
          content?: string
          created_at?: string | null
          date?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          password_hash: string | null
          pin: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          password_hash?: string | null
          pin?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          password_hash?: string | null
          pin?: string | null
          role?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          area: string
          capacity: number
          id: string
          table_number: number
          zone_type: Database["public"]["Enums"]["zone_type"]
        }
        Insert: {
          area: string
          capacity: number
          id?: string
          table_number: number
          zone_type: Database["public"]["Enums"]["zone_type"]
        }
        Update: {
          area?: string
          capacity?: number
          id?: string
          table_number?: number
          zone_type?: Database["public"]["Enums"]["zone_type"]
        }
        Relationships: []
      }
    }
    Views: {
      staff_public: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_staff_public_safe: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          role: string
        }[]
      }
      invite_staff_custom: {
        Args: {
          p_display_name: string
          p_email: string
          p_password: string
          p_role: string
        }
        Returns: Json
      }
      is_owner: { Args: never; Returns: boolean }
      is_requesting_staff_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      login_staff: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      update_staff_password: {
        Args: { p_new_password: string; p_staff_id: string }
        Returns: Json
      }
      update_staff_pin_custom: {
        Args: { p_pin: string; p_staff_id: string }
        Returns: Json
      }
      verify_staff_pin: {
        Args: { p_pin: string; p_staff_id: string }
        Returns: boolean
      }
      verify_staff_pin_custom: {
        Args: { p_pin: string; p_staff_id: string }
        Returns: Json
      }
    }
    Enums: {
      reservation_preference:
        | "Indiferente"
        | "Interior"
        | "Terraza exterior"
        | "Mesas altas"
      reservation_status:
        | "pending"
        | "confirmed"
        | "seated"
        | "completed"
        | "cancelled"
        | "no-show"
        | "waiting"
      zone_type: "interior" | "exterior" | "mesas_altas"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      reservation_preference: [
        "Indiferente",
        "Interior",
        "Terraza exterior",
        "Mesas altas",
      ],
      reservation_status: [
        "pending",
        "confirmed",
        "seated",
        "completed",
        "cancelled",
        "no-show",
        "waiting",
      ],
      zone_type: ["interior", "exterior", "mesas_altas"],
    },
  },
} as const
