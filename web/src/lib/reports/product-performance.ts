import { supabase } from "@/lib/supabase/client";

export interface ProductPerformance {
  topSellers: { name: string; quantity: number; revenue: number }[];
  slowMovers: { name: string; quantity: number; revenue: number }[];
  categoryBreakdown: Record<string, { quantity: number; revenue: number }>;
}

export async function generateProductPerformance(businessId: string, days = 30): Promise<ProductPerformance> {
  const startDate = new Date(Date.now() - days * 86400000).toISOString();

  const { data: sales } = await supabase
    .from("sales")
    .select("product_name, quantity, total_amount_usd, product_id")
    .eq("business_id", businessId)
    .gte("created_at", startDate);

  if (!sales || sales.length === 0) {
    return { topSellers: [], slowMovers: [], categoryBreakdown: {} };
  }

  const productStats: Record<string, { quantity: number; revenue: number }> = {};
  for (const s of sales) {
    if (!productStats[s.product_name]) {
      productStats[s.product_name] = { quantity: 0, revenue: 0 };
    }
    productStats[s.product_name].quantity += s.quantity || 1;
    productStats[s.product_name].revenue += Number(s.total_amount_usd) || 0;
  }

  const sorted = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity);

  return {
    topSellers: sorted.slice(0, 10),
    slowMovers: sorted.reverse().slice(0, 10),
    categoryBreakdown: {},
  };
}
