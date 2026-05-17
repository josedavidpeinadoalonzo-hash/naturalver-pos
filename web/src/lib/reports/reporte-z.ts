import { supabase } from "@/lib/supabase/client";
import { buildReceipt, type ReceiptLine } from "@/lib/escpos/printer";

const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

export interface ZReport {
  date: string;
  businessName: string;
  businessRif: string;
  openingBalance: number;
  totalSalesUSD: number;
  totalSalesBS: number;
  salesCount: number;
  byPaymentType: Record<string, { count: number; total: number }>;
  totalExpenses: number;
  totalProfit: number;
  exchangeRate: number;
}

export async function generateZReport(businessId: string): Promise<ZReport> {
  const { data: config } = await supabase
    .from("company_config")
    .select("*")
    .eq("business_id", businessId)
    .single();

  const { data: sales } = await supabase
    .from("sales")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", todayStart);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", businessId)
    .gte("created_at", todayStart);

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

  const totalExpenses = (expenses || []).reduce((s, e) => s + (Number(e.amount_usd) || 0), 0);
  const rate = Number(localStorage.getItem("bcv_rate") || "0");

  return {
    date: new Date().toISOString(),
    businessName: config?.name || "",
    businessRif: config?.rif || "",
    openingBalance: 0,
    totalSalesUSD: totalUSD,
    totalSalesBS: totalUSD * rate,
    salesCount: sales?.length || 0,
    byPaymentType,
    totalExpenses,
    totalProfit: totalUSD - totalExpenses,
    exchangeRate: rate,
  };
}

export function buildZReportReceipt(report: ZReport): Uint8Array {
  const lines: ReceiptLine[] = [];

  lines.push({ text: "REPORTE Z", center: true, bold: true, double: true });
  lines.push({ text: report.businessName, center: true });
  if (report.businessRif) lines.push({ text: `RIF: ${report.businessRif}`, center: true });
  lines.push({ text: new Date(report.date).toLocaleString(), center: true });
  lines.push({ text: "═".repeat(32), center: true });
  lines.push({ text: "" });

  lines.push({ text: `Ventas totales: $${report.totalSalesUSD.toFixed(2)}`, bold: true });
  lines.push({ text: `Bs: ${report.totalSalesBS.toFixed(2)} @ ${report.exchangeRate.toFixed(2)}` });
  lines.push({ text: `Transacciones: ${report.salesCount}` });
  lines.push({ text: "" });

  lines.push({ text: "-- Por tipo de pago --" });
  for (const [type, data] of Object.entries(report.byPaymentType)) {
    lines.push({ text: `  ${type}: ${data.count} · $${data.total.toFixed(2)}` });
  }

  lines.push({ text: "" });
  lines.push({ text: `Gastos:         $${report.totalExpenses.toFixed(2)}` });
  lines.push({ text: `GANANCIA NETA:  $${report.totalProfit.toFixed(2)}`, bold: true });
  lines.push({ text: "" });
  lines.push({ text: "═".repeat(32), center: true });
  lines.push({ text: "Documento no fiscal", center: true });
  lines.push({ text: "" });

  return buildReceipt(lines);
}
