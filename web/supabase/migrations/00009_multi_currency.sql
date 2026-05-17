-- Multi-currency support: exchange rate history
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  currency_from TEXT NOT NULL,
  currency_to TEXT NOT NULL,
  rate NUMERIC(14,6) NOT NULL,
  source TEXT DEFAULT 'api',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_date ON exchange_rate_history(business_id, date);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_currency ON exchange_rate_history(business_id, currency_from, currency_to);
