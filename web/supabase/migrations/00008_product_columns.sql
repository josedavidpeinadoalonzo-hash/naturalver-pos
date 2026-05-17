-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS exchange_rate_cop NUMERIC(12,8) DEFAULT 0;
