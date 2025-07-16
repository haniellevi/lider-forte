export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          extensions?: Json
          variables?: Json
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
  public: {
    Tables: {
      approval_workflows: {
        Row: {
          id: string
          multiplication_id: string
          church_id: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
          current_step: number
          total_steps: number
          status: Database["public"]["Enums"]["approval_workflow_status"]
          initiated_by: string
          initiated_at: string
          completed_at: string | null
          workflow_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          multiplication_id: string
          church_id: string
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
          current_step?: number
          total_steps?: number
          status?: Database["public"]["Enums"]["approval_workflow_status"]
          initiated_by: string
          initiated_at?: string
          completed_at?: string | null
          workflow_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          multiplication_id?: string
          church_id?: string
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
          current_step?: number
          total_steps?: number
          status?: Database["public"]["Enums"]["approval_workflow_status"]
          initiated_by?: string
          initiated_at?: string
          completed_at?: string | null
          workflow_config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflows_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflows_multiplication_id_fkey"
            columns: ["multiplication_id"]
            isOneToOne: false
            referencedRelation: "multiplication_processes"
            referencedColumns: ["id"]
          }
        ]
      }
      approval_steps: {
        Row: {
          id: string
          workflow_id: string
          step_number: number
          approver_role: Database["public"]["Enums"]["profile_role"]
          required_approver_id: string | null
          status: Database["public"]["Enums"]["step_status"]
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          comments: string | null
          auto_approved: boolean
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          step_number: number
          approver_role: Database["public"]["Enums"]["profile_role"]
          required_approver_id?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          comments?: string | null
          auto_approved?: boolean
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          step_number?: number
          approver_role?: Database["public"]["Enums"]["profile_role"]
          required_approver_id?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          comments?: string | null
          auto_approved?: boolean
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_steps_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      approval_notifications: {
        Row: {
          id: string
          workflow_id: string
          step_id: string
          recipient_id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          title: string
          message: string
          priority: Database["public"]["Enums"]["notification_priority"]
          is_read: boolean
          is_dismissed: boolean
          action_url: string | null
          action_label: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          step_id: string
          recipient_id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          title: string
          message: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          is_read?: boolean
          is_dismissed?: boolean
          action_url?: string | null
          action_label?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          step_id?: string
          recipient_id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          message?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          is_read?: boolean
          is_dismissed?: boolean
          action_url?: string | null
          action_label?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_notifications_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_notifications_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      churches: {
        Row: {
          id: string,
          admin_user_id: string,
          name: string,
          cnpj: string | null,
          address: Json | null,
          contact: Json | null,
          settings: Json | null,
          created_at: string,
          updated_at: string
        }
        Insert: {
          id?: string,
          admin_user_id: string,
          name: string,
          cnpj?: string | null,
          address?: Json | null,
          contact?: Json | null,
          settings?: Json | null
        }
        Update: {
          name?: string,
          cnpj?: string | null,
          address?: Json | null,
          contact?: Json | null,
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "churches_admin_user_id_fkey",
            columns: ["admin_user_id"],
            isOneToOne: false,
            referencedRelation: "users",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churches_admin_user_id_fkey",
            columns: ["admin_user_id"],
            isOneToOne: false,
            referencedRelation: "profiles",
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          church_id: string | null
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          church_id?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          }
        ]
      }
      cells: {
        Row: {
          id: string
          church_id: string
          leader_id: string
          supervisor_id: string | null
          parent_id: string | null
          name: string
          address: Json | null
          meeting_day: number | null
          meeting_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          church_id: string
          leader_id: string
          supervisor_id?: string | null
          parent_id?: string | null
          name: string
          address?: Json | null
          meeting_day?: number | null
          meeting_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          leader_id?: string
          supervisor_id?: string | null
          parent_id?: string | null
          name?: string
          address?: Json | null
          meeting_day?: number | null
          meeting_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cells_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cells_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cells_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cells_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          }
        ]
      }
      cell_members: {
        Row: {
          id: string
          profile_id: string
          cell_id: string
          joined_at: string
          success_ladder_score: number
          is_timoteo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          cell_id: string
          joined_at?: string
          success_ladder_score?: number
          is_timoteo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          cell_id?: string
          joined_at?: string
          success_ladder_score?: number
          is_timoteo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cell_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cell_members_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          icon: string | null
          id: string
          message: string
          read: boolean
          sender_avatar: string | null
          sender_id: string | null
          sender_name: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message: string
          read?: boolean
          sender_avatar?: string | null
          sender_id?: string | null
          sender_name?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message?: string
          read?: boolean
          sender_avatar?: string | null
          sender_id?: string | null
          sender_name?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          published: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      success_ladder_activities: {
        Row: {
          id: string
          name: string
          points: number
          category: Database["public"]["Enums"]["activity_category"]
          description: string | null
          is_active: boolean
          church_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          points: number
          category: Database["public"]["Enums"]["activity_category"]
          description?: string | null
          is_active?: boolean
          church_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          points?: number
          category?: Database["public"]["Enums"]["activity_category"]
          description?: string | null
          is_active?: boolean
          church_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_ladder_activities_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          }
        ]
      }
      member_activity_log: {
        Row: {
          id: string
          profile_id: string
          activity_id: string
          points_earned: number
          activity_date: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          activity_id: string
          points_earned: number
          activity_date: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          activity_id?: string
          points_earned?: number
          activity_date?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_log_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "success_ladder_activities"
            referencedColumns: ["id"]
          }
        ]
      }
      ladder_levels: {
        Row: {
          id: number
          name: string
          min_points: number
          max_points: number
          color: string
          icon: string | null
          description: string | null
          unlocks_features: string[] | null
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: number
          name: string
          min_points: number
          max_points: number
          color: string
          icon?: string | null
          description?: string | null
          unlocks_features?: string[] | null
          order_index: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          min_points?: number
          max_points?: number
          color?: string
          icon?: string | null
          description?: string | null
          unlocks_features?: string[] | null
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          category: Database["public"]["Enums"]["badge_category"]
          criteria: Json
          points_required: number | null
          rarity: Database["public"]["Enums"]["badge_rarity"]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          category: Database["public"]["Enums"]["badge_category"]
          criteria: Json
          points_required?: number | null
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: Database["public"]["Enums"]["badge_category"]
          criteria?: Json
          points_required?: number | null
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      member_badges: {
        Row: {
          id: string
          profile_id: string
          badge_id: string
          earned_at: string
          criteria_met: Json | null
          is_featured: boolean
        }
        Insert: {
          id?: string
          profile_id: string
          badge_id: string
          earned_at?: string
          criteria_met?: Json | null
          is_featured?: boolean
        }
        Update: {
          id?: string
          profile_id?: string
          badge_id?: string
          earned_at?: string
          criteria_met?: Json | null
          is_featured?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      }
      leadership_pipeline: {
        Row: {
          id: string
          profile_id: string
          church_id: string
          leadership_score: number
          potential_level: Database["public"]["Enums"]["leadership_level"]
          confidence_score: number
          last_calculated_at: string
          factors: Json
          recommendations: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          church_id: string
          leadership_score?: number
          potential_level?: Database["public"]["Enums"]["leadership_level"]
          confidence_score?: number
          last_calculated_at?: string
          factors?: Json
          recommendations?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          church_id?: string
          leadership_score?: number
          potential_level?: Database["public"]["Enums"]["leadership_level"]
          confidence_score?: number
          last_calculated_at?: string
          factors?: Json
          recommendations?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_pipeline_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_pipeline_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          }
        ]
      }
      leadership_factors: {
        Row: {
          id: string
          name: string
          category: Database["public"]["Enums"]["factor_category"]
          weight: number
          calculation_method: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: Database["public"]["Enums"]["factor_category"]
          weight: number
          calculation_method: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: Database["public"]["Enums"]["factor_category"]
          weight?: number
          calculation_method?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leadership_assessments: {
        Row: {
          id: string
          profile_id: string
          assessor_id: string | null
          church_id: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          scores: Json
          comments: string | null
          assessment_date: string
          is_validated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          assessor_id?: string | null
          church_id: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          scores: Json
          comments?: string | null
          assessment_date?: string
          is_validated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          assessor_id?: string | null
          church_id?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          scores?: Json
          comments?: string | null
          assessment_date?: string
          is_validated?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_assessments_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          }
        ]
      }
      multiplication_criteria: {
        Row: {
          id: string
          church_id: string
          name: string
          description: string | null
          criteria_type: Database["public"]["Enums"]["criteria_type"]
          threshold_value: number
          weight: number
          is_required: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          church_id: string
          name: string
          description?: string | null
          criteria_type: Database["public"]["Enums"]["criteria_type"]
          threshold_value: number
          weight?: number
          is_required?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          church_id?: string
          name?: string
          description?: string | null
          criteria_type?: Database["public"]["Enums"]["criteria_type"]
          threshold_value?: number
          weight?: number
          is_required?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplication_criteria_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          }
        ]
      }
      multiplication_readiness: {
        Row: {
          id: string
          cell_id: string
          readiness_score: number
          status: Database["public"]["Enums"]["multiplication_status"]
          criteria_results: Json
          projected_date: string | null
          confidence_level: number
          recommendations: string[]
          blocking_factors: string[]
          last_evaluated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cell_id: string
          readiness_score?: number
          status?: Database["public"]["Enums"]["multiplication_status"]
          criteria_results?: Json
          projected_date?: string | null
          confidence_level?: number
          recommendations?: string[]
          blocking_factors?: string[]
          last_evaluated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cell_id?: string
          readiness_score?: number
          status?: Database["public"]["Enums"]["multiplication_status"]
          criteria_results?: Json
          projected_date?: string | null
          confidence_level?: number
          recommendations?: string[]
          blocking_factors?: string[]
          last_evaluated_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplication_readiness_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: true
            referencedRelation: "cells"
            referencedColumns: ["id"]
          }
        ]
      }
      cell_meetings: {
        Row: {
          id: string
          cell_id: string
          meeting_date: string
          planned_attendees: number | null
          actual_attendees: number | null
          duration_minutes: number | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cell_id: string
          meeting_date: string
          planned_attendees?: number | null
          actual_attendees?: number | null
          duration_minutes?: number | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cell_id?: string
          meeting_date?: string
          planned_attendees?: number | null
          actual_attendees?: number | null
          duration_minutes?: number | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cell_meetings_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cell_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_clerk_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_church_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      calculate_member_score: {
        Args: {
          member_id: string
        }
        Returns: number
      }
      get_cell_ladder_ranking: {
        Args: {
          cell_id: string
        }
        Returns: {
          profile_id: string
          full_name: string
          success_ladder_score: number
          rank: number
        }[]
      }
      get_church_ladder_ranking: {
        Args: {
          church_id: string
        }
        Returns: {
          profile_id: string
          full_name: string
          success_ladder_score: number
          cell_name: string
          rank: number
        }[]
      }
      get_member_level: {
        Args: {
          member_score: number
        }
        Returns: {
          level_id: number
          name: string
          color: string
          icon: string | null
          description: string | null
          progress_percentage: number
          points_to_next: number
        }[]
      }
      check_member_badges: {
        Args: {
          member_id: string
        }
        Returns: {
          badge_id: string
          criteria_met: Json
        }[]
      }
      get_member_badges: {
        Args: {
          member_id: string
        }
        Returns: {
          badge_id: string
          name: string
          description: string
          icon: string
          category: Database["public"]["Enums"]["badge_category"]
          rarity: Database["public"]["Enums"]["badge_rarity"]
          earned_at: string
          is_featured: boolean
        }[]
      }
      get_church_leaderboard_with_levels: {
        Args: {
          church_id: string
          limit_count?: number
        }
        Returns: {
          profile_id: string
          full_name: string
          success_ladder_score: number
          level_name: string
          level_color: string
          level_icon: string
          badge_count: number
          rank: number
        }[]
      }
      award_badge_to_member: {
        Args: {
          member_id: string
          badge_id: string
          awarded_by: string
          reason?: string | null
        }
        Returns: boolean
      }
      calculate_leadership_score: {
        Args: {
          member_id: string
        }
        Returns: {
          leadership_score: number
          confidence_score: number
          factors: Json
          potential_level: Database["public"]["Enums"]["leadership_level"]
          recommendations: string[]
        }[]
      }
      recalculate_church_leadership_scores: {
        Args: {
          church_id: string
        }
        Returns: number
      }
      get_church_leadership_pipeline: {
        Args: {
          church_id: string
          limit_count?: number
        }
        Returns: {
          profile_id: string
          full_name: string
          leadership_score: number
          potential_level: Database["public"]["Enums"]["leadership_level"]
          confidence_score: number
          member_role: string
          cell_name: string
          last_calculated_at: string
          recommendations: string[]
        }[]
      }
      get_member_leadership_profile: {
        Args: {
          member_id: string
        }
        Returns: {
          profile_id: string
          full_name: string
          leadership_score: number
          potential_level: Database["public"]["Enums"]["leadership_level"]
          confidence_score: number
          factors: Json
          recommendations: string[]
          assessment_count: number
          last_calculated_at: string
        }[]
      }
      evaluate_multiplication_criteria: {
        Args: {
          p_cell_id: string
        }
        Returns: {
          readiness_score: number
          status: Database["public"]["Enums"]["multiplication_status"]
          criteria_results: Json
          projected_date: string
          confidence_level: number
          recommendations: string[]
          blocking_factors: string[]
        }[]
      }
      update_all_cells_readiness: {
        Args: {
          p_church_id: string
        }
        Returns: number
      }
      generate_multiplication_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          cell_id: string
          cell_name: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          message: string
          priority: number
          supervisor_id: string
          pastor_id: string
        }[]
      }
      get_multiplication_dashboard: {
        Args: {
          p_church_id: string
        }
        Returns: {
          total_cells: number
          ready_cells: number
          preparing_cells: number
          not_ready_cells: number
          average_readiness_score: number
          cells_details: Json
        }[]
      }
      get_cell_multiplication_details: {
        Args: {
          p_cell_id: string
        }
        Returns: {
          cell_id: string
          cell_name: string
          leader_name: string
          readiness_score: number
          status: Database["public"]["Enums"]["multiplication_status"]
          criteria_results: Json
          recommendations: string[]
          blocking_factors: string[]
          projected_date: string
          confidence_level: number
          member_count: number
          potential_leaders: number
          recent_meetings: number
          last_evaluated_at: string
        }[]
      }
      calculate_meeting_frequency: {
        Args: {
          p_cell_id: string
          days_back: number
        }
        Returns: number
      }
      calculate_average_attendance: {
        Args: {
          p_cell_id: string
          days_back: number
        }
        Returns: number
      }
      get_potential_leaders_count: {
        Args: {
          p_cell_id: string
        }
        Returns: number
      }
    }
    Enums: {
      user_role: "pastor" | "supervisor" | "leader" | "timoteo" | "member"
      profile_role: "pastor" | "supervisor" | "leader" | "timoteo" | "member"
      workflow_type: "multiplication" | "leadership_promotion" | "cell_creation" | "budget_approval"
      approval_workflow_status: "pending" | "approved" | "rejected" | "cancelled" | "expired"
      step_status: "pending" | "approved" | "rejected" | "skipped" | "expired"
      notification_type: "approval_request" | "approval_reminder" | "approval_approved" | "approval_rejected" | "workflow_completed" | "workflow_expired" | "info" | "success" | "warning" | "error" | "message" | "alert" | "reminder" | "update"
      notification_priority: "low" | "medium" | "high" | "urgent"
      activity_category: "attendance" | "events" | "courses" | "service" | "consistency"
      badge_category: "frequency" | "leadership" | "learning" | "service" | "special"
      badge_rarity: "common" | "rare" | "epic" | "legendary"
      leadership_level: "member" | "timoteo" | "leader_potential" | "leader_ready" | "supervisor_potential"
      factor_category: "attendance" | "growth" | "engagement" | "influence" | "service" | "learning" | "leadership_traits"
      assessment_type: "supervisor_feedback" | "peer_review" | "self_assessment" | "behavioral_observation"
      criteria_type: "member_count" | "meeting_frequency" | "average_attendance" | "potential_leaders" | "cell_age_months" | "leader_maturity" | "growth_rate" | "stability_score"
      multiplication_status: "not_ready" | "preparing" | "ready" | "optimal" | "overdue"
      meeting_type: "regular" | "special" | "training" | "evangelistic" | "fellowship"
      alert_type: "ready_for_multiplication" | "slow_growth" | "missing_leader" | "low_attendance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["pastor", "supervisor", "leader", "timoteo", "member"],
      profile_role: ["pastor", "supervisor", "leader", "timoteo", "member"],
      workflow_type: ["multiplication", "leadership_promotion", "cell_creation", "budget_approval"],
      approval_workflow_status: ["pending", "approved", "rejected", "cancelled", "expired"],
      step_status: ["pending", "approved", "rejected", "skipped", "expired"],
      notification_type: ["approval_request", "approval_reminder", "approval_approved", "approval_rejected", "workflow_completed", "workflow_expired", "info", "success", "warning", "error", "message", "alert", "reminder", "update"],
      notification_priority: ["low", "medium", "high", "urgent"],
      activity_category: ["attendance", "events", "courses", "service", "consistency"],
      badge_category: ["frequency", "leadership", "learning", "service", "special"],
      badge_rarity: ["common", "rare", "epic", "legendary"],
      leadership_level: ["member", "timoteo", "leader_potential", "leader_ready", "supervisor_potential"],
      factor_category: ["attendance", "growth", "engagement", "influence", "service", "learning", "leadership_traits"],
      assessment_type: ["supervisor_feedback", "peer_review", "self_assessment", "behavioral_observation"],
      criteria_type: ["member_count", "meeting_frequency", "average_attendance", "potential_leaders", "cell_age_months", "leader_maturity", "growth_rate", "stability_score"],
      multiplication_status: ["not_ready", "preparing", "ready", "optimal", "overdue"],
      meeting_type: ["regular", "special", "training", "evangelistic", "fellowship"],
      alert_type: ["ready_for_multiplication", "slow_growth", "missing_leader", "low_attendance"],
    },
  },
} as const
