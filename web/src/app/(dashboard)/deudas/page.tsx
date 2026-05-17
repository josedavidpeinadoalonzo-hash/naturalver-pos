"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { tenantQuery, getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import type { Debt } from "@/lib/models";
import { Wallet, Plus, Filter, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatUSD } from "@/lib/utils";

function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "partial" | "paid">("pending");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    setLoading(true);
    const bId = getTenantBusinessId();
    const { data } = await supabase.from("debts").select("*").eq("business_id", bId).order("created_at", { ascending: false });
    if (data) setDebts(data as unknown as Debt[]);
    setLoading(false);
  }

  const filtered = debts.filter((d) => filter === "all" || d.status === filter);
  const totalPending = debts
    .filter((d) => d.status !== "paid")
    .reduce((sum, d) => sum + d.remaining_usd, 0);

  const statusColors: Record<string, string> = {
    pending: "text-danger bg-danger/10",
    partial: "text-warning bg-warning/10",
    paid: "text-success bg-success/10",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deudas (Fiao)</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </div>

      <Card variant="elevated" accentColor="#C62828">
        <CardContent>
          <div className="flex items-center gap-2 text-danger mb-1">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Total Pendiente</span>
          </div>
          <p className="text-2xl font-bold">{formatUSD(totalPending)}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["pending", "partial", "paid", "all"] as const).map((f) => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
            )}>
            {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "partial" ? "Con Abonos" : "Pagados"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No hay deudas</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((debt) => (
            <Card key={debt.id} variant="elevated">
              <CardContent>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{debt.customer_name}</h3>
                    <span className="text-xs text-muted-foreground">{debt.product_name}</span>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[debt.status])}>
                    {debt.status === "pending" ? "Pendiente" : debt.status === "partial" ? "Abonando" : "Pagado"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total: <strong>{formatUSD(debt.total_amount_usd)}</strong></span>
                  <span>Restante: <strong className="text-danger">{formatUSD(debt.remaining_usd)}</strong></span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted/20 overflow-hidden">
                  <div className="h-full rounded-full bg-success"
                    style={{ width: `${Math.min(100, (debt.paid_amount_usd / debt.total_amount_usd) * 100)}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center"
          onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-card p-6 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Nueva Deuda</h2>
            <DebtForm onSave={() => { setShowForm(false); loadDebts(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function DebtForm({ onSave }: { onSave: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !amount) return;
    setSaving(true);
    const usd = Number(amount);
    await tenantInsert("debts", {
      customer_name: name.trim(),
      customer_phone: phone.trim() || null,
      product_name: product.trim() || "General",
      total_amount_usd: usd,
      paid_amount_usd: 0,
      remaining_usd: usd,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    onSave();
  }

  return (
    <div className="space-y-3">
      <input type="text" placeholder="Nombre del cliente" value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      <input type="text" placeholder="Teléfono (opcional)" value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      <input type="text" placeholder="Producto/Concepto" value={product}
        onChange={(e) => setProduct(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      <div>
        <label className="text-xs font-medium text-muted-foreground">Monto Total (USD)</label>
        <input type="number" step="0.01" min="0" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <Button fullWidth onClick={handleSave} loading={saving}>
        <DollarSign className="h-4 w-4" /> Registrar Deuda
      </Button>
    </div>
  );
}

export default DebtsPage;
