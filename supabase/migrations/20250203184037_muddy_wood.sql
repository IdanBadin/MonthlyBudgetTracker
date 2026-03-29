/*
  # Two-Factor Authentication Setup
  
  1. New Tables
    - `two_factor_auth`: Stores 2FA settings per user
    - `two_factor_attempts`: Tracks authentication attempts
  
  2. Security
    - Enable RLS on both tables
    - Add policies for user access
    - Implement encryption for sensitive data
  
  3. Features
    - Support for TOTP and SMS methods
    - Encrypted storage of secrets and phone numbers
    - Backup codes support
    - Attempt tracking
*/

-- Create extension for encryption if not exists
CREATE EXTENSION IF NOT EXISTS "pgsodium";

-- Create Two-Factor Authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    secret_key text,
    backup_codes text[],
    enabled boolean DEFAULT false,
    method text CHECK (method IN ('totp', 'sms')),
    phone_number text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create Two-Factor Attempts table
CREATE TABLE IF NOT EXISTS two_factor_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    attempt_date timestamptz DEFAULT now(),
    ip_address text,
    successful boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for two_factor_auth
CREATE POLICY "Users can view own 2FA settings"
    ON two_factor_auth FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
    ON two_factor_auth FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings"
    ON two_factor_auth FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for two_factor_attempts
CREATE POLICY "Users can view own 2FA attempts"
    ON two_factor_attempts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA attempts"
    ON two_factor_attempts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_two_factor_auth_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
DECLARE
    encryption_key bytea = auth.uid()::text::bytea;
    context bytea = 'two_factor_auth'::text::bytea;
BEGIN
    IF NEW.secret_key IS NOT NULL THEN
        NEW.secret_key = encode(
            pgsodium.crypto_aead_det_encrypt(
                NEW.secret_key::bytea,
                context,
                encryption_key
            ),
            'base64'
        );
    END IF;
    
    IF NEW.phone_number IS NOT NULL THEN
        NEW.phone_number = encode(
            pgsodium.crypto_aead_det_encrypt(
                NEW.phone_number::bytea,
                context,
                encryption_key
            ),
            'base64'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for encrypting sensitive data
CREATE TRIGGER encrypt_two_factor_auth_data
    BEFORE INSERT OR UPDATE OF secret_key, phone_number ON two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_sensitive_data();

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(
    encrypted_data text,
    encryption_context text,
    user_id uuid
) RETURNS text AS $$
BEGIN
    RETURN convert_from(
        pgsodium.crypto_aead_det_decrypt(
            decode(encrypted_data, 'base64'),
            encryption_context::bytea,
            user_id::text::bytea
        ),
        'UTF8'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create views for decrypted data access
CREATE OR REPLACE VIEW decrypted_two_factor_auth AS
    SELECT 
        id,
        user_id,
        CASE 
            WHEN secret_key IS NOT NULL THEN 
                decrypt_sensitive_data(secret_key, 'two_factor_auth', user_id)
            ELSE NULL 
        END as secret_key,
        backup_codes,
        enabled,
        method,
        CASE 
            WHEN phone_number IS NOT NULL THEN 
                decrypt_sensitive_data(phone_number, 'two_factor_auth', user_id)
            ELSE NULL 
        END as phone_number,
        created_at,
        updated_at
    FROM two_factor_auth;

-- Grant access to the view
GRANT SELECT ON decrypted_two_factor_auth TO authenticated;