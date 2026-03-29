/*
  # Add Advanced Features Schema

  1. New Tables
    - `dashboard_layouts`: Stores user dashboard customization
    - `audit_logs`: Tracks changes to transactions and user settings
    - `user_preferences`: Stores extended user preferences including theme colors
    - `data_backups`: Manages automatic backups of user data

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Dashboard Layouts Table
CREATE TABLE dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  layout jsonb NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- User Preferences Table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  theme_colors jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#10B981"}',
  advanced_search_filters jsonb DEFAULT '[]',
  dashboard_settings jsonb DEFAULT '{"showBalance": true, "compactView": false}',
  backup_frequency text DEFAULT 'weekly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Data Backups Table
CREATE TABLE data_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  backup_data jsonb NOT NULL,
  backup_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;

-- Dashboard Layouts Policies
CREATE POLICY "Users can view own dashboard layouts"
  ON dashboard_layouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dashboard layouts"
  ON dashboard_layouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard layouts"
  ON dashboard_layouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard layouts"
  ON dashboard_layouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Data Backups Policies
CREATE POLICY "Users can view own backups"
  ON data_backups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups"
  ON data_backups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON data_backups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create user preferences
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user preferences
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Function to track changes
CREATE OR REPLACE FUNCTION public.create_audit_log_entry()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    changes
  )
  VALUES (
    COALESCE(auth.uid(), OLD.user_id, NEW.user_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', row_to_json(NEW)::jsonb)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb)
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', row_to_json(OLD)::jsonb)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log triggers
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_dashboard_layouts
  AFTER INSERT OR UPDATE OR DELETE ON dashboard_layouts
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_user_preferences
  AFTER INSERT OR UPDATE OR DELETE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();