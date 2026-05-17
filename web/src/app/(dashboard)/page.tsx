"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { tenantQuery, getTenantBusinessId } from "@/lib/tenant-query";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Wallet,
  Receipt,
  PiggyBank,
  RefreshCw,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSD, formatBs } from "@/lib/utils";

const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

function DashboardPage() {
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingDebts, setPendingDebts] = useState(0);
  const [topProduct, setTopProduct] = useState("");
  const [recentSales, setRecentSales] = useState<{ name: string; amount: number; time: string }[]>([]);

  async function loadData() {
    try {
      const rate = localStorage.getItem("bcv_rate");
      if (rate) setExchangeRate(Number(rate));

      // Sales today
      const businessId = getTenantBusinessId();
      const { data: sales } = await supabase
        .from("sales")
        .select("total_amount_usd, product_name, created_at")
        .eq("business_id", businessId)
        .gte("created_at", todayStart)
        .order("created_at", { ascending: false });
      if (sales) {
        setTotalSales(sales.reduce((sum, s) => sum + Number(s.total_amount_usd), 0));
        setSalesCount(sales.length);

        // Top product
        const counts: Record<string, number> = {};
        for (const s of sales) {
          counts[s.product_name] = (counts[s.product_name] || 0) + 1;
        }
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (top) setTopProduct(top[0]);

        // Recent 5
        setRecentSales(
          sales.slice(0, 5).map((s) => ({
            name: s.product_name,
            amount: Number(s.total_amount_usd),
            time: new Date(s.created_at).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
          }))
        );
      }

      // Pending debts
      const { count: debtCount } = await supabase
        .from("debts")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .neq("status", "paid");
      if (debtCount !== null) setPendingDebts(debtCount);

      // Low stock
      const { data: products } = await supabase
        .from("products")
        .select("presentations")
        .eq("business_id", businessId);
      if (products) {
        let count = 0;
        for (const p of products) {
          for (const pres of (p.presentations as any[]) || []) {
            if (pres.stock <= (pres.lowStockThreshold || 5)) count++;
          }
        }
        setLowStockCount(count);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Refresh every 30s
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function refreshRate() {
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
      const data = await res.json();
      const r = data?.promedio || 0;
      setExchangeRate(r);
      localStorage.setItem("bcv_rate", String(r));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Tasa: {exchangeRate > 0 ? `Bs ${exchangeRate.toFixed(2)}` : "---"}</span>
          <button onClick={refreshRate} className="p-1 hover:text-foreground transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-2 text-success mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Ventas Hoy</span>
            </div>
            <p className="text-2xl font-bold">{formatUSD(totalSales)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {salesCount} transacción{salesCount !== 1 ? "es" : ""}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-2 text-warning mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Stock Bajo</span>
            </div>
            <p className="text-2xl font-bold">{lowStockCount}</p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-2 text-danger mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Deudas Pendientes</span>
            </div>
            <p className="text-2xl font-bold">{pendingDebts}</p>
          </CardContent>
        </Card>

        {topProduct ? (
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Star className="h-4 w-4" />
                <span className="text-xs font-medium">Top Hoy</span>
              </div>
              <p className="text-lg font-bold leading-tight truncate">{topProduct}</p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center gap-2 text-primary mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Ganancia Neta</span>
              </div>
              <p className="text-2xl font-bold">---</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent sales + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent sales */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Ventas Recientes</h2>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin ventas hoy</p>
            ) : (
              <div className="space-y-2">
                {recentSales.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-sm truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.time}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">{formatUSD(s.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <Link href="/ventas/rapida">
            <Card variant="elevated" className="hover:scale-[1.02] transition-transform cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <ShoppingCart className="h-7 w-7 text-primary" />
                <span className="font-semibold text-sm">POS</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/ventas/mayor">
            <Card variant="elevated" className="hover:scale-[1.02] transition-transform cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <Package className="h-7 w-7 text-warning" />
                <span className="font-semibold text-sm">Venta al Mayor</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/deudas">
            <Card variant="elevated" className="hover:scale-[1.02] transition-transform cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <Wallet className="h-7 w-7 text-danger" />
                <span className="font-semibold text-sm">Deudas (Fiao)</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/cierre">
            <Card variant="elevated" className="hover:scale-[1.02] transition-transform cursor-pointer">
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <PiggyBank className="h-7 w-7 text-primary" />
                <span className="font-semibold text-sm">Cierre de Caja</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Cargando datos...
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
