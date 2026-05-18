"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import { getStoredBCVRate } from "@/lib/services/exchange-rate";
import { DollarSign, Plus, ArrowDownUp, History, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { formatUSD, formatBs, formatDate, cn } from "@/lib/utils";

type CurrencyType = "usd_purchase" | "cop_purchase";

function DivisasPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<CurrencyType>("usd_purchase");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const bId = getTenantBusinessId();
    const { data } = await supabase
      .from("currency_purchases")
      .select("*")
      .eq("business_id", bId)
      .order("created_at", { ascending: false });
    if (data) setPurchases(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta operación de divisa?")) return;
    await supabase.from("currency_purchases").delete().eq("id", id);
    loadData();
  }

  async function handleSave() {
    if (!amount || !rate) return;
    setSaving(true);
    try {
      const amt = Number(amount);
      const rt = Number(rate);
      await supabase.from("currency_purchases").insert({
        business_id: getTenantBusinessId(),
        type,
        amount_received: amt,
        exchange_rate_manual: rt,
        total_bs_paid: amt * rt,
        paid_from: "caja_bs",
        created_at: new Date().toISOString(),
      });
      setShowForm(false);
      setAmount("");
      setRate("");
      loadData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compra de Divisas</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </div>

      <Card variant="elevated" accentColor="#1565C0">
        <CardContent className="text-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <ArrowDownUp className="h-4 w-4" />
            <span className="font-medium">Sin comisión — tasa manual que pactes con el cliente</span>
          </div>
          <p className="text-xs text-muted-foreground">
            El sistema registra la operación: descuenta Bs de caja, suma a tu posición en USD/COP.
          </p>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {(["usd_purchase", "cop_purchase"] as const).map((t) => (
                <button key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}>
                  {t === "usd_purchase" ? "Comprar USD" : "Comprar COP"}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Monto a recibir ({type === "usd_purchase" ? "USD" : "COP"})
              </label>
              <input type="number" step="0.01" min="0" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Tasa pactada (Bs por {type === "usd_purchase" ? "USD" : "COP"})
              </label>
              <input type="number" step="0.01" min="0" value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {amount && rate && (
              <div className="rounded-lg bg-muted/10 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Recibes:</span>
                  <span className="font-bold">{type === "usd_purchase" ? formatUSD(Number(amount)) : `${Number(amount).toLocaleString()} COP`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagas en Bs:</span>
                  <span className="font-bold">{formatBs(Number(amount) * Number(rate))}</span>
                </div>
              </div>
            )}
            <Button fullWidth onClick={handleSave} loading={saving}
              disabled={!amount || !rate}>
              <DollarSign className="h-4 w-4" /> Registrar Compra
            </Button>
          </CardContent>
        </Card>
      )}

      <h2 className="font-semibold flex items-center gap-2 text-sm">
        <History className="h-4 w-4" /> Historial
      </h2>

      {loading ? (
        <SkeletonList count={3} />
      ) : purchases.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Sin operaciones registradas</div>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <Card key={p.id} variant="flat" className="border border-border">
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {p.type === "usd_purchase" ? "Compra USD" : "Compra COP"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {p.type === "usd_purchase" ? formatUSD(Number(p.amount_received)) : `${Number(p.amount_received).toLocaleString()} COP`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Tasa: {Number(p.exchange_rate_manual).toFixed(2)} · Pagaste: {formatBs(Number(p.total_bs_paid))}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-danger transition-colors ml-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default DivisasPage;
