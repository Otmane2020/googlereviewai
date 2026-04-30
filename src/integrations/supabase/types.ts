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
      abandoned_carts: {
        Row: {
          billing_cycle: string | null
          cart_items: Json
          converted: boolean | null
          converted_at: string | null
          coupon_code: string | null
          created_at: string
          email: string
          email_1_sent_at: string | null
          email_2_sent_at: string | null
          email_3_sent_at: string | null
          full_name: string | null
          id: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cart_items?: Json
          converted?: boolean | null
          converted_at?: string | null
          coupon_code?: string | null
          created_at?: string
          email: string
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          full_name?: string | null
          id?: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cart_items?: Json
          converted?: boolean | null
          converted_at?: string | null
          coupon_code?: string | null
          created_at?: string
          email?: string
          email_1_sent_at?: string | null
          email_2_sent_at?: string | null
          email_3_sent_at?: string | null
          full_name?: string | null
          id?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          email_notifications: boolean | null
          enabled: boolean | null
          id: string
          include_signature: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          minimum_rating: number | null
          only_positive_reviews: boolean | null
          publication_hour: number | null
          respond_to_edited_reviews: boolean | null
          response_length: string | null
          reviews_synced_count: number | null
          signature: string | null
          sync_interval_minutes: number | null
          timezone: string | null
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
          email_notifications?: boolean | null
          enabled?: boolean | null
          id?: string
          include_signature?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          minimum_rating?: number | null
          only_positive_reviews?: boolean | null
          publication_hour?: number | null
          respond_to_edited_reviews?: boolean | null
          response_length?: string | null
          reviews_synced_count?: number | null
          signature?: string | null
          sync_interval_minutes?: number | null
          timezone?: string | null
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
          email_notifications?: boolean | null
          enabled?: boolean | null
          id?: string
          include_signature?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          minimum_rating?: number | null
          only_positive_reviews?: boolean | null
          publication_hour?: number | null
          respond_to_edited_reviews?: boolean | null
          response_length?: string | null
          reviews_synced_count?: number | null
          signature?: string | null
          sync_interval_minutes?: number | null
          timezone?: string | null
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
          ai_response_model: Json | null
          auto_keywords: string[] | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          gmb_language: string | null
          google_place_id: string | null
          id: string
          is_active: boolean | null
          maps_url: string | null
          name: string
          phone: string | null
          profile_image_url: string | null
          rating: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          website: string | null
          website_content: string | null
        }
        Insert: {
          address?: string | null
          ai_response_model?: Json | null
          auto_keywords?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          gmb_language?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          maps_url?: string | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          website_content?: string | null
        }
        Update: {
          address?: string | null
          ai_response_model?: Json | null
          auto_keywords?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          gmb_language?: string | null
          google_place_id?: string | null
          id?: string
          is_active?: boolean | null
          maps_url?: string | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          website_content?: string | null
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
      gmb_posts: {
        Row: {
          business_id: string
          created_at: string
          cta_type: string | null
          cta_url: string | null
          google_post_id: string | null
          id: string
          media_url: string | null
          posted_at: string | null
          scheduled_for: string | null
          status: string
          summary: string
          synced_at: string | null
          topic_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          cta_type?: string | null
          cta_url?: string | null
          google_post_id?: string | null
          id?: string
          media_url?: string | null
          posted_at?: string | null
          scheduled_for?: string | null
          status?: string
          summary: string
          synced_at?: string | null
          topic_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          cta_type?: string | null
          cta_url?: string | null
          google_post_id?: string | null
          id?: string
          media_url?: string | null
          posted_at?: string | null
          scheduled_for?: string | null
          status?: string
          summary?: string
          synced_at?: string | null
          topic_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmb_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      maps_rank_keywords: {
        Row: {
          business_id: string
          created_at: string
          id: string
          keyword: string
          last_avg_rank: number | null
          last_scanned_at: string
          scan_count: number
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          keyword: string
          last_avg_rank?: number | null
          last_scanned_at?: string
          scan_count?: number
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          keyword?: string
          last_avg_rank?: number | null
          last_scanned_at?: string
          scan_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maps_rank_keywords_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maps_rank_keywords_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maps_rank_scan_points: {
        Row: {
          competitors: Json | null
          created_at: string
          id: string
          label: string
          lat: number
          lng: number
          rank_position: number | null
          scan_id: string
          total_results: number | null
          user_id: string
        }
        Insert: {
          competitors?: Json | null
          created_at?: string
          id?: string
          label: string
          lat: number
          lng: number
          rank_position?: number | null
          scan_id: string
          total_results?: number | null
          user_id: string
        }
        Update: {
          competitors?: Json | null
          created_at?: string
          id?: string
          label?: string
          lat?: number
          lng?: number
          rank_position?: number | null
          scan_id?: string
          total_results?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maps_rank_scan_points_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "maps_rank_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maps_rank_scan_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maps_rank_scans: {
        Row: {
          business_id: string
          center_lat: number | null
          center_lng: number | null
          created_at: string
          error_message: string | null
          grid_size: number
          id: string
          keyword: string
          spacing_m: number
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          error_message?: string | null
          grid_size: number
          id?: string
          keyword: string
          spacing_m: number
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          error_message?: string | null
          grid_size?: number
          id?: string
          keyword?: string
          spacing_m?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maps_rank_scans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maps_rank_scans_user_id_fkey"
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
          preferred_language: string | null
          pushalert_subscriber_id: string | null
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
          preferred_language?: string | null
          pushalert_subscriber_id?: string | null
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
          preferred_language?: string | null
          pushalert_subscriber_id?: string | null
          subscription_status?: string | null
          total_points?: number | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      published_articles: {
        Row: {
          author: string | null
          body: string
          created_at: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          slug: string
          source_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          body: string
          created_at?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          slug: string
          source_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          body?: string
          created_at?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          source_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ai_response: string | null
          author: string
          comment: string | null
          created_at: string | null
          criteria: Json | null
          edit_count: number | null
          google_reply: string | null
          google_reply_id: string | null
          id: number
          last_edited_at: string | null
          location_id: string
          needs_new_response: boolean | null
          notified: boolean | null
          photos: Json | null
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
          criteria?: Json | null
          edit_count?: number | null
          google_reply?: string | null
          google_reply_id?: string | null
          id?: number
          last_edited_at?: string | null
          location_id: string
          needs_new_response?: boolean | null
          notified?: boolean | null
          photos?: Json | null
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
          criteria?: Json | null
          edit_count?: number | null
          google_reply?: string | null
          google_reply_id?: string | null
          id?: number
          last_edited_at?: string | null
          location_id?: string
          needs_new_response?: boolean | null
          notified?: boolean | null
          photos?: Json | null
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
      visitor_analytics: {
        Row: {
          created_at: string
          id: string
          page: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
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
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      refill_monthly_credits: { Args: never; Returns: undefined }
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
