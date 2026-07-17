export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_ratings: {
        Row: {
          created_at: string
          is_positive: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_positive: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_positive?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          last_notified_subscription_id: string | null
          last_notified_target_date: string | null
          name: string
          notify_days_before: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_notified_subscription_id?: string | null
          last_notified_target_date?: string | null
          name: string
          notify_days_before?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_notified_subscription_id?: string | null
          last_notified_target_date?: string | null
          name?: string
          notify_days_before?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          cancellation_mode: string | null
          canceled_at: string | null
          category_id: string
          created_at: string
          description: string | null
          earliest_cancellation_date: string | null
          id: string
          min_term_months: number | null
          name: string
          notice_period: string | null
          start_date: string | null
          updated_at: string
          user_id: string
          yearly_cost: number | null
        }
        Insert: {
          amount: number
          billing_cycle: string
          cancellation_mode?: string | null
          canceled_at?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          earliest_cancellation_date?: string | null
          id?: string
          min_term_months?: number | null
          name: string
          notice_period?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
          yearly_cost?: number | null
        }
        Update: {
          amount?: number
          billing_cycle?: string
          cancellation_mode?: string | null
          canceled_at?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          earliest_cancellation_date?: string | null
          id?: string
          min_term_months?: number | null
          name?: string
          notice_period?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
          yearly_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      resolve_login_email: { Args: { identifier: string }; Returns: string }
      get_rating_stats: {
        Args: Record<PropertyKey, never>
        Returns: { positive_count: number; total_users: number }[]
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

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
