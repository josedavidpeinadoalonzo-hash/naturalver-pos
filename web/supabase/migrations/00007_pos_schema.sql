-- Distribuidora DC - POS Schema additions

-- 1. Add employee info columns to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS employee_role TEXT;

-- 2. Add discount amount for manual discounts
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0;

-- 3. Extend payment_type to include 'pos'
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_type_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_type_check
  CHECK (payment_type IN ('mobile','cash','mixed','credit','pos'));

-- 4. Add business_id if missing (for multi-tenant queries)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- 5. Add index for recent sales queries
CREATE INDEX IF NOT EXISTS idx_sales_business_recent ON sales(business_id, created_at DESC);
