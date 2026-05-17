-- Employees table for PIN-based login
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add employee_name to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS employee_role TEXT;
