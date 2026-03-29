/*
  # Add Biometric Authentication Support

  1. New Columns
    - `biometric_credentials` (jsonb): Stores biometric authentication credentials
      - Format: { credential_id: number[], registered_at: string }
    - `biometric_settings` (jsonb): Stores biometric authentication settings
      - Format: { loginEnabled: boolean, backupEnabled: boolean }

  2. Changes
    - Add new columns to user_preferences table
    - Set default values for biometric settings
    - Add column comments for documentation
*/

-- Add biometric credentials column if it doesn't exist
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

-- Add biometric settings column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'biometric_settings'
  ) THEN
    ALTER TABLE user_preferences 
    ADD COLUMN biometric_settings JSONB DEFAULT '{"loginEnabled": false, "backupEnabled": false}'::jsonb;

    COMMENT ON COLUMN user_preferences.biometric_settings IS 
    'Stores biometric settings in format: { loginEnabled: boolean, backupEnabled: boolean }';
  END IF;
END $$;

-- Update existing rows to have default biometric settings
UPDATE user_preferences 
SET biometric_settings = '{"loginEnabled": false, "backupEnabled": false}'::jsonb 
WHERE biometric_settings IS NULL;