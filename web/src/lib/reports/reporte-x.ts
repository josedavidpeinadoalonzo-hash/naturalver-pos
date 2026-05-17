import { supabase } from "@/lib/supabase/client";

const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

export interface XReport {
  date: string;
  totalSalesUSD: number;
  salesCount: number;
  byPaymentType: Record<string, { count: number; total: number }>;
  averageTicket: number;
  peakHour: string;
}

export async function generateXReport(businessId: string): Promise<XReport> {
  const { data: sales } = await supabase
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: true });

  const byPaymentType: Record<string, { count: number; total: number }> = {};
  let totalUSD = 0;

  for (const s of sales || []) {
    const amt = Number(s.total_amount_usd) || 0;
    totalUSD += amt;
    const key = s.payment_type || "unknown";
    if (!byPaymentType[key]) byPaymentType[key] = { count: 0, total: 0 };
    byPaymentType[key].count += s.quantity || 1;
    byPaymentType[key].total += amt;
  }

  return {
    date: new Date().toISOString(),
    totalSalesUSD: totalUSD,
    salesCount: sales?.length || 0,
    byPaymentType,
    averageTicket: sales?.length ? totalUSD / sales.length : 0,
    peakHour: "---",
  };
}
