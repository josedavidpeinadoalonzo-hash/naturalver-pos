"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils";
import { X, Check, DollarSign } from "lucide-react";
import type { Debt } from "@/lib/models";

interface DebtPaymentProps {
  debt: Debt;
  onClose: () => void;
  onPaid: () => void;
}

export function DebtPaymentModal({ debt, onClose, onPaid }: DebtPaymentProps) {
  const [amount, setAmount] = useState(debt.remaining_usd);
  const [paymentType, setPaymentType] = useState<"cash" | "mobile" | "mixed">("cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePay() {
    if (amount <= 0) return;
    setSaving(true);
    try {
      const bid = await getTenantBusinessId();
      const rate = Number(localStorage.getItem("bcv_rate") || "0");

      await supabase.from("debt_payments").insert({
        debt_id: debt.id,
        amount_usd: amount,
        amount_bs: amount * rate,
        payment_type: paymentType,
        exchange_rate: rate,
        note,
        business_id: bid,
        created_by: localStorage.getItem("employee_name") || undefined,
      });

      const newPaid = debt.paid_amount_usd + amount;
      const newRemaining = Math.max(0, debt.total_amount_usd - newPaid);
      const newStatus = newRemaining <= 0 ? "paid" : "partial";

      await supabase
        .from("debts")
        .update({
          paid_amount_usd: newPaid,
          remaining_usd: newRemaining,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", debt.id);

      onPaid();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-card p-6 md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Registrar Pago</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/10">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-semibold">{debt.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/10">
            <span className="text-muted-foreground">Deuda total</span>
            <span className="font-semibold">{formatUSD(debt.total_amount_usd)}</span>
          </div>
          <div className="flex justify-between text-sm p-3 rounded-lg bg-muted/10">
            <span className="text-muted-foreground">Pagado</span>
            <span className="font-semibold text-success">{formatUSD(debt.paid_amount_usd)}</span>
          </div>
          <div className="flex justify-between text-sm p-3 rounded-lg bg-warning/10 border border-warning/20">
            <span className="font-medium">Pendiente</span>
            <span className="font-bold text-lg">{formatUSD(debt.remaining_usd)}</span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto a pagar (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                min="0"
                max={debt.remaining_usd}
                step="0.5"
                value={amount || ""}
                onChange={(e) => setAmount(Math.min(debt.remaining_usd, Math.max(0, Number(e.target.value) || 0)))}
                className="w-full rounded-xl border-2 border-border/60 bg-background pl-10 pr-4 py-3 text-lg font-bold font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de pago</label>
            <div className="flex gap-2">
              {(["cash", "mobile", "mixed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPaymentType(t)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    paymentType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t === "cash" ? "Efectivo" : t === "mobile" ? "Pago Móvil" : "Mixto"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nota (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Abono parcial"
              className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handlePay} loading={saving} disabled={amount <= 0}>
          <Check className="h-4 w-4" /> Registrar Pago — {formatUSD(amount)}
        </Button>
      </div>
    </div>
  );
}
