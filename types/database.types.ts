export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      campaign_characters: {
        Row: {
          campaign_id: string
          character_id: string
          id: string
          linked_at: string
          linked_by: string
          unlinked_at: string | null
        }
        Insert: {
          campaign_id: string
          character_id: string
          id?: string
          linked_at?: string
          linked_by: string
          unlinked_at?: string | null
        }
        Update: {
          campaign_id?: string
          character_id?: string
          id?: string
          linked_at?: string
          linked_by?: string
          unlinked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_characters_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          campaign_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          campaign_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          campaign_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_invitations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          game_master_id: string
          game_system: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_master_id: string
          game_system: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game_master_id?: string
          game_system?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          created_at: string
          description: string | null
          game_system: string
          id: string
          name: string
          owner_id: string
          portrait_url: string | null
          sheet_data: Json
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_system: string
          id?: string
          name: string
          owner_id: string
          portrait_url?: string | null
          sheet_data?: Json
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game_system?: string
          id?: string
          name?: string
          owner_id?: string
          portrait_url?: string | null
          sheet_data?: Json
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      custom_dice_presets: {
        Row: {
          coin_quantity: number
          created_at: string
          d10_quantity: number
          d100_quantity: number
          d12_quantity: number
          d20_quantity: number
          d4_quantity: number
          d6_quantity: number
          d8_quantity: number
          id: string
          name: string
          owner_id: string
          slot: number
          updated_at: string
        }
        Insert: {
          coin_quantity?: number
          created_at?: string
          d10_quantity?: number
          d100_quantity?: number
          d12_quantity?: number
          d20_quantity?: number
          d4_quantity?: number
          d6_quantity?: number
          d8_quantity?: number
          id?: string
          name: string
          owner_id: string
          slot: number
          updated_at?: string
        }
        Update: {
          coin_quantity?: number
          created_at?: string
          d10_quantity?: number
          d100_quantity?: number
          d12_quantity?: number
          d20_quantity?: number
          d4_quantity?: number
          d6_quantity?: number
          d8_quantity?: number
          id?: string
          name?: string
          owner_id?: string
          slot?: number
          updated_at?: string
        }
        Relationships: []
      }
      personal_roll_history: {
        Row: {
          client_roll_id: string
          created_at: string
          id: string
          owner_id: string
          request_data: Json
          result_data: Json
          roller_kind: string
          schema_version: number
          sequence_number: number
        }
        Insert: {
          client_roll_id: string
          created_at?: string
          id?: string
          owner_id: string
          request_data: Json
          result_data: Json
          roller_kind: string
          schema_version: number
          sequence_number?: never
        }
        Update: {
          client_roll_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          request_data?: Json
          result_data?: Json
          roller_kind?: string
          schema_version?: number
          sequence_number?: never
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_campaign_invitation: {
        Args: { raw_token: string }
        Returns: string
      }
      clear_personal_roll_history: { Args: never; Returns: number }
      create_campaign_invitation: {
        Args: { target_campaign_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          token: string
        }[]
      }
      create_custom_dice_preset: {
        Args: {
          p_coin_quantity: number
          p_d10_quantity: number
          p_d100_quantity: number
          p_d12_quantity: number
          p_d20_quantity: number
          p_d4_quantity: number
          p_d6_quantity: number
          p_d8_quantity: number
          p_name: string
        }
        Returns: {
          coin_quantity: number
          created_at: string
          d10_quantity: number
          d100_quantity: number
          d12_quantity: number
          d20_quantity: number
          d4_quantity: number
          d6_quantity: number
          d8_quantity: number
          id: string
          name: string
          owner_id: string
          slot: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "custom_dice_presets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_can_access_campaign: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      current_user_can_view_campaign_character: {
        Args: { target_character_id: string }
        Returns: boolean
      }
      current_user_can_view_campaign_portrait: {
        Args: { object_name: string }
        Returns: boolean
      }
      current_user_is_campaign_game_master: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      current_user_is_campaign_player: {
        Args: { target_campaign_id: string }
        Returns: boolean
      }
      delete_custom_dice_preset: {
        Args: { p_preset_id: string }
        Returns: boolean
      }
      delete_personal_roll: { Args: { p_roll_id: string }; Returns: boolean }
      record_personal_roll: {
        Args: {
          p_client_roll_id: string
          p_request_data: Json
          p_result_data: Json
          p_roller_kind: string
          p_schema_version: number
        }
        Returns: {
          client_roll_id: string
          created_at: string
          id: string
          owner_id: string
          request_data: Json
          result_data: Json
          roller_kind: string
          schema_version: number
          sequence_number: number
        }
        SetofOptions: {
          from: "*"
          to: "personal_roll_history"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_campaign_invitation: {
        Args: { target_invitation_id: string }
        Returns: undefined
      }
      update_custom_dice_preset: {
        Args: {
          p_coin_quantity: number
          p_d10_quantity: number
          p_d100_quantity: number
          p_d12_quantity: number
          p_d20_quantity: number
          p_d4_quantity: number
          p_d6_quantity: number
          p_d8_quantity: number
          p_name: string
          p_preset_id: string
        }
        Returns: {
          coin_quantity: number
          created_at: string
          d10_quantity: number
          d100_quantity: number
          d12_quantity: number
          d20_quantity: number
          d4_quantity: number
          d6_quantity: number
          d8_quantity: number
          id: string
          name: string
          owner_id: string
          slot: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "custom_dice_presets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
