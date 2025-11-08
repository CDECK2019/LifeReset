export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          timezone: string
          current_program_id: string | null
          grace_days_used: number
          voice_enabled: boolean
          streak_start_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          timezone?: string
          current_program_id?: string | null
          grace_days_used?: number
          voice_enabled?: boolean
          streak_start_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          timezone?: string
          current_program_id?: string | null
          grace_days_used?: number
          voice_enabled?: boolean
          streak_start_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_days: number
          task_categories: Json
          is_custom: boolean
          is_template: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_days?: number
          task_categories?: Json
          is_custom?: boolean
          is_template?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_days?: number
          task_categories?: Json
          is_custom?: boolean
          is_template?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          program_id: string | null
          program_day: number
          date: string
          tasks_completed: Json
          tasks_missed: string[]
          reflection_text: string | null
          reflection_audio_url: string | null
          mood_rating: number | null
          energy_rating: number | null
          progress_photo_url: string | null
          is_grace_day: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_id?: string | null
          program_day: number
          date: string
          tasks_completed?: Json
          tasks_missed?: string[]
          reflection_text?: string | null
          reflection_audio_url?: string | null
          mood_rating?: number | null
          energy_rating?: number | null
          progress_photo_url?: string | null
          is_grace_day?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string | null
          program_day?: number
          date?: string
          tasks_completed?: Json
          tasks_missed?: string[]
          reflection_text?: string | null
          reflection_audio_url?: string | null
          mood_rating?: number | null
          energy_rating?: number | null
          progress_photo_url?: string | null
          is_grace_day?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      streaks: {
        Row: {
          user_id: string
          current_streak: number
          longest_streak: number
          last_completed_date: string | null
          total_grace_days_used: number
          updated_at: string
        }
        Insert: {
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_completed_date?: string | null
          total_grace_days_used?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_completed_date?: string | null
          total_grace_days_used?: number
          updated_at?: string
        }
      }
      insights: {
        Row: {
          id: string
          user_id: string
          week_of: string
          completion_rate: number | null
          most_missed_task: string | null
          mood_correlation: number | null
          optimal_completion_time: string | null
          voice_vs_text_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_of: string
          completion_rate?: number | null
          most_missed_task?: string | null
          mood_correlation?: number | null
          optimal_completion_time?: string | null
          voice_vs_text_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_of?: string
          completion_rate?: number | null
          most_missed_task?: string | null
          mood_correlation?: number | null
          optimal_completion_time?: string | null
          voice_vs_text_rate?: number | null
          created_at?: string
        }
      }
    }
  }
}

export interface Task {
  id: string
  name: string
  time_estimate: number
  description: string
}

export interface TaskCategories {
  [category: string]: Task[]
}

export interface CompletedTask {
  completed_at: string
  method: 'voice' | 'text' | 'checkoff'
}

export interface CompletedTasks {
  [taskId: string]: CompletedTask
}
