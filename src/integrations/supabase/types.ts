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
      account_manager_assignments: {
        Row: {
          account_manager_id: string
          assigned_at: string
          assigned_by: string
          client_id: string
          id: string
        }
        Insert: {
          account_manager_id: string
          assigned_at?: string
          assigned_by: string
          client_id: string
          id?: string
        }
        Update: {
          account_manager_id?: string
          assigned_at?: string
          assigned_by?: string
          client_id?: string
          id?: string
        }
        Relationships: []
      }
      additional_data_requests: {
        Row: {
          case_id: string
          created_at: string
          id: string
          request_message: string
          requested_by: string
          responded_at: string | null
          response_message: string | null
          response_type: string
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          request_message: string
          requested_by: string
          responded_at?: string | null
          response_message?: string | null
          response_type?: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          request_message?: string
          requested_by?: string
          responded_at?: string | null
          response_message?: string | null
          response_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_data_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_data_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_settings: {
        Row: {
          account_number: string
          account_title: string
          bank_name: string
          branch: string | null
          currency: string
          iban: string
          id: string
          is_active: boolean
          swift_code: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number: string
          account_title: string
          bank_name: string
          branch?: string | null
          currency?: string
          iban: string
          id?: string
          is_active?: boolean
          swift_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string
          account_title?: string
          bank_name?: string
          branch?: string | null
          currency?: string
          iban?: string
          id?: string
          is_active?: boolean
          swift_code?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      case_designs: {
        Row: {
          case_id: string
          created_at: string
          file_name: string
          file_url: string
          id: string
          notes: string | null
          uploaded_by: string | null
          version: number
        }
        Insert: {
          case_id: string
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          case_id?: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          notes?: string | null
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_designs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_designs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_files: {
        Row: {
          case_id: string
          created_at: string
          file_label: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
          uploader_role: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          file_label?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
          uploader_role?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          file_label?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
          uploader_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_files_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_files_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          case_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_role?: Database["public"]["Enums"]["sender_role"]
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_status_history: {
        Row: {
          case_id: string
          changed_by: string | null
          changed_by_role: string | null
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          case_id: string
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          case_id?: string
          changed_by?: string | null
          changed_by_role?: string | null
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_status_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_status_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          admin_notes: string | null
          assigned_designer_id: string | null
          clinical_notes: string | null
          consultation_requested: boolean | null
          created_at: string
          delivered_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          id: string
          is_archived: boolean | null
          is_free_trial: boolean | null
          patient_dob: string | null
          patient_gender: string | null
          patient_ref: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          payment_rejection_note: string | null
          payment_submitted_at: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          quote_accepted_at: string | null
          quote_sent_at: string | null
          quoted_price_usd: number | null
          service_code: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_designer_id?: string | null
          clinical_notes?: string | null
          consultation_requested?: boolean | null
          created_at?: string
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          id?: string
          is_archived?: boolean | null
          is_free_trial?: boolean | null
          patient_dob?: string | null
          patient_gender?: string | null
          patient_ref?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_rejection_note?: string | null
          payment_submitted_at?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          quote_accepted_at?: string | null
          quote_sent_at?: string | null
          quoted_price_usd?: number | null
          service_code?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_designer_id?: string | null
          clinical_notes?: string | null
          consultation_requested?: boolean | null
          created_at?: string
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          id?: string
          is_archived?: boolean | null
          is_free_trial?: boolean | null
          patient_dob?: string | null
          patient_gender?: string | null
          patient_ref?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_rejection_note?: string | null
          payment_submitted_at?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          quote_accepted_at?: string | null
          quote_sent_at?: string | null
          quoted_price_usd?: number | null
          service_code?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          is_visible: boolean
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_visible?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_visible?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      consultations: {
        Row: {
          admin_notes: string | null
          assigned_designer_id: string | null
          client_name: string
          confirmed_slot: Json | null
          country: string
          created_at: string
          description: string | null
          designer_notes: string | null
          email: string
          id: string
          phone: string
          proposed_slots: Json | null
          referral_source: string | null
          reschedule_reason: string | null
          service_interest: string | null
          specialty: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          timezone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_designer_id?: string | null
          client_name: string
          confirmed_slot?: Json | null
          country: string
          created_at?: string
          description?: string | null
          designer_notes?: string | null
          email: string
          id?: string
          phone: string
          proposed_slots?: Json | null
          referral_source?: string | null
          reschedule_reason?: string | null
          service_interest?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_designer_id?: string | null
          client_name?: string
          confirmed_slot?: Json | null
          country?: string
          created_at?: string
          description?: string | null
          designer_notes?: string | null
          email?: string
          id?: string
          phone?: string
          proposed_slots?: Json | null
          referral_source?: string | null
          reschedule_reason?: string | null
          service_interest?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      designer_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          name: string
          notes: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          name: string
          notes?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          name?: string
          notes?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      education_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          allow_use: boolean
          case_id: string | null
          created_at: string
          designer_id: string | null
          feedback_source: string | null
          feedback_type: string
          id: string
          message: string
          rating: number | null
          recommends: string | null
          related_case_id: string | null
          screenshot_url: string | null
          status: string
          subject: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          admin_notes?: string | null
          allow_use?: boolean
          case_id?: string | null
          created_at?: string
          designer_id?: string | null
          feedback_source?: string | null
          feedback_type: string
          id?: string
          message: string
          rating?: number | null
          recommends?: string | null
          related_case_id?: string | null
          screenshot_url?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          admin_notes?: string | null
          allow_use?: boolean
          case_id?: string | null
          created_at?: string
          designer_id?: string | null
          feedback_source?: string | null
          feedback_type?: string
          id?: string
          message?: string
          rating?: number | null
          recommends?: string | null
          related_case_id?: string | null
          screenshot_url?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      free_trials: {
        Row: {
          id: string
          service_category: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          service_category: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          service_category?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hdi_align_applications: {
        Row: {
          clinic_name: string
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          monthly_cases: string
          notes: string | null
          phone: string
          status: string
        }
        Insert: {
          clinic_name: string
          country: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          monthly_cases: string
          notes?: string | null
          phone: string
          status?: string
        }
        Update: {
          clinic_name?: string
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          monthly_cases?: string
          notes?: string | null
          phone?: string
          status?: string
        }
        Relationships: []
      }
      hdi_os_enquiries: {
        Row: {
          country: string
          created_at: string
          email: string
          facility_type: string
          full_name: string
          id: string
          organisation_name: string
          phone: string
          status: string
          workflow_challenge: string | null
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          facility_type: string
          full_name: string
          id?: string
          organisation_name: string
          phone: string
          status?: string
          workflow_challenge?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          facility_type?: string
          full_name?: string
          id?: string
          organisation_name?: string
          phone?: string
          status?: string
          workflow_challenge?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount_usd: number
          case_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_session_id: string | null
          transfer_claimed_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_usd: number
          case_id: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_session_id?: string | null
          transfer_claimed_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_usd?: number
          case_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_session_id?: string | null
          transfer_claimed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_name: string | null
          country: string | null
          created_at: string
          default_role: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone_number: string | null
          specialty: string | null
        }
        Insert: {
          clinic_name?: string | null
          country?: string | null
          created_at?: string
          default_role?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          specialty?: string | null
        }
        Update: {
          clinic_name?: string | null
          country?: string | null
          created_at?: string
          default_role?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_custom_quote: boolean
          is_visible: boolean
          name: string
          price_max_usd: number | null
          price_min_usd: number | null
          price_type: string
          price_usd: number
          quote_note: string | null
          turnaround_time: string | null
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_custom_quote?: boolean
          is_visible?: boolean
          name: string
          price_max_usd?: number | null
          price_min_usd?: number | null
          price_type?: string
          price_usd: number
          quote_note?: string | null
          turnaround_time?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_custom_quote?: boolean
          is_visible?: boolean
          name?: string
          price_max_usd?: number | null
          price_min_usd?: number | null
          price_type?: string
          price_usd?: number
          quote_note?: string | null
          turnaround_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_cases: {
        Row: {
          clinical_notes: string | null
          consultation_requested: boolean | null
          created_at: string | null
          delivered_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null
          id: string | null
          is_archived: boolean | null
          is_free_trial: boolean | null
          patient_ref: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          payment_submitted_at: string | null
          quote_accepted_at: string | null
          quote_sent_at: string | null
          quoted_price_usd: number | null
          service_code: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clinical_notes?: string | null
          consultation_requested?: boolean | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          id?: string | null
          is_archived?: boolean | null
          is_free_trial?: boolean | null
          patient_ref?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_submitted_at?: string | null
          quote_accepted_at?: string | null
          quote_sent_at?: string | null
          quoted_price_usd?: number | null
          service_code?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clinical_notes?: string | null
          consultation_requested?: boolean | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"] | null
          id?: string | null
          is_archived?: boolean | null
          is_free_trial?: boolean | null
          patient_ref?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_submitted_at?: string | null
          quote_accepted_at?: string | null
          quote_sent_at?: string | null
          quoted_price_usd?: number | null
          service_code?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_managed_client_ids: {
        Args: { _manager_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_manager_for: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "client"
        | "designer"
        | "admin"
        | "super_admin"
        | "account_manager"
      case_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "awaiting_client_info"
        | "additional_data_review"
        | "awaiting_quote"
        | "quote_accepted"
        | "revision_requested"
        | "in_design"
        | "design_review"
        | "pending_client_approval"
        | "awaiting_payment"
        | "payment_under_verification"
        | "payment_verified"
        | "final_delivery_submitted"
        | "paid"
        | "delivered"
      consultation_status:
        | "pending_review"
        | "assigned"
        | "time_proposed"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "reschedule_requested"
      delivery_type: "standard" | "rush"
      payment_method: "card" | "bank_transfer"
      payment_status: "pending" | "paid" | "refunded"
      sender_role: "client" | "designer" | "admin"
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
      app_role: [
        "client",
        "designer",
        "admin",
        "super_admin",
        "account_manager",
      ],
      case_status: [
        "draft",
        "submitted",
        "under_review",
        "awaiting_client_info",
        "additional_data_review",
        "awaiting_quote",
        "quote_accepted",
        "revision_requested",
        "in_design",
        "design_review",
        "pending_client_approval",
        "awaiting_payment",
        "payment_under_verification",
        "payment_verified",
        "final_delivery_submitted",
        "paid",
        "delivered",
      ],
      consultation_status: [
        "pending_review",
        "assigned",
        "time_proposed",
        "confirmed",
        "completed",
        "cancelled",
        "reschedule_requested",
      ],
      delivery_type: ["standard", "rush"],
      payment_method: ["card", "bank_transfer"],
      payment_status: ["pending", "paid", "refunded"],
      sender_role: ["client", "designer", "admin"],
    },
  },
} as const
