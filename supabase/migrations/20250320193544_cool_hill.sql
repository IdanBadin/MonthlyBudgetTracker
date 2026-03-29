/*
  # Add Internal Transfers Support

  1. New Tables
    - `internal_transfers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `from_account` (text)
      - `to_account` (text)
      - `description` (text)
      - `date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on internal_transfers table
    - Add policies for authenticated users
*/

DO $$ 
BEGIN
  -- Create table if it doesn't exist
  CREATE TABLE IF NOT EXISTS internal_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    from_account text NOT NULL,
    to_account text NOT NULL,
    description text,
    date date NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  -- Enable RLS
  ALTER TABLE internal_transfers ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'internal_transfers' 
    AND policyname = 'Users can view own internal transfers'
  ) THEN
    CREATE POLICY "Users can view own internal transfers"
      ON internal_transfers FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'internal_transfers' 
    AND policyname = 'Users can insert own internal transfers'
  ) THEN
    CREATE POLICY "Users can insert own internal transfers"
      ON internal_transfers FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'internal_transfers' 
    AND policyname = 'Users can update own internal transfers'
  ) THEN
    CREATE POLICY "Users can update own internal transfers"
      ON internal_transfers FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'internal_transfers' 
    AND policyname = 'Users can delete own internal transfers'
  ) THEN
    CREATE POLICY "Users can delete own internal transfers"
      ON internal_transfers FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Add audit trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_internal_transfers'
  ) THEN
    CREATE TRIGGER audit_internal_transfers
      AFTER INSERT OR UPDATE OR DELETE ON internal_transfers
      FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();
  END IF;

END $$;