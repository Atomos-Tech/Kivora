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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_id: string
          id: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_id: string
          id?: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string
          id?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_items: {
        Row: {
          created_at: string
          day_date: string | null
          end_time: string | null
          event_id: string
          id: string
          location: string | null
          notes: string | null
          person: string | null
          position: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_date?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          location?: string | null
          notes?: string | null
          person?: string | null
          position?: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_date?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          person?: string | null
          position?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_plans: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          model: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          model?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          category: string
          created_at: string
          description: string
          event_id: string
          id: string
          notes: string | null
          planned_amount: number
          quoted_amount: number | null
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          actual_amount?: number | null
          category?: string
          created_at?: string
          description: string
          event_id: string
          id?: string
          notes?: string | null
          planned_amount?: number
          quoted_amount?: number | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          actual_amount?: number | null
          category?: string
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          notes?: string | null
          planned_amount?: number
          quoted_amount?: number | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      event_members: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invited_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invited_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invited_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          accessibility_notes: string | null
          capacity: number | null
          created_at: string
          cultural_notes: string | null
          currency: string
          description: string | null
          end_date: string | null
          end_time: string | null
          entertainment: string | null
          event_type: string
          food_preferences: string | null
          formality: string | null
          guest_estimate: number | null
          id: string
          location_mode: string
          name: string
          owner_id: string
          palette: string | null
          priorities: string | null
          start_date: string
          start_time: string | null
          status: string
          sustainability_notes: string | null
          theme: string | null
          timezone: string
          total_budget: number
          updated_at: string
          venue: string | null
          volunteer_target: number | null
        }
        Insert: {
          accessibility_notes?: string | null
          capacity?: number | null
          created_at?: string
          cultural_notes?: string | null
          currency?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          entertainment?: string | null
          event_type?: string
          food_preferences?: string | null
          formality?: string | null
          guest_estimate?: number | null
          id?: string
          location_mode?: string
          name: string
          owner_id: string
          palette?: string | null
          priorities?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          sustainability_notes?: string | null
          theme?: string | null
          timezone?: string
          total_budget?: number
          updated_at?: string
          venue?: string | null
          volunteer_target?: number | null
        }
        Update: {
          accessibility_notes?: string | null
          capacity?: number | null
          created_at?: string
          cultural_notes?: string | null
          currency?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          entertainment?: string | null
          event_type?: string
          food_preferences?: string | null
          formality?: string | null
          guest_estimate?: number | null
          id?: string
          location_mode?: string
          name?: string
          owner_id?: string
          palette?: string | null
          priorities?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          sustainability_notes?: string | null
          theme?: string | null
          timezone?: string
          total_budget?: number
          updated_at?: string
          venue?: string | null
          volunteer_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          accessibility_notes: string | null
          created_at: string
          dietary_notes: string | null
          email: string | null
          event_id: string
          group_name: string | null
          id: string
          invitation_status: string
          name: string
          phone: string | null
          plus_one: boolean
          rsvp_at: string | null
          rsvp_notes: string | null
          rsvp_status: string
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          created_at?: string
          dietary_notes?: string | null
          email?: string | null
          event_id: string
          group_name?: string | null
          id?: string
          invitation_status?: string
          name: string
          phone?: string | null
          plus_one?: boolean
          rsvp_at?: string | null
          rsvp_notes?: string | null
          rsvp_status?: string
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          created_at?: string
          dietary_notes?: string | null
          email?: string | null
          event_id?: string
          group_name?: string | null
          id?: string
          invitation_status?: string
          name?: string
          phone?: string | null
          plus_one?: boolean
          rsvp_at?: string | null
          rsvp_notes?: string | null
          rsvp_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_items: {
        Row: {
          category: string
          created_at: string
          event_id: string | null
          id: string
          image_url: string | null
          notes: string | null
          source_link: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          source_link?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          source_link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          guest_id: string | null
          id: string
          kind: string
          last_used_at: string | null
          revoked: boolean
          role: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          guest_id?: string | null
          id?: string
          kind?: string
          last_used_at?: string | null
          revoked?: boolean
          role?: string | null
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          guest_id?: string | null
          id?: string
          kind?: string
          last_used_at?: string | null
          revoked?: boolean
          role?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_tokens_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          event_id: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          display_name: string | null
          id: string
          onboarded: boolean
          preferences: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id: string
          onboarded?: boolean
          preferences?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_member_id: string | null
          budget_item_id: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          event_id: string
          id: string
          priority: string
          source: string
          status: string
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          assignee_member_id?: string | null
          budget_item_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          event_id: string
          id?: string
          priority?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          assignee_member_id?: string | null
          budget_item_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          event_id?: string
          id?: string
          priority?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_member_id_fkey"
            columns: ["assignee_member_id"]
            isOneToOne: false
            referencedRelation: "event_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          event_id: string
          follow_up_date: string | null
          id: string
          name: string
          notes: string | null
          quote_amount: number | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          event_id: string
          follow_up_date?: string | null
          id?: string
          name: string
          notes?: string | null
          quote_amount?: number | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string
          follow_up_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          quote_amount?: number | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_collaborator_invite: { Args: { p_token: string }; Returns: Json }
      get_rsvp_context: { Args: { p_token: string }; Returns: Json }
      kivora_can_edit: { Args: { _event_id: string }; Returns: boolean }
      kivora_event_role: { Args: { _event_id: string }; Returns: string }
      submit_rsvp: {
        Args: {
          p_notes?: string
          p_plus_one?: boolean
          p_status: string
          p_token: string
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
    Enums: {},
  },
} as const
