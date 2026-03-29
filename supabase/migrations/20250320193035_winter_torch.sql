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

-- Create internal_transfers table
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

-- Create policies
CREATE POLICY "Users can view own internal transfers"
  ON internal_transfers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own internal transfers"
  ON internal_transfers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own internal transfers"
  ON internal_transfers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own internal transfers"
  ON internal_transfers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add audit trigger
CREATE TRIGGER audit_internal_transfers
  AFTER INSERT OR UPDATE OR DELETE ON internal_transfers
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();