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
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_issue_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_for_fix: boolean
          area: string | null
          attachments: Json
          created_at: string
          description: string
          id: string
          reporter_email: string | null
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_for_fix?: boolean
          area?: string | null
          attachments?: Json
          created_at?: string
          description: string
          id?: string
          reporter_email?: string | null
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_for_fix?: boolean
          area?: string | null
          attachments?: Json
          created_at?: string
          description?: string
          id?: string
          reporter_email?: string | null
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audio_acks: {
        Row: {
          created_at: string
          declaration: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          declaration: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          declaration?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          client_message_id: string | null
          content: string
          created_at: string
          id: string
          parts: Json
          role: string
          user_id: string
        }
        Insert: {
          client_message_id?: string | null
          content?: string
          created_at?: string
          id?: string
          parts?: Json
          role: string
          user_id: string
        }
        Update: {
          client_message_id?: string | null
          content?: string
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          criado_em: string
          data: string
          foto_url: string | null
          id: string
          missao_chave: string
          user_id: string
          valor: number | null
        }
        Insert: {
          criado_em?: string
          data: string
          foto_url?: string | null
          id?: string
          missao_chave: string
          user_id: string
          valor?: number | null
        }
        Update: {
          criado_em?: string
          data?: string
          foto_url?: string | null
          id?: string
          missao_chave?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      flacidez_denylist: {
        Row: {
          created_at: string
          email: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          reason?: string | null
        }
        Relationships: []
      }
      intake_responses: {
        Row: {
          completado_em: string
          id: string
          respostas: Json
          user_id: string
        }
        Insert: {
          completado_em?: string
          id?: string
          respostas: Json
          user_id: string
        }
        Update: {
          completado_em?: string
          id?: string
          respostas?: Json
          user_id?: string
        }
        Relationships: []
      }
      lesson_comments: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          lesson_id: string
          parent_id: string | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          author_name?: string
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          parent_id?: string | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          parent_id?: string | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
          watched_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
          watched_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
      module_thumbnails: {
        Row: {
          module_id: string
          position_x: number
          position_y: number
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          module_id: string
          position_x?: number
          position_y?: number
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          module_id?: string
          position_x?: number
          position_y?: number
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      points: {
        Row: {
          checkin_id: string | null
          criado_em: string
          id: string
          mes_ciclo: string
          motivo: string
          pontos: number
          user_id: string
        }
        Insert: {
          checkin_id?: string | null
          criado_em?: string
          id?: string
          mes_ciclo: string
          motivo: string
          pontos?: number
          user_id: string
        }
        Update: {
          checkin_id?: string | null
          criado_em?: string
          id?: string
          mes_ciclo?: string
          motivo?: string
          pontos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          bio: string | null
          criado_em: string
          id: string
          nome: string
          primeiro_acesso: boolean
          telefone: string | null
          ultima_compra_em: string | null
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          bio?: string | null
          criado_em?: string
          id: string
          nome?: string
          primeiro_acesso?: boolean
          telefone?: string | null
          ultima_compra_em?: string | null
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          bio?: string | null
          criado_em?: string
          id?: string
          nome?: string
          primeiro_acesso?: boolean
          telefone?: string | null
          ultima_compra_em?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number | null
          created_at: string
          email: string
          id: string
          payment_status: string
          payt_order_id: string
          product_name: string | null
          purchase_date: string | null
          raw_payload: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          email: string
          id?: string
          payment_status: string
          payt_order_id: string
          product_name?: string | null
          purchase_date?: string | null
          raw_payload?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          email?: string
          id?: string
          payment_status?: string
          payt_order_id?: string
          product_name?: string | null
          purchase_date?: string | null
          raw_payload?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          fase_atual: number
          pesos: Json
          preferencias_alimentares: Json
          protocolo_iniciado_em: string | null
          quiz_fase1_completo: boolean
          user_id: string
        }
        Insert: {
          fase_atual?: number
          pesos?: Json
          preferencias_alimentares?: Json
          protocolo_iniciado_em?: string | null
          quiz_fase1_completo?: boolean
          user_id: string
        }
        Update: {
          fase_atual?: number
          pesos?: Json
          preferencias_alimentares?: Json
          protocolo_iniciado_em?: string | null
          quiz_fase1_completo?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event_id: string
          id: string
          payload: Json | null
          processed_at: string | null
          provider: string
          received_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          event_id: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider: string
          received_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          event_id?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      whatsapp_command_log: {
        Row: {
          args: Json | null
          command: string
          created_at: string | null
          error: string | null
          id: string
          name: string | null
          phone: string
          response: string | null
          status: string
        }
        Insert: {
          args?: Json | null
          command: string
          created_at?: string | null
          error?: string | null
          id?: string
          name?: string | null
          phone: string
          response?: string | null
          status?: string
        }
        Update: {
          args?: Json | null
          command?: string
          created_at?: string | null
          error?: string | null
          id?: string
          name?: string | null
          phone?: string
          response?: string | null
          status?: string
        }
        Relationships: []
      }
      whatsapp_command_whitelist: {
        Row: {
          created_at: string | null
          id: string
          is_admin: boolean | null
          name: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          name?: string | null
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      find_user_id_by_email: { Args: { _email: string }; Returns: string }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      wa_active_customers: {
        Args: never
        Returns: {
          email: string
          last_purchase: string
          nome: string
          telefone: string
          user_id: string
        }[]
      }
      wa_buyers_period: {
        Args: { _from: string; _to: string; _total_lessons: number }
        Returns: {
          aulas: number
          email: string
          last_purchase: string
          nome: string
          pct: number
          telefone: string
        }[]
      }
      wa_low_engagement: {
        Args: { _max_pct: number; _total_lessons: number }
        Returns: {
          aulas: number
          email: string
          last_purchase: string
          nome: string
          pct: number
          telefone: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
