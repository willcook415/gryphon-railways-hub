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
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          pinned: boolean
          priority: Database["public"]["Enums"]["priority_level"]
          target_subteam: Database["public"]["Enums"]["app_subteam"] | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean
          priority?: Database["public"]["Enums"]["priority_level"]
          target_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean
          priority?: Database["public"]["Enums"]["priority_level"]
          target_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_item_status: {
        Row: {
          checklist_item_id: string
          checklist_run_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          note: string | null
          state: Database["public"]["Enums"]["checklist_item_state"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          checklist_item_id: string
          checklist_run_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          state?: Database["public"]["Enums"]["checklist_item_state"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          checklist_item_id?: string
          checklist_run_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          state?: Database["public"]["Enums"]["checklist_item_state"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_status_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_status_checklist_run_id_fkey"
            columns: ["checklist_run_id"]
            isOneToOne: false
            referencedRelation: "checklist_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_status_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_status_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          assigned_subteam: Database["public"]["Enums"]["app_subteam"] | null
          assigned_to: string | null
          checklist_id: string
          created_at: string
          critical: boolean
          description: string | null
          id: string
          linked_document_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          assigned_to?: string | null
          checklist_id: string
          created_at?: string
          critical?: boolean
          description?: string | null
          id?: string
          linked_document_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          assigned_to?: string | null
          checklist_id?: string
          created_at?: string
          critical?: boolean
          description?: string | null
          id?: string
          linked_document_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_linked_document_id_fkey"
            columns: ["linked_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_runs: {
        Row: {
          checklist_id: string
          completed_at: string | null
          context: string | null
          created_at: string
          id: string
          started_at: string
          started_by: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          context?: string | null
          created_at?: string
          id?: string
          started_at?: string
          started_by?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          context?: string | null
          created_at?: string
          id?: string
          started_at?: string
          started_by?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_template: boolean
          owner_subteam: Database["public"]["Enums"]["app_subteam"] | null
          title: string
          updated_at: string
        }
        Insert: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          owner_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          title: string
          updated_at?: string
        }
        Update: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          owner_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acknowledgements: {
        Row: {
          acknowledged_at: string
          document_version_id: string
          id: string
          profile_id: string
        }
        Insert: {
          acknowledged_at?: string
          document_version_id: string
          id?: string
          profile_id?: string
        }
        Update: {
          acknowledged_at?: string
          document_version_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_acknowledgements_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_acknowledgements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          document_id: string
          file_name: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["approval_status"]
          storage_bucket: string
          storage_path: string
          uploaded_by: string | null
          version_label: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["approval_status"]
          storage_bucket: string
          storage_path: string
          uploaded_by?: string | null
          version_label: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["approval_status"]
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_safety_critical: boolean
          owner_id: string | null
          owner_subteam: Database["public"]["Enums"]["app_subteam"] | null
          requires_acknowledgement: boolean
          review_due_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_safety_critical?: boolean
          owner_id?: string | null
          owner_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          requires_acknowledgement?: boolean
          review_due_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_safety_critical?: boolean
          owner_id?: string | null
          owner_subteam?: Database["public"]["Enums"]["app_subteam"] | null
          requires_acknowledgement?: boolean
          review_due_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fault_attachments: {
        Row: {
          created_at: string
          fault_id: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          fault_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_bucket: string
          storage_path: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          fault_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fault_attachments_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "faults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fault_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fault_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          fault_id: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          fault_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          fault_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fault_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fault_comments_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "faults"
            referencedColumns: ["id"]
          },
        ]
      }
      fault_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          fault_id: string
          id: string
          new_status: Database["public"]["Enums"]["fault_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["fault_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          fault_id: string
          id?: string
          new_status: Database["public"]["Enums"]["fault_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["fault_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          fault_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["fault_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["fault_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fault_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fault_status_history_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "faults"
            referencedColumns: ["id"]
          },
        ]
      }
      faults: {
        Row: {
          assigned_to: string | null
          blocks_testing: boolean
          created_at: string
          description: string | null
          due_at: string | null
          fixed_at: string | null
          fixed_by: string | null
          id: string
          linked_test_run_id: string | null
          reported_by: string
          safety_critical: boolean
          severity: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["fault_status"]
          subsystem: Database["public"]["Enums"]["app_subteam"]
          title: string
          updated_at: string
          verified_closed_at: string | null
          verified_closed_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          blocks_testing?: boolean
          created_at?: string
          description?: string | null
          due_at?: string | null
          fixed_at?: string | null
          fixed_by?: string | null
          id?: string
          linked_test_run_id?: string | null
          reported_by?: string
          safety_critical?: boolean
          severity?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["fault_status"]
          subsystem: Database["public"]["Enums"]["app_subteam"]
          title: string
          updated_at?: string
          verified_closed_at?: string | null
          verified_closed_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          blocks_testing?: boolean
          created_at?: string
          description?: string | null
          due_at?: string | null
          fixed_at?: string | null
          fixed_by?: string | null
          id?: string
          linked_test_run_id?: string | null
          reported_by?: string
          safety_critical?: boolean
          severity?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["fault_status"]
          subsystem?: Database["public"]["Enums"]["app_subteam"]
          title?: string
          updated_at?: string
          verified_closed_at?: string | null
          verified_closed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faults_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_fixed_by_fkey"
            columns: ["fixed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_linked_test_run_id_fkey"
            columns: ["linked_test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_verified_closed_by_fkey"
            columns: ["verified_closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          actor_id: string | null
          created_at: string
          delivered_at: string | null
          entity_id: string | null
          entity_table: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id: string
          payload: Json
          target_profile_id: string | null
          target_subteam: Database["public"]["Enums"]["app_subteam"] | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delivered_at?: string | null
          entity_id?: string | null
          entity_table?: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          payload?: Json
          target_profile_id?: string | null
          target_subteam?: Database["public"]["Enums"]["app_subteam"] | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delivered_at?: string | null
          entity_id?: string | null
          entity_table?: string | null
          event_type?: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          payload?: Json
          target_profile_id?: string | null
          target_subteam?: Database["public"]["Enums"]["app_subteam"] | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id: string
          profile_id: string
          push_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          profile_id?: string
          push_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          event_type?: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          profile_id?: string
          push_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          last_seen_at: string | null
          phone: string | null
          preferred_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          subteam: Database["public"]["Enums"]["app_subteam"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          phone?: string | null
          preferred_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          subteam?: Database["public"]["Enums"]["app_subteam"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          phone?: string | null
          preferred_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          subteam?: Database["public"]["Enums"]["app_subteam"] | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          device_label: string | null
          enabled: boolean
          external_user_id: string | null
          id: string
          last_seen_at: string | null
          platform: string | null
          profile_id: string
          provider: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          enabled?: boolean
          external_user_id?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string | null
          profile_id?: string
          provider?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          enabled?: boolean
          external_user_id?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string | null
          profile_id?: string
          provider?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["telemetry_event_type"]
          id: string
          payload: Json
          recorded_at: string
          session_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["telemetry_event_type"]
          id?: string
          payload?: Json
          recorded_at?: string
          session_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["telemetry_event_type"]
          id?: string
          payload?: Json
          recorded_at?: string
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telemetry_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_points: {
        Row: {
          auto_stop_active: boolean | null
          battery_percent: number | null
          brake_demand: number | null
          brakes_applied: boolean | null
          controller_temp_c: number | null
          emergency_brake_active: boolean | null
          id: number
          latitude: number | null
          longitude: number | null
          motor_temp_c: number | null
          payload: Json
          recorded_at: string
          recovered_energy_wh: number | null
          sequence_number: number | null
          session_id: string
          speed_kmh: number | null
          traction_demand: number | null
        }
        Insert: {
          auto_stop_active?: boolean | null
          battery_percent?: number | null
          brake_demand?: number | null
          brakes_applied?: boolean | null
          controller_temp_c?: number | null
          emergency_brake_active?: boolean | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          motor_temp_c?: number | null
          payload?: Json
          recorded_at?: string
          recovered_energy_wh?: number | null
          sequence_number?: number | null
          session_id: string
          speed_kmh?: number | null
          traction_demand?: number | null
        }
        Update: {
          auto_stop_active?: boolean | null
          battery_percent?: number | null
          brake_demand?: number | null
          brakes_applied?: boolean | null
          controller_temp_c?: number | null
          emergency_brake_active?: boolean | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          motor_temp_c?: number | null
          payload?: Json
          recorded_at?: string
          recovered_energy_wh?: number | null
          sequence_number?: number | null
          session_id?: string
          speed_kmh?: number | null
          traction_demand?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_points_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telemetry_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          notes: string | null
          source: string | null
          started_at: string
          test_run_id: string | null
          title: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          started_at?: string
          test_run_id?: string | null
          title?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          started_at?: string
          test_run_id?: string | null
          title?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_sessions_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          test_run_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_bucket: string
          storage_path: string
          test_run_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          test_run_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attachments_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_fault_links: {
        Row: {
          created_at: string
          created_by: string | null
          fault_id: string
          id: string
          test_run_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fault_id: string
          id?: string
          test_run_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fault_id?: string
          id?: string
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_fault_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_fault_links_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "faults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_fault_links_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_observations: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          observation: string
          observed_at: string
          severity: Database["public"]["Enums"]["priority_level"] | null
          test_run_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          observation: string
          observed_at?: string
          severity?: Database["public"]["Enums"]["priority_level"] | null
          test_run_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          observation?: string
          observed_at?: string
          severity?: Database["public"]["Enums"]["priority_level"] | null
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_observations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_observations_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_run_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role_description: string | null
          test_run_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role_description?: string | null
          test_run_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role_description?: string | null
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_run_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_run_members_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string | null
          location: string | null
          notes: string | null
          objective: string | null
          result: Database["public"]["Enums"]["test_result"]
          runtime_minutes: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          title: string
          track_conditions: string | null
          updated_at: string
          vehicle_configuration: string | null
          weather_conditions: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          objective?: string | null
          result?: Database["public"]["Enums"]["test_result"]
          runtime_minutes?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          title: string
          track_conditions?: string | null
          updated_at?: string
          vehicle_configuration?: string | null
          weather_conditions?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          objective?: string | null
          result?: Database["public"]["Enums"]["test_result"]
          runtime_minutes?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          title?: string
          track_conditions?: string | null
          updated_at?: string
          vehicle_configuration?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_runs_lead_id_fkey"
            columns: ["lead_id"]
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
      claim_initial_admin: { Args: never; Returns: undefined }
      has_role: {
        Args: { required_roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      is_active_member: { Args: never; Returns: boolean }
      is_admin_or_exec: { Args: never; Returns: boolean }
      is_team_lead_for: {
        Args: { team: Database["public"]["Enums"]["app_subteam"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "exec" | "team_lead" | "member" | "viewer"
      app_subteam:
        | "structures"
        | "powertrain"
        | "vehicle_systems"
        | "manufacturing_testing"
        | "systems_engineering"
        | "business_ops"
      approval_status:
        | "draft"
        | "in_review"
        | "approved"
        | "archived"
        | "rejected"
      checklist_item_state:
        | "not_started"
        | "in_progress"
        | "complete"
        | "blocked"
        | "not_applicable"
      checklist_type:
        | "competition"
        | "testing"
        | "safety"
        | "onboarding"
        | "general"
      document_type:
        | "method_statement"
        | "risk_assessment"
        | "operating_procedure"
        | "isolation_procedure"
        | "jacking_lifting_procedure"
        | "fire_procedure"
        | "competition_checklist"
        | "onboarding_document"
        | "general"
      fault_status:
        | "open"
        | "investigating"
        | "fixed"
        | "verified_closed"
        | "rejected"
      notification_event_type:
        | "fault_created"
        | "fault_assigned"
        | "fault_updated"
        | "fault_fixed"
        | "fault_closed"
        | "test_scheduled"
        | "test_cancelled"
        | "document_updated"
        | "checklist_critical_incomplete"
        | "announcement_created"
      priority_level: "low" | "medium" | "high" | "critical"
      telemetry_event_type:
        | "info"
        | "warning"
        | "fault"
        | "safety"
        | "run_marker"
      test_result:
        | "planned"
        | "in_progress"
        | "passed"
        | "failed"
        | "partial"
        | "cancelled"
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
      app_role: ["admin", "exec", "team_lead", "member", "viewer"],
      app_subteam: [
        "structures",
        "powertrain",
        "vehicle_systems",
        "manufacturing_testing",
        "systems_engineering",
        "business_ops",
      ],
      approval_status: [
        "draft",
        "in_review",
        "approved",
        "archived",
        "rejected",
      ],
      checklist_item_state: [
        "not_started",
        "in_progress",
        "complete",
        "blocked",
        "not_applicable",
      ],
      checklist_type: [
        "competition",
        "testing",
        "safety",
        "onboarding",
        "general",
      ],
      document_type: [
        "method_statement",
        "risk_assessment",
        "operating_procedure",
        "isolation_procedure",
        "jacking_lifting_procedure",
        "fire_procedure",
        "competition_checklist",
        "onboarding_document",
        "general",
      ],
      fault_status: [
        "open",
        "investigating",
        "fixed",
        "verified_closed",
        "rejected",
      ],
      notification_event_type: [
        "fault_created",
        "fault_assigned",
        "fault_updated",
        "fault_fixed",
        "fault_closed",
        "test_scheduled",
        "test_cancelled",
        "document_updated",
        "checklist_critical_incomplete",
        "announcement_created",
      ],
      priority_level: ["low", "medium", "high", "critical"],
      telemetry_event_type: [
        "info",
        "warning",
        "fault",
        "safety",
        "run_marker",
      ],
      test_result: [
        "planned",
        "in_progress",
        "passed",
        "failed",
        "partial",
        "cancelled",
      ],
    },
  },
} as const
