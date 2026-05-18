-- NaturalVer's - Invoice Sequence (atomic counter to prevent race conditions)

-- Table to track per-business, per-year invoice sequences
CREATE TABLE IF NOT EXISTS invoice_sequences (
  business_id UUID NOT NULL,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  last_sequence INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (business_id, year)
);

-- Function to atomically increment and return the next sequence number
CREATE OR REPLACE FUNCTION increment_invoice_sequence(p_business_id UUID, p_year INT DEFAULT EXTRACT(YEAR FROM NOW()))
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  next_seq INT;
BEGIN
  INSERT INTO invoice_sequences (business_id, year, last_sequence, updated_at)
  VALUES (p_business_id, p_year, 1, NOW())
  ON CONFLICT (business_id, year)
  DO UPDATE SET last_sequence = invoice_sequences.last_sequence + 1, updated_at = NOW()
  RETURNING last_sequence INTO next_seq;
  RETURN next_seq;
END;
$$;
