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