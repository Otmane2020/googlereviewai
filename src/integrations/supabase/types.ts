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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aeo_questions: {
        Row: {
          answer: string
          business_id: string | null
          category: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          keywords: string[] | null
          priority: number | null
          question: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          answer: string
          business_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          answer?: string
          business_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aeo_questions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aeo_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          auto_publish_to_google: boolean | null
          auto_reply_delay: number | null
          auto_sync_reviews: boolean | null
          created_at: string | null
          custom_template: string | null
          enabled: boolean | null
          id: string
          include_signature: boolean | null
          minimum_rating: number | null
          only_positive_reviews: boolean | null
          response_length: string | null
          signature: string | null
          sync_interval_minutes: number | null
          tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_publish_to_google?: boolean | null
          auto_reply_delay?: number | null
          auto_sync_reviews?: boolean | null
          created_at?: string | null
          custom_template?: string | null
          enabled?: boolean | null
          id?: string
          include_signature?: boolean | null
          minimum_rating?: number | null
          only_positive_reviews?: boolean | null
          response_length?: string | null
          signature?: string | null
          sync_interval_minutes?: number | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_publish_to_google?: boolean | null
          auto_reply_delay?: number | null
          auto_sync_reviews?: boolean | null
          created_at?: string | null
          custom_template?: string | null
          enabled?: boolean | null
          id?: string
          include_signature?: boolean | null
          minimum_rating?: number | null
          only_positive_reviews?: boolean | null
          response_length?: string | null
          signature?: string | null
          sync_interval_minutes?: number | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          auto_keywords: string[] | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          google_place_id: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          rating: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          auto_keywords?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          auto_keywords?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits_history: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          business_id: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          priority: number | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          priority?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          priority?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keywords_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keywords_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          review_id: number | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          review_id?: number | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          review_id?: number | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle: string | null
          created_at: string | null
          credits: number
          current_period_end: string | null
          current_period_start: string | null
          current_streak: number | null
          email: string
          full_name: string | null
          google_access_token: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          level: number | null
          max_businesses: number
          onboarding_completed: boolean | null
          plan_id: string | null
          plan_name: string | null
          subscription_status: string | null
          total_points: number | null
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle?: string | null
          created_at?: string | null
          credits?: number
          current_period_end?: string | null
          current_period_start?: string | null
          current_streak?: number | null
          email: string
          full_name?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id: string
          level?: number | null
          max_businesses?: number
          onboarding_completed?: boolean | null
          plan_id?: string | null
          plan_name?: string | null
          subscription_status?: string | null
          total_points?: number | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle?: string | null
          created_at?: string | null
          credits?: number
          current_period_end?: string | null
          current_period_start?: string | null
          current_streak?: number | null
          email?: string
          full_name?: string | null
          google_access_token?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          level?: number | null
          max_businesses?: number
          onboarding_completed?: boolean | null
          plan_id?: string | null
          plan_name?: string | null
          subscription_status?: string | null
          total_points?: number | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          ai_response: string | null
          author: string
          comment: string | null
          created_at: string | null
          google_reply_id: string | null
          id: number
          location_id: string
          published_at: string | null
          published_to_google: boolean | null
          rating: number
          replied: boolean | null
          review_date: string
          review_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          author: string
          comment?: string | null
          created_at?: string | null
          google_reply_id?: string | null
          id?: number
          location_id: string
          published_at?: string | null
          published_to_google?: boolean | null
          rating: number
          replied?: boolean | null
          review_date: string
          review_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          author?: string
          comment?: string | null
          created_at?: string | null
          google_reply_id?: string | null
          id?: number
          location_id?: string
          published_at?: string | null
          published_to_google?: boolean | null
          rating?: number
          replied?: boolean | null
          review_date?: string
          review_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_content: {
        Row: {
          answer: string | null
          business_id: string
          content: string | null
          content_type: string
          created_at: string
          error_message: string | null
          google_post_id: string | null
          id: string
          keyword_used: string | null
          published_at: string | null
          question: string | null
          scheduled_date: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          business_id: string
          content?: string | null
          content_type: string
          created_at?: string
          error_message?: string | null
          google_post_id?: string | null
          id?: string
          keyword_used?: string | null
          published_at?: string | null
          question?: string | null
          scheduled_date: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          business_id?: string
          content?: string | null
          content_type?: string
          created_at?: string
          error_message?: string | null
          google_post_id?: string | null
          id?: string
          keyword_used?: string | null
          published_at?: string | null
          question?: string | null
          scheduled_date?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_content_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_articles: {
        Row: {
          business_id: string | null
          content: string
          created_at: string
          id: string
          keywords: string[] | null
          location: string | null
          meta_description: string | null
          published_at: string | null
          slug: string
          source_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          business_id?: string | null
          content: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          location?: string | null
          meta_description?: string | null
          published_at?: string | null
          slug: string
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          location?: string | null
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_articles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          module: string
          price_monthly: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          module: string
          price_monthly: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          module?: string
          price_monthly?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
