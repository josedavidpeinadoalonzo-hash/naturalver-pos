-- NaturalVer's - New Modules: Purchase Orders, Colombia, Currency, Advances

-- 1. Punto de Venta payment reference in sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_bank TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS card_type TEXT CHECK (card_type IN ('debito','credito'));

-- 2. Purchase Orders (local suppliers, with IVA)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  supplier_name TEXT NOT NULL,
  supplier_rif TEXT DEFAULT '',
  invoice_number TEXT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]',
  total_with_iva NUMERIC(12,2) DEFAULT 0,
  total_without_iva NUMERIC(12,2) DEFAULT 0,
  iva_total NUMERIC(12,2) DEFAULT 0,
  exchange_rate NUMERIC(10,2) DEFAULT 0,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_business ON purchase_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(invoice_date);

-- 3. Colombia Purchases (non-declared)
CREATE TABLE IF NOT EXISTS colombia_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  supplier_name TEXT DEFAULT '',
  invoice_number TEXT DEFAULT '',
  total_cop NUMERIC(12,2) DEFAULT 0,
  exchange_rate_cop_usd NUMERIC(12,8) DEFAULT 0,
  exchange_rate_usd_bs NUMERIC(10,2) DEFAULT 0,
  total_usd NUMERIC(12,2) DEFAULT 0,
  total_bs NUMERIC(12,2) DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colombia_purchases_business ON colombia_purchases(business_id);

-- 4. Currency Purchases (compra de divisas)
CREATE TABLE IF NOT EXISTS currency_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  type TEXT NOT NULL CHECK (type IN ('usd_purchase','cop_purchase')),
  amount_received NUMERIC(12,2) DEFAULT 0,
  exchange_rate_manual NUMERIC(12,2) DEFAULT 0,
  total_bs_paid NUMERIC(12,2) DEFAULT 0,
  paid_from TEXT DEFAULT 'caja_bs',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_currency_purchases_business ON currency_purchases(business_id);

-- 5. Cash Advances (avance de efectivo)
CREATE TABLE IF NOT EXISTS cash_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  amount_requested_usd NUMERIC(12,2) DEFAULT 0,
  commission_percent NUMERIC(5,2) DEFAULT 0,
  commission_usd NUMERIC(12,2) DEFAULT 0,
  total_charge_usd NUMERIC(12,2) DEFAULT 0,
  exchange_rate NUMERIC(10,2) DEFAULT 0,
  cash_delivered_bs NUMERIC(12,2) DEFAULT 0,
  bank_card_type TEXT CHECK (bank_card_type IN ('debito','credito')),
  bank_name TEXT DEFAULT '',
  approval_code TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_advances_business ON cash_advances(business_id);
