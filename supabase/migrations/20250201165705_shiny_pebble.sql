/*
  # Add starting balance table

  1. New Tables
    - `starting_balances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `month` (date, represents the first day of the month)
      - `amount` (numeric, the starting balance)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `starting_balances` table
    - Add policies for authenticated users to manage their own starting balances
*/

-- Create starting_balances table
CREATE TABLE IF NOT EXISTS starting_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  month date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE starting_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own starting balances"
  ON starting_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own starting balances"
  ON starting_balances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own starting balances"
  ON starting_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own starting balances"
  ON starting_balances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);