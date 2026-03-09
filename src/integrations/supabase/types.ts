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
      deal_analyses: {
        Row: {
          ai_summary: string | null
          annual_cash_flow: number
          buy_hold_score: number
          cap_rate: number
          cash_on_cash_return: number
          created_at: string
          down_payment_percent: number
          flip_profit_high: number
          flip_profit_low: number
          flip_score: number
          id: string
          interest_rate: number
          loan_term_years: number
          mao: number
          monthly_cash_flow: number
          monthly_payment: number
          overall_score: number
          property_id: string
          purchase_price: number
          rehab_total_high: number
          rehab_total_low: number
          total_cash_needed: number
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          annual_cash_flow?: number
          buy_hold_score?: number
          cap_rate?: number
          cash_on_cash_return?: number
          created_at?: string
          down_payment_percent?: number
          flip_profit_high?: number
          flip_profit_low?: number
          flip_score?: number
          id?: string
          interest_rate?: number
          loan_term_years?: number
          mao?: number
          monthly_cash_flow?: number
          monthly_payment?: number
          overall_score?: number
          property_id: string
          purchase_price?: number
          rehab_total_high?: number
          rehab_total_low?: number
          total_cash_needed?: number
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          annual_cash_flow?: number
          buy_hold_score?: number
          cap_rate?: number
          cash_on_cash_return?: number
          created_at?: string
          down_payment_percent?: number
          flip_profit_high?: number
          flip_profit_low?: number
          flip_score?: number
          id?: string
          interest_rate?: number
          loan_term_years?: number
          mao?: number
          monthly_cash_flow?: number
          monthly_payment?: number
          overall_score?: number
          property_id?: string
          purchase_price?: number
          rehab_total_high?: number
          rehab_total_low?: number
          total_cash_needed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_analyses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_cache: {
        Row: {
          active_listings: number
          average_days_on_market: number
          created_at: string
          id: string
          location: string
          location_key: string
          median_price: number
          par: number
          pending_listings: number
          price_change: number
          redfin_compete_label: string | null
          redfin_compete_score: number | null
          sources: string[]
          zillow_heat_label: string | null
          zillow_heat_score: number | null
        }
        Insert: {
          active_listings?: number
          average_days_on_market?: number
          created_at?: string
          id?: string
          location: string
          location_key: string
          median_price?: number
          par?: number
          pending_listings?: number
          price_change?: number
          redfin_compete_label?: string | null
          redfin_compete_score?: number | null
          sources?: string[]
          zillow_heat_label?: string | null
          zillow_heat_score?: number | null
        }
        Update: {
          active_listings?: number
          average_days_on_market?: number
          created_at?: string
          id?: string
          location?: string
          location_key?: string
          median_price?: number
          par?: number
          pending_listings?: number
          price_change?: number
          redfin_compete_label?: string | null
          redfin_compete_score?: number | null
          sources?: string[]
          zillow_heat_label?: string | null
          zillow_heat_score?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_capex_percent: number
          default_closing_buy_percent: number
          default_closing_sell_percent: number
          default_down_payment_percent: number
          default_interest_rate: number
          default_loan_term_years: number
          default_management_percent: number
          default_repairs_percent: number
          default_vacancy_percent: number
          email: string | null
          full_name: string | null
          id: string
          mao_multiplier: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_capex_percent?: number
          default_closing_buy_percent?: number
          default_closing_sell_percent?: number
          default_down_payment_percent?: number
          default_interest_rate?: number
          default_loan_term_years?: number
          default_management_percent?: number
          default_repairs_percent?: number
          default_vacancy_percent?: number
          email?: string | null
          full_name?: string | null
          id: string
          mao_multiplier?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_capex_percent?: number
          default_closing_buy_percent?: number
          default_closing_sell_percent?: number
          default_down_payment_percent?: number
          default_interest_rate?: number
          default_loan_term_years?: number
          default_management_percent?: number
          default_repairs_percent?: number
          default_vacancy_percent?: number
          email?: string | null
          full_name?: string | null
          id?: string
          mao_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          asking_price: number
          bathrooms: number
          bedrooms: number
          capex_percent: number
          city: string
          closing_cost_buy_percent: number
          closing_cost_sell_percent: number
          created_at: string
          down_payment_percent: number
          estimated_arv: number
          estimated_monthly_rent: number
          estimated_rehab_high: number
          estimated_rehab_low: number
          hoa_monthly: number
          holding_months: number
          id: string
          insurance_annual: number
          interest_rate: number
          loan_term_years: number
          lot_size: number | null
          notes: string | null
          property_management_percent: number
          property_type: string
          repairs_percent: number
          square_feet: number
          state: string
          taxes_annual: number
          updated_at: string
          user_id: string | null
          vacancy_percent: number
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          asking_price?: number
          bathrooms?: number
          bedrooms?: number
          capex_percent?: number
          city?: string
          closing_cost_buy_percent?: number
          closing_cost_sell_percent?: number
          created_at?: string
          down_payment_percent?: number
          estimated_arv?: number
          estimated_monthly_rent?: number
          estimated_rehab_high?: number
          estimated_rehab_low?: number
          hoa_monthly?: number
          holding_months?: number
          id?: string
          insurance_annual?: number
          interest_rate?: number
          loan_term_years?: number
          lot_size?: number | null
          notes?: string | null
          property_management_percent?: number
          property_type?: string
          repairs_percent?: number
          square_feet?: number
          state?: string
          taxes_annual?: number
          updated_at?: string
          user_id?: string | null
          vacancy_percent?: number
          year_built?: number | null
          zip_code?: string
        }
        Update: {
          address?: string
          asking_price?: number
          bathrooms?: number
          bedrooms?: number
          capex_percent?: number
          city?: string
          closing_cost_buy_percent?: number
          closing_cost_sell_percent?: number
          created_at?: string
          down_payment_percent?: number
          estimated_arv?: number
          estimated_monthly_rent?: number
          estimated_rehab_high?: number
          estimated_rehab_low?: number
          hoa_monthly?: number
          holding_months?: number
          id?: string
          insurance_annual?: number
          interest_rate?: number
          loan_term_years?: number
          lot_size?: number | null
          notes?: string | null
          property_management_percent?: number
          property_type?: string
          repairs_percent?: number
          square_feet?: number
          state?: string
          taxes_annual?: number
          updated_at?: string
          user_id?: string | null
          vacancy_percent?: number
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      saved_deals: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          label: string
          property_id: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          label?: string
          property_id: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          label?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_deals_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "deal_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
