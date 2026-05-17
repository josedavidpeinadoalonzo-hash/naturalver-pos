import { supabase } from "@/lib/supabase/client";

export interface IVADashboard {
  month: string;
  ivaCollected: number;
  ivaPaid: number;
  ivaBalance: number;
  taxableSales: number;
  exemptSales: number;
  ivaRate: number;
}

export async function generateIVADashboard(businessId: string, year: number, month: number): Promise<IVADashboard> {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data: config } = await supabase
    .from("business_config")
    .select("value")
    .eq("business_id", businessId)
    .eq("key", "iva_percent")
    .single();

  const ivaRate = config ? Number((config.value as any)?.iva_percent || 16) : 16;

  const { data: sales } = await supabase
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: purchases } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const ivaCollected = (sales || []).reduce((s, sale) => s + (Number(sale.iva_amount) || 0), 0);
  const ivaPaid = (purchases || []).reduce((s, p) => s + (Number(p.iva_total) || 0), 0);
  const taxableSales = (sales || []).reduce((s, sale) => s + (Number(sale.taxable_amount) || 0), 0);
  const exemptSales = (sales || []).reduce((s, sale) => s + (Number(sale.exempt_amount) || 0), 0);

  return {
    month: `${year}-${String(month).padStart(2, "0")}`,
    ivaCollected,
    ivaPaid,
    ivaBalance: ivaCollected - ivaPaid,
    taxableSales,
    exemptSales,
    ivaRate,
  };
}
