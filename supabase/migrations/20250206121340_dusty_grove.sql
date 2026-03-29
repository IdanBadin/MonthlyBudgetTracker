/*
  # Add biometric credentials to user preferences

  1. Changes
    - Add biometric_credentials column to user_preferences table as JSONB
    - Default value is NULL
    - Add comment explaining the structure

  2. Security
    - No changes to RLS policies needed as the existing policies cover the new column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'biometric_credentials'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN biometric_credentials JSONB DEFAULT NULL;

    COMMENT ON COLUMN user_preferences.biometric_credentials IS 
    'Stores biometric authentication credentials in format: { credential_id: number[], registered_at: string }';
  END IF;
END $$;