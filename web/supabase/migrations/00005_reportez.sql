-- NaturalVer's - Reporte Z / SENIAT Fiscal Fields

-- 1. Add fiscal fields to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS control_number TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS rif_cliente TEXT DEFAULT '';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS iva_percentage NUMERIC(5,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS iva_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS exempt_amount NUMERIC(12,2) DEFAULT 0;

-- 2. Add document_type to sales (01=Factura, 02=NotaCrédito)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT '01';

-- 3. Index for monthly queries
CREATE INDEX IF NOT EXISTS idx_sales_invoice_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_fiscal ON purchase_orders(invoice_date);
