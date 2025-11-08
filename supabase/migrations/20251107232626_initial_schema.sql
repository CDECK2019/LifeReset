/*
  # 30-Day Life Reset App - Initial Schema

  ## Overview
  This migration creates the core database structure for a habit tracking and personal development app
  focused on 30-day transformation programs.

  ## New Tables Created
  
  ### 1. users_profile
  - `id` (uuid, references auth.users) - Links to Supabase auth
  - `timezone` (text) - User's timezone for time-aware features
  - `current_program_id` (uuid) - Active program reference
  - `grace_days_used` (integer) - Tracks grace days consumed (default 2)
  - `voice_enabled` (boolean) - Voice feature toggle
  - `streak_start_date` (date) - When current streak began
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. programs
  - `id` (uuid) - Primary key
  - `name` (text) - Program name (e.g., "Miracle Morning", "75 Hard Lite")
  - `description` (text) - Program overview
  - `duration_days` (integer) - Length of program (typically 30)
  - `task_categories` (jsonb) - Structured task data by category
  - `is_custom` (boolean) - User-created vs template
  - `is_template` (boolean) - Available as starting template
  - `created_by` (uuid) - User who created (null for system templates)
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. daily_logs
  - `id` (uuid) - Primary key
  - `user_id` (uuid) - Owner reference
  - `program_id` (uuid) - Associated program
  - `program_day` (integer) - Day number in program (1-30)
  - `date` (date) - Actual calendar date
  - `tasks_completed` (jsonb) - Completed task details with timestamps
  - `tasks_missed` (text[]) - Array of missed task IDs
  - `reflection_text` (text) - Written reflection
  - `reflection_audio_url` (text) - Audio recording URL
  - `mood_rating` (integer) - 1-5 scale
  - `energy_rating` (integer) - 1-5 scale
  - `progress_photo_url` (text) - Photo upload URL
  - `is_grace_day` (boolean) - Grace day flag
  - `completed_at` (timestamptz) - When day was marked complete
  - `created_at` (timestamptz) - Log creation time

  ### 4. streaks
  - `user_id` (uuid) - Owner reference
  - `current_streak` (integer) - Active consecutive days
  - `longest_streak` (integer) - Personal best
  - `last_completed_date` (date) - Most recent completion
  - `total_grace_days_used` (integer) - Lifetime grace days
  - `updated_at` (timestamptz) - Last update time

  ### 5. insights
  - `id` (uuid) - Primary key
  - `user_id` (uuid) - Owner reference
  - `week_of` (date) - Week start date
  - `completion_rate` (float) - Weekly completion percentage
  - `most_missed_task` (text) - Task with lowest completion
  - `mood_correlation` (float) - Mood vs completion correlation
  - `optimal_completion_time` (time) - Best performance time
  - `voice_vs_text_rate` (float) - Voice vs text completion comparison
  - `created_at` (timestamptz) - Insight generation time

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - System templates are publicly readable
  - Authenticated users required for all operations

  ## Indexes
  - Optimized for date-based queries
  - User lookup performance
  - Program day searches
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Profile Table
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text DEFAULT 'UTC',
  current_program_id uuid,
  grace_days_used integer DEFAULT 2,
  voice_enabled boolean DEFAULT false,
  streak_start_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Programs Table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  duration_days integer DEFAULT 30,
  task_categories jsonb DEFAULT '{}'::jsonb,
  is_custom boolean DEFAULT false,
  is_template boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view template programs"
  ON programs FOR SELECT
  TO authenticated
  USING (is_template = true OR created_by = auth.uid());

CREATE POLICY "Users can create custom programs"
  ON programs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_custom = true);

CREATE POLICY "Users can update own custom programs"
  ON programs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND is_custom = true)
  WITH CHECK (created_by = auth.uid() AND is_custom = true);

CREATE POLICY "Users can delete own custom programs"
  ON programs FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND is_custom = true);

-- Daily Logs Table
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  program_day integer NOT NULL,
  date date NOT NULL,
  tasks_completed jsonb DEFAULT '{}'::jsonb,
  tasks_missed text[] DEFAULT ARRAY[]::text[],
  reflection_text text,
  reflection_audio_url text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  energy_rating integer CHECK (energy_rating >= 1 AND energy_rating <= 5),
  progress_photo_url text,
  is_grace_day boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily logs"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs"
  ON daily_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Streaks Table
CREATE TABLE IF NOT EXISTS streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_completed_date date,
  total_grace_days_used integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insights Table
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_of date NOT NULL,
  completion_rate float,
  most_missed_task text,
  mood_correlation float,
  optimal_completion_time time,
  voice_vs_text_rate float,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_of)
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_program ON daily_logs(program_id, program_day);
CREATE INDEX IF NOT EXISTS idx_programs_template ON programs(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_insights_user_week ON insights(user_id, week_of DESC);

-- Add foreign key constraint to users_profile
ALTER TABLE users_profile 
  ADD CONSTRAINT fk_current_program 
  FOREIGN KEY (current_program_id) 
  REFERENCES programs(id) 
  ON DELETE SET NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();