/*
  # Add Notification Settings Table
  
  ## Overview
  This migration adds support for customizable push notifications in the LifeReset app.
  Users can configure morning and evening reminders with custom times.
  
  ## New Table: notification_settings
  - `user_id` (uuid) - Primary key, references auth.users
  - `notifications_enabled` (boolean) - Master toggle for all notifications
  - `morning_notification_enabled` (boolean) - Toggle for morning reminder
  - `morning_notification_time` (time) - Time for morning notification (default: 07:00)
  - `evening_notification_enabled` (boolean) - Toggle for evening reminder
  - `evening_notification_time` (time) - Time for evening notification (default: 20:00)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Row Level Security (RLS) enabled
  - Users can only access their own notification settings
*/

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled boolean DEFAULT true,
  morning_notification_enabled boolean DEFAULT true,
  morning_notification_time time DEFAULT '07:00:00',
  evening_notification_enabled boolean DEFAULT true,
  evening_notification_time time DEFAULT '20:00:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings"
  ON notification_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
