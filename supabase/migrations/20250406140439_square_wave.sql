/*
  # Add Data Retention Setting

  1. Changes
    - Add data_retention_months column to profiles table
    - Set default value to 6 months
    - Update existing profiles to use default value

  2. Security
    - No changes to RLS policies needed as this uses existing profile policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'data_retention_months'
  ) THEN
    ALTER TABLE profiles ADD COLUMN data_retention_months integer DEFAULT 6;
    
    -- Update existing rows to have the default value
    UPDATE profiles SET data_retention_months = 6 WHERE data_retention_months IS NULL;
  END IF;
END $$;