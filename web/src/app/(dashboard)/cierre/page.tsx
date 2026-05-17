"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import { getStoredBCVRate } from "@/lib/services/exchange-rate";
import { PiggyBank, DollarSign, TrendingUp, ArrowDownUp, CreditCard, Globe, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSD, formatBs, today } from "@/lib/utils";

function CashClosePage() {
  const [exchangeRate, setExchangeRate] = useState(getStoredBCVRate());
  const [openingBs, setOpeningBs] = useState(0);
  const [openingUSD, setOpeningUSD] = useState(0);
  const [openingCOP, setOpeningCOP] = useState(0);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [currencyPurchases, setCurrencyPurchases] = useState<any[]>([]);
  const [cashAdvances, setCashAdvances] = useState<any[]>([]);
  const [localPurchases, setLocalPurchases] = useState<any[]>([]);
  const [colombiaPurchases, setColombiaPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const bId = getTenantBusinessId();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startISO = todayStart.toISOString();

    const [
      { data: s },
      { data: e },
      { data: cp },
      { data: ca },
      { data: lp },
      { data: col },
    ] = await Promise.all([
      supabase.from("sales").select("*").eq("business_id", bId).gte("created_at", startISO),
      supabase.from("expenses").select("*").eq("business_id", bId).gte("created_at", startISO),
      supabase.from("currency_purchases").select("*").eq("business_id", bId).gte("created_at", startISO),
      supabase.from("cash_advances").select("*").eq("business_id", bId).gte("created_at", startISO),
      supabase.from("purchase_orders").select("*").eq("business_id", bId).gte("created_at", startISO),
      supabase.from("colombia_purchases").select("*").eq("business_id", bId).gte("created_at", startISO),
    ]);

    if (s) setSales(s);
    if (e) setExpenses(e);
    if (cp) setCurrencyPurchases(cp);
    if (ca) setCashAdvances(ca);
    if (lp) setLocalPurchases(lp);
    if (col) setColombiaPurchases(col);
    setLoading(false);
  }

  // === SALES BREAKDOWN ===
  const salesCashUSD = sales.filter(s => s.payment_type === "cash" || s.payment_type === "mixed")
    .reduce((sum, s) => sum + Number(s.cash_amount_usd || 0), 0);
  const salesMobileBS = sales.filter(s => s.payment_type === "mobile" || s.payment_type === "mixed")
    .reduce((sum, s) => sum + Number(s.mobile_amount_bs || 0), 0);
  const salesPOS = sales.filter(s => s.payment_type === "pos")
    .reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const salesCredit = sales.filter(s => s.payment_type === "credit")
    .reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const totalSalesUSD = sales.reduce((sum, s) => sum + Number(s.total_amount_usd), 0);
  const salesCount = sales.length;

  // === CURRENCY PURCHASES ===
  const usdPurchased = currencyPurchases
    .filter(cp => cp.type === "usd_purchase")
    .reduce((sum, cp) => sum + Number(cp.amount_received), 0);
  const copPurchased = currencyPurchases
    .filter(cp => cp.type === "cop_purchase")
    .reduce((sum, cp) => sum + Number(cp.amount_received), 0);
  const totalBsPaidForCurrency = currencyPurchases
    .reduce((sum, cp) => sum + Number(cp.total_bs_paid), 0);

  // === CASH ADVANCES ===
  const totalAdvancesBs = cashAdvances.reduce((sum, a) => sum + Number(a.cash_delivered_bs), 0);
  const totalCommissionUSD = cashAdvances.reduce((sum, a) => sum + Number(a.commission_usd), 0);
  const totalCommissionBS = totalCommissionUSD * exchangeRate;

  // === PURCHASES ===
  const totalLocalPurchasesBs = localPurchases.reduce((sum, p) => sum + Number(p.total_with_iva) * exchangeRate, 0);
  const totalColombiaPurchasesBs = colombiaPurchases.reduce((sum, p) => sum + Number(p.total_bs), 0);

  // === EXPENSES ===
  const totalExpensesUSD = expenses.reduce((sum, e) => sum + Number(e.amount_usd), 0);
  const totalExpensesBS = totalExpensesUSD * exchangeRate;

  // === NET ===
  const netBs = (salesMobileBS + totalCommissionBS) - (totalBsPaidForCurrency + totalAdvancesBs + totalLocalPurchasesBs + totalColombiaPurchasesBs + totalExpensesBS);
  const netUSD = salesCashUSD + salesPOS - totalExpensesUSD;

  async function handleClose() {
    setSaving(true);
    try {
      await supabase.from("cash_closes").insert({
        business_id: getTenantBusinessId(),
        date: today(),
        opening_balance_usd: openingUSD,
        total_sales_usd: totalSalesUSD,
        total_expenses_usd: totalExpensesUSD,
        total_sales_bs: salesMobileBS,
        net_profit_usd: totalSalesUSD - totalExpensesUSD + totalCommissionUSD,
        cash_in_hand: openingUSD + salesCashUSD,
        mobile_balance: salesMobileBS,
        sales_count: salesCount,
        exchange_rate: exchangeRate,
        status: "closed",
        created_at: new Date().toISOString(),
      });
      setClosed(true);
    } finally {
      setSaving(false);
    }
  }

  if (closed) {
    return (
      <div className="flex flex-col items-center py-12 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <PiggyBank className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Cierre Exitoso</h2>
        <p className="text-sm text-muted-foreground">Ganancia neta del día</p>
        <p className="text-lg font-bold">{formatUSD(totalSalesUSD - totalExpensesUSD + totalCommissionUSD)}</p>
        <Button onClick={() => setClosed(false)}>Nuevo Cierre</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Cargando datos del día...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cierre de Caja</h1>

      {/* Opening balances */}
      <Card>
        <CardContent className="space-y-2">
          <h3 className="text-sm font-medium mb-2">Balance Inicial</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Bs</label>
              <input type="number" value={openingBs} onChange={(e) => setOpeningBs(Number(e.target.value))}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">USD</label>
              <input type="number" step="0.01" value={openingUSD} onChange={(e) => setOpeningUSD(Number(e.target.value))}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">COP</label>
              <input type="number" value={openingCOP} onChange={(e) => setOpeningCOP(Number(e.target.value))}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales */}
      <SectionCard title="VENTAS DEL DÍA" icon={<TrendingUp className="h-4 w-4" />} color="text-success">
        <Row label="Efectivo Bs" value={formatBs(salesMobileBS)} />
        <Row label="Efectivo USD" value={formatUSD(salesCashUSD)} />
        <Row label="Punto de Venta" value={formatUSD(salesPOS)} />
        <Row label="Crédito (Fiao)" value={formatUSD(salesCredit)} />
        <Row label={`Total (${salesCount} transacciones)`} value={formatUSD(totalSalesUSD)} bold />
      </SectionCard>

      {/* Currency Purchases */}
      <SectionCard title="COMPRA DE DIVISAS" icon={<ArrowDownUp className="h-4 w-4" />} color="text-primary">
        {currencyPurchases.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">Sin operaciones hoy</p>
        ) : (
          <>
            {usdPurchased > 0 && <Row label="USD comprados" value={`$${usdPurchased.toFixed(2)}`} />}
            {copPurchased > 0 && <Row label="COP comprados" value={`$${copPurchased.toFixed(0)} COP`} />}
            <Row label="Total pagado en Bs" value={formatBs(totalBsPaidForCurrency)} bold />
          </>
        )}
      </SectionCard>

      {/* Cash Advances */}
      <SectionCard title="AVANCES DE EFECTIVO" icon={<CreditCard className="h-4 w-4" />} color="text-warning">
        {cashAdvances.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">Sin avances hoy</p>
        ) : (
          <>
            <Row label="Efectivo entregado" value={formatBs(totalAdvancesBs)} />
            <Row label="Comisiones ganadas" value={`${formatUSD(totalCommissionUSD)} / ${formatBs(totalCommissionBS)}`} />
          </>
        )}
      </SectionCard>

      {/* Purchases */}
      <SectionCard title="INVERSIÓN MERCANCÍA" icon={<FileText className="h-4 w-4" />} color="text-danger">
        {localPurchases.length === 0 && colombiaPurchases.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">Sin compras hoy</p>
        ) : (
          <>
            {totalLocalPurchasesBs > 0 && <Row label="Compra local" value={formatBs(totalLocalPurchasesBs)} />}
            {totalColombiaPurchasesBs > 0 && <Row label="Compra Colombia" value={formatBs(totalColombiaPurchasesBs)} />}
          </>
        )}
      </SectionCard>

      {/* Expenses */}
      <SectionCard title="GASTOS" icon={<DollarSign className="h-4 w-4" />} color="text-danger">
        {expenses.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">Sin gastos hoy</p>
        ) : (
          <Row label="Total gastos" value={formatUSD(totalExpensesUSD)} bold />
        )}
      </SectionCard>

      {/* NET POSITION */}
      <Card variant="elevated" accentColor="#1565C0">
        <CardContent className="space-y-2">
          <h3 className="text-sm font-bold text-primary">POSICIÓN FINAL</h3>
          <div className="border-t border-border pt-2 space-y-1 text-sm">
            <Row label="Posición Bs" value={formatBs(openingBs + netBs)} bold />
            <Row label="Posición USD" value={formatUSD(openingUSD + netUSD)} bold />
            <Row label="Posición COP" value={`${(openingCOP + copPurchased).toLocaleString()} COP`} bold />
          </div>
          <div className="border-t border-border pt-2">
            <Row label="Ganancia Neta del Día" value={formatUSD(totalSalesUSD - totalExpensesUSD + totalCommissionUSD)} bold />
          </div>
        </CardContent>
      </Card>

      <Button fullWidth size="lg" onClick={handleClose} loading={saving}>
        <PiggyBank className="h-4 w-4" /> Ejecutar Cierre
      </Button>
    </div>
  );
}

function SectionCard({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <Card variant="flat" className="border border-border">
      <CardContent className="space-y-1">
        <div className={`flex items-center gap-2 ${color} mb-1`}>
          {icon}
          <span className="text-xs font-semibold tracking-wide">{title}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}

export default CashClosePage;
