export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          lead_id: string | null
          location: string | null
          notes: string | null
          start_time: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          start_time?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          start_time?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_participants: {
        Row: {
          activity_id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          user_id?: string
        }
        Update: {
          activity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          changed_at: string | null
          changed_by: string | null
          entity_id: string
          id: number
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action?: string | null
          changed_at?: string | null
          changed_by?: string | null
          entity_id: string
          id?: number
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string | null
          changed_at?: string | null
          changed_by?: string | null
          entity_id?: string
          id?: number
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          owner: string | null
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  vera: {
    Tables: {
      applications: {
        Row: {
          id: number
          created_at: string
          provider_id: number | null
          npi_number: string | null
          medicare_id: number | null
          medicaid_id: number | null
          ecfmg: Json | null
          license_number: string | null
          dea_number: string | null
          work_history: Json | null
          hospital_privileges_id: number | null
          malpractice_insurance: Json | null
          attestation_id: number | null
          previous_approval_date: string | null
          status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          provider_id?: number | null
          npi_number?: string | null
          medicare_id?: number | null
          medicaid_id?: number | null
          ecfmg?: Json | null
          license_number?: string | null
          dea_number?: string | null
          work_history?: Json | null
          hospital_privileges_id?: number | null
          malpractice_insurance?: Json | null
          attestation_id?: number | null
          previous_approval_date?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          provider_id?: number | null
          npi_number?: string | null
          medicare_id?: number | null
          medicaid_id?: number | null
          ecfmg?: Json | null
          license_number?: string | null
          dea_number?: string | null
          work_history?: Json | null
          hospital_privileges_id?: number | null
          malpractice_insurance?: Json | null
          attestation_id?: number | null
          previous_approval_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      practitioners: {
        Row: {
          id: number
          first_name: string | null
          last_name: string | null
          middle_name: string | null
          suffix: string | null
          education: Json | null
          other_names: string | null
          home_address: Json | null
          mailing_address: Json | null
          ssn: string | null
          demographics: Json | null
          languages: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          first_name?: string | null
          last_name?: string | null
          middle_name?: string | null
          suffix?: string | null
          education?: Json | null
          other_names?: string | null
          home_address?: Json | null
          mailing_address?: Json | null
          ssn?: string | null
          demographics?: Json | null
          languages?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          first_name?: string | null
          last_name?: string | null
          middle_name?: string | null
          suffix?: string | null
          education?: Json | null
          other_names?: string | null
          home_address?: Json | null
          mailing_address?: Json | null
          ssn?: string | null
          demographics?: Json | null
          languages?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      application_details: {
        Row: {
          id: number
          created_at: string
          provider_id: number | null
          npi_number: string | null
          medicare_id: number | null
          medicaid_id: number | null
          ecfmg: Json | null
          license_number: string | null
          dea_number: string | null
          work_history: Json | null
          hospital_privileges_id: number | null
          malpractice_insurance: Json | null
          attestation_id: number | null
          previous_approval_date: string | null
          status: string | null
          practitioner_first_name: string | null
          practitioner_last_name: string | null
          practitioner_middle_name: string | null
          practitioner_suffix: string | null
          practitioner_education: Json | null
          practitioner_other_names: string | null
          practitioner_home_address: Json | null
          practitioner_mailing_address: Json | null
          practitioner_ssn: string | null
          practitioner_demographics: Json | null
          practitioner_languages: Json | null
          full_name: string | null
          verification_status: string
          primary_address: Json | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
