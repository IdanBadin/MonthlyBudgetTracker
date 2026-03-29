/*
  # Add onboarding status column

  1. Changes
    - Add has_completed_onboarding column to profiles table with default value false
    - Update existing profiles to have has_completed_onboarding set to false

  2. Security
    - No changes to RLS policies needed as the column is covered by existing policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'has_completed_onboarding'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_completed_onboarding boolean DEFAULT false;
    
    -- Update existing rows to have the default value
    UPDATE profiles SET has_completed_onboarding = false WHERE has_completed_onboarding IS NULL;
  END IF;
END $$;