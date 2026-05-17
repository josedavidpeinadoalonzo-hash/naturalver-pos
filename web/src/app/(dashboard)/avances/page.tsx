"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { getStoredBCVRate } from "@/lib/services/exchange-rate";
import { CreditCard, Plus, History, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUSD, formatBs, formatDate, cn } from "@/lib/utils";

function AvancesPage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amountUSD, setAmountUSD] = useState("");
  const [commissionPct, setCommissionPct] = useState("15");
  const [cardType, setCardType] = useState<"debito" | "credito">("debito");
  const [bankName, setBankName] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [saving, setSaving] = useState(false);

  const exchangeRate = getStoredBCVRate();
  const amt = Number(amountUSD) || 0;
  const commPct = Number(commissionPct) || 0;
  const commUSD = amt * (commPct / 100);
  const totalChargeUSD = amt + commUSD;
  const cashDeliveredBS = amt * exchangeRate;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const bId = getTenantBusinessId();
    const { data } = await supabase
      .from("cash_advances")
      .select("*")
      .eq("business_id", bId)
      .order("created_at", { ascending: false });
    if (data) setAdvances(data);
    setLoading(false);
  }

  async function handleSave() {
    if (amt <= 0 || !approvalCode.trim()) return;
    setSaving(true);
    try {
      await supabase.from("cash_advances").insert({
        business_id: getTenantBusinessId(),
        amount_requested_usd: amt,
        commission_percent: commPct,
        commission_usd: commUSD,
        total_charge_usd: totalChargeUSD,
        exchange_rate: exchangeRate,
        cash_delivered_bs: cashDeliveredBS,
        bank_card_type: cardType,
        bank_name: bankName.trim(),
        approval_code: approvalCode.trim(),
        created_at: new Date().toISOString(),
      });
      setShowForm(false);
      setAmountUSD("");
      setApprovalCode("");
      loadData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avance de Efectivo</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      <Card variant="elevated" accentColor="#E65100">
        <CardContent className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-warning">
            <Info className="h-4 w-4" />
            <span className="font-medium">¿Cómo funciona?</span>
          </div>
          <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
            <li>Pasas la tarjeta del cliente por el POS del banco</li>
            <li>El banco aprueba y deposita en tu cuenta bancaria</li>
            <li>Tú entregas Bs en efectivo al cliente</li>
            <li>La comisión (opcional 10-20%) es tu ganancia</li>
          </ol>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Monto solicitado (USD)</label>
              <input type="number" step="0.01" min="0" value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Comisión % <span className="text-[10px]">(opcional 10-20%)</span></label>
              <input type="number" step="1" min="0" max="100" value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo de Tarjeta</label>
              <div className="mt-1 flex gap-2">
                {(["debito", "credito"] as const).map((t) => (
                  <button key={t} onClick={() => setCardType(t)}
                    className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      cardType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    )}>
                    {t === "debito" ? "Débito" : "Crédito"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Banco</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej: Mercantil"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Código de Aprobación *</label>
              <input type="text" value={approvalCode} onChange={(e) => setApprovalCode(e.target.value)}
                placeholder="Ej: APRO-789012"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {amt > 0 && (
              <div className="rounded-lg bg-muted/10 p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Cliente solicita:</span><span>{formatUSD(amt)}</span></div>
                <div className="flex justify-between text-warning"><span>Comisión ({commPct}%):</span><span>{formatUSD(commUSD)}</span></div>
                <div className="flex justify-between"><span>Total a pasar por POS:</span><span className="font-bold">{formatUSD(totalChargeUSD)}</span></div>
                <div className="flex justify-between border-t border-border pt-1"><span>Efectivo a entregar:</span><span className="font-bold">{formatBs(cashDeliveredBS)} @ {exchangeRate.toFixed(2)}</span></div>
              </div>
            )}

            <Button fullWidth onClick={handleSave} loading={saving}
              disabled={amt <= 0 || !approvalCode.trim()}>
              <CreditCard className="h-4 w-4" /> Registrar Avance
            </Button>
          </CardContent>
        </Card>
      )}

      <h2 className="font-semibold text-sm flex items-center gap-2">
        <History className="h-4 w-4" /> Historial
      </h2>

      {loading ? (
        <div className="py-4 text-center text-sm text-muted-foreground">Cargando...</div>
      ) : advances.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Sin avances registrados</div>
      ) : (
        <div className="space-y-2">
          {advances.map((a) => (
            <Card key={a.id} variant="flat" className="border border-border">
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">${Number(a.amount_requested_usd).toFixed(2)} · {a.bank_name || "s/banco"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.bank_card_type === "debito" ? "Débito" : "Crédito"} · Apr: {a.approval_code}
                      {a.commission_percent > 0 && ` · Com: ${a.commission_percent}%`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatBs(Number(a.cash_delivered_bs))}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(a.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvancesPage;
