import { readFileSync } from "fs";

const PROJECT = "trnbgsixswqniiuusgdh";
const TOKEN = process.env.SUPABASE_SERVICE_KEY;

async function runSQL(label, sql) {
  console.log(`Running: ${label}...`);
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    console.error(`FAILED ${label}:`, res.status, text.slice(0, 500));
    return false;
  }
  console.log(`OK ${label}:`, text.slice(0, 200));
  return true;
}

const steps = [
  {
    label: "1-create-tables",
    sql: `
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        rif TEXT DEFAULT '',
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        logo_url TEXT DEFAULT '',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS business_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(business_id, key)
      );
    `,
  },
  {
    label: "2-add-columns",
    sql: `
      ALTER TABLE products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE debts ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE debt_payments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE cash_closes ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE templates ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE company_config ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
    `,
  },
  {
    label: "3-insert-businesses",
    sql: `
      INSERT INTO businesses (name, slug) VALUES
        ('Distribuidora DC', 'bodega-derwin'),
        ('Heladería', 'heladeria'),
        ('Kiosco', 'kiosco')
      ON CONFLICT (slug) DO NOTHING;
    `,
  },
  {
    label: "4-backfill",
    sql: `
      DO $$
      DECLARE
        v_business_id UUID;
      BEGIN
        SELECT id INTO v_business_id FROM businesses WHERE slug = 'bodega-derwin' LIMIT 1;
        UPDATE products SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE sales SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE debts SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE debt_payments SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE expenses SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE cash_closes SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE customers SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE templates SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE company_config SET business_id = v_business_id WHERE business_id IS NULL;
        UPDATE employees SET business_id = v_business_id WHERE business_id IS NULL;
      END $$;
    `,
  },
  {
    label: "5-not-null",
    sql: `
      ALTER TABLE products ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE sales ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE debts ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE debt_payments ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE expenses ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE cash_closes ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE customers ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE templates ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE company_config ALTER COLUMN business_id SET NOT NULL;
      ALTER TABLE employees ALTER COLUMN business_id SET NOT NULL;
    `,
  },
  {
    label: "6-indexes-config",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
      CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
      CREATE INDEX IF NOT EXISTS idx_debts_business ON debts(business_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
      CREATE INDEX IF NOT EXISTS idx_cash_closes_business ON cash_closes(business_id);
      DROP INDEX IF EXISTS idx_company_config_single;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_company_config_business ON company_config(business_id);
    `,
  },
  {
    label: "7-default-config",
    sql: `
      INSERT INTO business_config (business_id, key, value)
      SELECT id, 'currency', '"USD"'::jsonb FROM businesses
      ON CONFLICT (business_id, key) DO NOTHING;
      INSERT INTO business_config (business_id, key, value)
      SELECT id, 'iva_percent', '16'::jsonb FROM businesses
      ON CONFLICT (business_id, key) DO NOTHING;
    `,
  },
];

async function main() {
  for (const step of steps) {
    const ok = await runSQL(step.label, step.sql);
    if (!ok) {
      console.error(`Stopped at step: ${step.label}`);
      process.exit(1);
    }
  }
  console.log("All steps completed!");
}

main();
