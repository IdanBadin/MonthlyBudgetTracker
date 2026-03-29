/*
  # Add Dashboard Settings Column

  1. Changes
    - Add dashboard_settings column to profiles table
    - Set default value with showBalance and compactView settings
    - Update existing rows with default settings

  2. Security
    - No changes to RLS policies needed as this uses existing profile policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'dashboard_settings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN dashboard_settings jsonb DEFAULT '{"showBalance": true, "compactView": false}'::jsonb;
    
    -- Update existing rows to have the default dashboard settings
    UPDATE profiles SET dashboard_settings = '{"showBalance": true, "compactView": false}'::jsonb WHERE dashboard_settings IS NULL;
  END IF;
END $$;