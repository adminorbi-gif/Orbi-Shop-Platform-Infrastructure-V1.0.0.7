-- Migration: Create password_reset_tokens table
-- Run this migration in your Supabase/Postgres instance before relying on DB-backed password reset flow.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens USING btree (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_customer_id ON password_reset_tokens USING btree (customer_id);
