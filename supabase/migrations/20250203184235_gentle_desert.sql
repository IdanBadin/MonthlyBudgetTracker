/*
  # Add theme colors to profiles table

  1. Changes
    - Add theme_colors column to profiles table with default values
    - Update existing rows with default theme colors
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'theme_colors'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_colors jsonb DEFAULT '{"primary": "#3B82F6", "secondary": "#10B981"}'::jsonb;
    
    -- Update existing rows to have the default theme colors
    UPDATE profiles SET theme_colors = '{"primary": "#3B82F6", "secondary": "#10B981"}'::jsonb WHERE theme_colors IS NULL;
  END IF;
END $$;