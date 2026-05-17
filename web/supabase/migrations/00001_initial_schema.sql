-- NaturalVer's - Initial Schema
-- Run this in Supabase SQL Editor

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  presentations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  presentation_id TEXT NOT NULL,
  presentation_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('mobile','cash','mixed','credit')),
  total_amount_usd NUMERIC(12,2) DEFAULT 0,
  total_amount_bs NUMERIC(12,2) DEFAULT 0,
  exchange_rate NUMERIC(10,2) DEFAULT 0,
  mobile_amount_bs NUMERIC(12,2) DEFAULT 0,
  cash_amount_usd NUMERIC(12,2) DEFAULT 0,
  is_wholesale BOOLEAN DEFAULT false,
  wholesale_discount NUMERIC(5,2) DEFAULT 0,
  customer_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  debt_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  sale_id UUID,
  product_name TEXT NOT NULL,
  total_amount_usd NUMERIC(12,2) DEFAULT 0,
  paid_amount_usd NUMERIC(12,2) DEFAULT 0,
  remaining_usd NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','partial','paid')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Debt Payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
  amount_usd NUMERIC(12,2) DEFAULT 0,
  amount_bs NUMERIC(12,2) DEFAULT 0,
  payment_type TEXT CHECK (payment_type IN ('mobile','cash','mixed')),
  exchange_rate NUMERIC(10,2) DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transporte','mercancia','servicios','alquiler','empaque','otro')),
  amount_usd NUMERIC(12,2) DEFAULT 0,
  amount_bs NUMERIC(12,2) DEFAULT 0,
  exchange_rate NUMERIC(10,2) DEFAULT 0,
  payment_type TEXT CHECK (payment_type IN ('mobile','cash','mixed')),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cash Closes
CREATE TABLE IF NOT EXISTS cash_closes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance_usd NUMERIC(12,2) DEFAULT 0,
  closing_balance_usd NUMERIC(12,2) DEFAULT 0,
  total_sales_usd NUMERIC(12,2) DEFAULT 0,
  total_sales_bs NUMERIC(12,2) DEFAULT 0,
  total_expenses_usd NUMERIC(12,2) DEFAULT 0,
  total_debt_collected_usd NUMERIC(12,2) DEFAULT 0,
  net_profit_usd NUMERIC(12,2) DEFAULT 0,
  cash_in_hand NUMERIC(12,2) DEFAULT 0,
  mobile_balance NUMERIC(12,2) DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  exchange_rate NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  id_card TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('payment','location','greeting','other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company Config (single row)
CREATE TABLE IF NOT EXISTS company_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT '',
  rif TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo_url TEXT DEFAULT ''
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_type ON sales(payment_type);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_closes_date ON cash_closes(date);
