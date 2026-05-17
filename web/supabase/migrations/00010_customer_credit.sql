-- Customer credit control
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS current_balance NUMERIC(12,2) DEFAULT 0;

-- Link debts to customers via FK
ALTER TABLE debts ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Add payment tracking fields for debts
ALTER TABLE debt_payments ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE debt_payments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
