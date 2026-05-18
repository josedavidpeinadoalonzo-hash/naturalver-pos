-- Fix legacy product prices
-- Before the IVA-base-price fix, priceUSD stored final price (IVA incluido).
-- The system now expects priceUSD to store base price (sin IVA).
-- This migration divides priceUSD by (1 + iva_percent/100) for non-exento presentations.
-- Run ONCE after deploying the IVA fix to production.

DO $$
DECLARE
  iva_rate NUMERIC := 16;
  iva_factor NUMERIC;
  config_val TEXT;
  prod RECORD;
  pres_item JSONB;
  updated_pres JSONB;
  is_exento BOOLEAN;
  old_price NUMERIC;
  new_price NUMERIC;
  total_fixed INT := 0;
  total_skipped INT := 0;
BEGIN
  SELECT value INTO config_val FROM business_config WHERE key = 'iva_percent' LIMIT 1;
  IF config_val IS NOT NULL AND config_val != '' THEN
    iva_rate := config_val::NUMERIC;
  END IF;
  iva_factor := 1 + iva_rate / 100;

  FOR prod IN SELECT id, presentations, name FROM products LOOP
    updated_pres := '[]'::JSONB;
    FOR pres_item IN SELECT * FROM jsonb_array_elements(prod.presentations) LOOP
      is_exento := COALESCE((pres_item->>'exento')::BOOLEAN, false);
      old_price := (pres_item->>'priceUSD')::NUMERIC;
      IF is_exento OR old_price = 0 THEN
        updated_pres := updated_pres || pres_item;
        total_skipped := total_skipped + 1;
      ELSE
        new_price := ROUND((old_price / iva_factor)::NUMERIC, 2);
        pres_item := jsonb_set(pres_item, '{priceUSD}', to_jsonb(new_price));
        updated_pres := updated_pres || pres_item;
        total_fixed := total_fixed + 1;
      END IF;
    END LOOP;
    UPDATE products SET presentations = updated_pres, updated_at = now() WHERE id = prod.id;
  END LOOP;

  RAISE NOTICE 'Migration complete: % presentations fixed, % skipped (exento/zero)', total_fixed, total_skipped;
END $$;
