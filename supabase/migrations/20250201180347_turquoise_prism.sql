/*
  # Add language field to profiles table

  1. Changes
    - Add language column to profiles table with default value 'en'
    - Update existing rows to have the default language value

  2. Notes
    - Default language is English ('en')
    - Supported languages: English ('en') and Hebrew ('he')
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'en';
    
    -- Update existing rows to have the default language
    UPDATE profiles SET language = 'en' WHERE language IS NULL;
  END IF;
END $$;