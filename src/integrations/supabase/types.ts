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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      pdfs: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_size: string | null
          file_url: string
          id: string
          title: string
          updated_at: string
          uploaded_by: string | null
          uploader_name: string
          [key: string]: unknown
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_size?: string | null
          file_url: string
          id?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          uploader_name?: string
          [key: string]: unknown
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_size?: string | null
          file_url?: string
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          uploader_name?: string
          [key: string]: unknown
        }
        Relationships: []
      }
      drive_courses: {
        Row: {
          id: string
          title: string
          description: string | null
          drive_id: string
          drive_url: string
          thumbnail_url: string | null
          department_id: string | null
          department: string | null
          branch_id: string | null
          branch: string | null
          academic_year_id: string | null
          academic_year: string | null
          year_of_study: string | null
          semester: string | null
          section_id: string | null
          section: string | null
          subject_id: string | null
          subject_name: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
          [key: string]: unknown
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          drive_id: string
          drive_url: string
          thumbnail_url?: string | null
          department_id?: string | null
          department?: string | null
          branch_id?: string | null
          branch?: string | null
          academic_year_id?: string | null
          academic_year?: string | null
          year_of_study?: string | null
          semester?: string | null
          section_id?: string | null
          section?: string | null
          subject_id?: string | null
          subject_name?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          [key: string]: unknown
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          drive_id?: string
          drive_url?: string
          thumbnail_url?: string | null
          department_id?: string | null
          department?: string | null
          branch_id?: string | null
          branch?: string | null
          academic_year_id?: string | null
          academic_year?: string | null
          year_of_study?: string | null
          semester?: string | null
          section_id?: string | null
          section?: string | null
          subject_id?: string | null
          subject_name?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          [key: string]: unknown
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          full_name: string
          id: string
          roll_number: string
          updated_at: string
          user_id: string
          email?: string | null
          branch?: string | null
          academic_year?: string | null
          year_of_study?: string | null
          section?: string | null
          semester?: string | null
          class_group?: string | null
          role?: Database["public"]["Enums"]["app_role"] | string | null
          department_id?: string | null
          branch_id?: string | null
          class_id?: string | null
          section_id?: string | null
          academic_year_id?: string | null
          joining_year?: number | null
          college_code?: string | null
          branch_code?: string | null
          numeric_roll?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          status?: string | null
          [key: string]: unknown
        }
        Insert: {
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          roll_number?: string
          updated_at?: string
          user_id: string
          email?: string | null
          branch?: string | null
          academic_year?: string | null
          year_of_study?: string | null
          section?: string | null
          semester?: string | null
          class_group?: string | null
          role?: Database["public"]["Enums"]["app_role"] | string | null
          department_id?: string | null
          branch_id?: string | null
          class_id?: string | null
          section_id?: string | null
          academic_year_id?: string | null
          joining_year?: number | null
          college_code?: string | null
          branch_code?: string | null
          numeric_roll?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          status?: string | null
          [key: string]: unknown
        }
        Update: {
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          roll_number?: string
          updated_at?: string
          user_id?: string
          email?: string | null
          branch?: string | null
          academic_year?: string | null
          year_of_study?: string | null
          section?: string | null
          semester?: string | null
          class_group?: string | null
          role?: Database["public"]["Enums"]["app_role"] | string | null
          department_id?: string | null
          branch_id?: string | null
          class_id?: string | null
          section_id?: string | null
          academic_year_id?: string | null
          joining_year?: number | null
          college_code?: string | null
          branch_code?: string | null
          numeric_roll?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          status?: string | null
          [key: string]: unknown
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          report_type: string
          reporter_email: string
          reporter_name: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
          [key: string]: unknown
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          report_type: string
          reporter_email: string
          reporter_name: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
          [key: string]: unknown
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          report_type?: string
          reporter_email?: string
          reporter_name?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
          [key: string]: unknown
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"] | string
          user_id: string
          [key: string]: unknown
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | string
          user_id: string
          [key: string]: unknown
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | string
          user_id?: string
          [key: string]: unknown
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
