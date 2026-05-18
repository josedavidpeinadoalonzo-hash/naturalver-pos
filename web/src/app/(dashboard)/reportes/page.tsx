"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import type { CompanyConfig } from "@/lib/models";
import { FileBarChart, Download, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatUSD, formatBs, today, weekStart, monthStart, cn } from "@/lib/utils";
import { generateSalesReport, getPeriodLabel } from "@/lib/excel/report";

type Period = "daily" | "weekly" | "monthly";

function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyConfig | null>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    const bId = getTenantBusinessId();
    const { data: comp } = await supabase
      .from("company_config")
      .select("*")
      .eq("business_id", bId)
      .limit(1)
      .single();
    if (comp) setCompany(comp as unknown as CompanyConfig);

    const { start, end } = getDateRange();
    const { data } = await supabase
      .from("sales")
      .select("*")
      .eq("business_id", bId)
      .gte("created_at", start)
      .lte("created_at", end + "T23:59:59.999Z")
      .order("created_at", { ascending: false });
    if (data) setSales(data);
    setLoading(false);
  }

  function getDateRange(): { start: string; end: string } {
    const end = today();
    switch (period) {
      case "daily": return { start: end, end };
      case "weekly": return { start: weekStart(), end };
      case "monthly": return { start: monthStart(), end };
    }
  }

  const totalUSD = sales.reduce((s, sale) => s + Number(sale.total_amount_usd), 0);
  const totalBs = sales.reduce((s, sale) => s + Number(sale.total_amount_bs), 0);
  const totalCash = sales
    .filter((s) => s.payment_type === "cash")
    .reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const totalMobile = sales
    .filter((s) => s.payment_type === "mobile")
    .reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const totalMixed = sales
    .filter((s) => s.payment_type === "mixed")
    .reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const totalCredit = sales
    .filter((s) => s.payment_type === "credit")
    .reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const totalProducts = sales.reduce((sum, s) => sum + s.quantity, 0);

  async function exportExcel() {
    const { start, end } = getDateRange();
    const periodLabel = getPeriodLabel(period, start, end);

    const wb = await generateSalesReport(
      sales,
      periodLabel,
      {
        totalUSD,
        totalBs,
        totalCash,
        totalMobile,
        totalMixed,
        totalCredit,
        transactionCount: sales.length,
        totalProducts,
      },
      {
        name: company?.name || undefined,
        rif: company?.rif || undefined,
        address: company?.address || undefined,
        phone: company?.phone || undefined,
      }
    );

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-ventas-${today()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}
            disabled={sales.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              period === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
            )}>
            <Calendar className="h-4 w-4 inline mr-1" />
            {p === "daily" ? "Hoy" : p === "weekly" ? "Semana" : "Mes"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" accentColor="#2E7D32">
          <CardContent>
            <span className="text-xs text-muted-foreground">Total Ventas</span>
            <p className="text-xl font-bold">{formatUSD(totalUSD)}</p>
          </CardContent>
        </Card>
        <Card variant="elevated" accentColor="#1565C0">
          <CardContent>
            <span className="text-xs text-muted-foreground">Transacciones</span>
            <p className="text-xl font-bold">{sales.length}</p>
          </CardContent>
        </Card>
        <Card variant="elevated" accentColor="#B26A00">
          <CardContent>
            <span className="text-xs text-muted-foreground">Efectivo</span>
            <p className="text-xl font-bold">{formatUSD(totalCash)}</p>
          </CardContent>
        </Card>
        <Card variant="elevated" accentColor="#6B7A70">
          <CardContent>
            <span className="text-xs text-muted-foreground">Pago Móvil</span>
            <p className="text-xl font-bold">{formatUSD(totalMobile)}</p>
          </CardContent>
        </Card>
      </div>

      {totalMixed > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card variant="flat" className="border border-border">
            <CardContent>
              <span className="text-xs text-muted-foreground">Mixto</span>
              <p className="text-lg font-bold">{formatUSD(totalMixed)}</p>
            </CardContent>
          </Card>
          <Card variant="flat" className="border border-border">
            <CardContent>
              <span className="text-xs text-muted-foreground">Crédito</span>
              <p className="text-lg font-bold">{formatUSD(totalCredit)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Productos vendidos: <strong>{totalProducts}</strong>
        {totalBs > 0 && (
          <span className="ml-4">Total en Bs: <strong>{formatBs(totalBs)}</strong></span>
        )}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : sales.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No hay ventas en este período</div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Detalle de Ventas</h3>
          {sales.map((sale) => (
            <Card key={sale.id} variant="flat" className="border border-border">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sale.product_name} - {sale.presentation_name}</p>
                    <span className="text-xs text-muted-foreground">
                      x{sale.quantity} · {sale.payment_type === "cash" ? "Efectivo" : sale.payment_type === "mobile" ? "Pago Móvil" : sale.payment_type === "mixed" ? "Mixto" : "Crédito"}
                      {sale.customer_name && ` · ${sale.customer_name}`}
                    </span>
                  </div>
                  <span className="text-sm font-bold">{formatUSD(Number(sale.total_amount_usd))}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
