"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { cn, formatUSD, formatBs } from "@/lib/utils";
import { X, ShoppingCart, Check, CreditCard } from "lucide-react";

interface PaymentModalProps {
  exchangeRate: number;
  onConfirm: (data: PaymentData) => Promise<void>;
  onClose: () => void;
}

export interface PaymentData {
  paymentType: "cash" | "mobile" | "mixed" | "pos";
  cashUSD: number;
  mobileBS: number;
  customerName: string;
  customerPhone: string;
  paymentNote?: string;
  paymentReference?: string;
  paymentBank?: string;
  cardType?: "debito" | "credito";
}

export function PaymentModal({ exchangeRate, onConfirm, onClose }: PaymentModalProps) {
  const { totalUSD, items, clearCart } = useCart();
  const [paymentType, setPaymentType] = useState<"cash" | "mobile" | "mixed" | "pos">("cash");
  const [cashUSD, setCashUSD] = useState(totalUSD);
  const [mobileBS, setMobileBS] = useState(totalUSD * exchangeRate);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [cardType, setCardType] = useState<"debito" | "credito">("debito");
  const [saving, setSaving] = useState(false);

  const cashDiscount = 0.5;
  const discountApplied = paymentType === "cash";
  const finalUSD = discountApplied ? Math.max(0, totalUSD - cashDiscount) : totalUSD;
  const totalBS = finalUSD * exchangeRate;
  const mixedRemainingUSD = Math.max(0, finalUSD - cashUSD);
  const mixedRemainingBS = Math.max(0, totalBS - mobileBS);

  function handleCashInput(val: string) {
    const n = parseFloat(val) || 0;
    setCashUSD(Math.max(0, Math.min(finalUSD, n)));
  }

  function handleBSInput(val: string) {
    const n = parseFloat(val) || 0;
    setMobileBS(Math.max(0, Math.min(totalBS, n)));
  }

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      let cashAmt = 0;
      let mobileAmt = 0;
      if (paymentType === "cash") {
        cashAmt = finalUSD;
      } else if (paymentType === "mobile") {
        mobileAmt = totalBS;
      } else if (paymentType === "mixed") {
        cashAmt = cashUSD;
        mobileAmt = mobileBS;
      }
      await onConfirm({
        paymentType,
        cashUSD: cashAmt,
        mobileBS: mobileAmt,
        customerName,
        customerPhone,
        paymentReference: paymentType === "pos" ? paymentReference : undefined,
        paymentBank: paymentType === "pos" ? paymentBank : undefined,
        cardType: paymentType === "pos" ? cardType : undefined,
      });
      clearCart();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-card p-6 md:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Cobrar</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items summary */}
        <div className="mb-4 rounded-lg bg-muted/10 p-3 space-y-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate mr-2">
                {item.product.name} {item.presentation.name} x{item.quantity}
              </span>
              <span className="font-medium shrink-0">{formatUSD(item.presentation.priceUSD * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatUSD(totalUSD)}</span>
          </div>
        </div>

        {/* Payment type */}
        <p className="text-xs font-medium text-muted-foreground mb-2">Tipo de Pago</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["cash", "mobile", "mixed", "pos"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPaymentType(type)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                paymentType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {type === "cash" ? "Efectivo" : type === "mobile" ? "Pago Móvil" : type === "mixed" ? "Mixto" : "Punto de Venta"}
            </button>
          ))}
        </div>

        {/* POS details */}
        {paymentType === "pos" && (
          <div className="space-y-3 mb-4 rounded-lg border border-border p-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Número de Aprobación / Lote *
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Ej: APRO-123456"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Banco</label>
              <input
                type="text"
                value={paymentBank}
                onChange={(e) => setPaymentBank(e.target.value)}
                placeholder="Ej: Mercantil"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Tarjeta</label>
              <div className="flex gap-2">
                {(["debito", "credito"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCardType(t)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      cardType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {t === "debito" ? "Débito" : "Crédito"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mixed payment - free amounts */}
        {paymentType === "mixed" && (
          <div className="space-y-3 mb-4 rounded-lg border border-border p-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Efectivo (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={cashUSD || ""}
                  onChange={(e) => handleCashInput(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {mixedRemainingUSD > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Restan {formatUSD(mixedRemainingUSD)} por asignar
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Pago Móvil (Bs)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Bs</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={mobileBS || ""}
                  onChange={(e) => handleBSInput(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {mixedRemainingBS > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Restan {formatBs(mixedRemainingBS)} por asignar
                </p>
              )}
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-xs text-muted-foreground">
              <span>Total USD: {formatUSD(finalUSD)}</span>
              <span>Total Bs: {formatBs(totalBS)}</span>
            </div>
          </div>
        )}

        {/* Cash discount */}
        {paymentType === "cash" && (
          <div className="mb-4 rounded-lg bg-success/5 border border-success/20 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-success font-medium">Descuento por efectivo</span>
              <span className="text-success font-medium">-{formatUSD(cashDiscount)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm">Total a cobrar</span>
              <span className="font-bold">{formatUSD(finalUSD)}</span>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="mb-4 rounded-lg bg-muted/10 p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total a cobrar:</span>
            <span className="text-xl font-bold">{formatUSD(finalUSD)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>En Bs (tasa {exchangeRate}):</span>
            <span>{formatBs(totalBS)}</span>
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-4 space-y-2">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre del cliente (opcional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button fullWidth size="lg" onClick={handleConfirm} loading={saving}
          disabled={paymentType === "pos" && !paymentReference.trim()}>
          <Check className="h-4 w-4" /> Confirmar Venta — {formatUSD(finalUSD)}
        </Button>
      </div>
    </div>
  );
}
