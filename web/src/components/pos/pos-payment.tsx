"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { Button } from "@/components/ui/button";
import { cn, formatUSD, formatBs } from "@/lib/utils";
import { X, Check, Search, Users, Banknote, Smartphone, CreditCard, Shuffle } from "lucide-react";

interface PosPaymentProps {
  exchangeRate: number;
  cashDiscount?: number;
  onConfirm: (data: PosPaymentData) => Promise<void>;
  onClose: () => void;
  totalWithIVA?: number;
  ivaAmount?: number;
}

export interface PosPaymentData {
  paymentType: "cash" | "mobile" | "pos" | "mixed";
  cashUSD: number;
  mobileBS: number;
  customerName: string;
  customerRif?: string;
  customerEmail?: string;
  paymentReference?: string;
  paymentBank?: string;
  cardType?: "debito" | "credito";
  generateInvoice?: boolean;
}

const PAYMENT_OPTIONS = [
  { type: "cash" as const, label: "Efectivo", icon: Banknote, color: "from-green-500 to-green-600" },
  { type: "mobile" as const, label: "Pago Móvil", icon: Smartphone, color: "from-blue-500 to-blue-600" },
  { type: "pos" as const, label: "Punto de Venta", icon: CreditCard, color: "from-purple-500 to-purple-600" },
  { type: "mixed" as const, label: "Mixto", icon: Shuffle, color: "from-orange-500 to-orange-600" },
];

export function PosPayment({ exchangeRate, cashDiscount = 0, onConfirm, onClose, totalWithIVA, ivaAmount }: PosPaymentProps) {
  const { totalUSD, clearCart } = useCart();
  const effectiveTotal = totalWithIVA !== undefined ? totalWithIVA : totalUSD;
  const [paymentType, setPaymentType] = useState<"cash" | "mobile" | "pos" | "mixed">("cash");
  const [cashReceived, setCashReceived] = useState(effectiveTotal);
  const [mobileBS, setMobileBS] = useState(effectiveTotal * exchangeRate);
  const [customerName, setCustomerName] = useState("");
  const [customerRif, setCustomerRif] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [cardType, setCardType] = useState<"debito" | "credito">("debito");
  const [saving, setSaving] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const customerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showCustomerSearch || !customerQuery.trim()) {
      setCustomerResults([]);
      return;
    }
    if (customerTimerRef.current) clearTimeout(customerTimerRef.current);
    customerTimerRef.current = setTimeout(async () => {
      const bid = getTenantBusinessId();
      const q = customerQuery.trim();
      const { data } = await supabase
        .from("customers")
        .select("id, name, id_card, phone, email")
        .eq("business_id", bid)
        .or(`name.ilike.%${q}%,id_card.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10);
      setCustomerResults(data || []);
    }, 200);
  }, [customerQuery, showCustomerSearch]);

  function selectCustomer(c: any) {
    setCustomerName(c.name);
    setCustomerRif(c.id_card || "");
    setCustomerEmail(c.email || "");
    setShowCustomerSearch(false);
    setCustomerQuery("");
  }

  const discount = paymentType === "cash" ? (cashDiscount || 0) : 0;
  const finalUSD = Math.max(0, effectiveTotal - discount);
  const totalBS = finalUSD * exchangeRate;
  const change = Math.max(0, cashReceived - finalUSD);

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      let cashAmt = 0;
      let mobileAmt = 0;
      if (paymentType === "cash") cashAmt = finalUSD;
      else if (paymentType === "mobile") mobileAmt = totalBS;
      else if (paymentType === "mixed") {
        cashAmt = Math.min(finalUSD, cashReceived);
        mobileAmt = totalBS - (cashAmt * exchangeRate);
      }
      await onConfirm({
        paymentType,
        cashUSD: cashAmt,
        mobileBS: mobileAmt,
        customerName,
        customerRif: customerRif.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentReference: paymentType === "pos" ? paymentReference : undefined,
        paymentBank: paymentType === "pos" ? paymentBank : undefined,
        cardType: paymentType === "pos" ? cardType : undefined,
        generateInvoice: generateInvoice || undefined,
      });
      clearCart();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-card md:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 px-6 py-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Cobrar</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Total display */}
          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total a cobrar</p>
            <p className="text-4xl font-bold tabular-nums tracking-tight">{formatUSD(finalUSD)}</p>
            {ivaAmount !== undefined && ivaAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Base: {formatUSD(finalUSD - ivaAmount)} + IVA: {formatUSD(ivaAmount)}
              </p>
            )}
            {exchangeRate > 0 && (
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                Bs. {formatBs(totalBS)} <span className="text-xs text-muted-foreground/60">@ {exchangeRate.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Payment type */}
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_OPTIONS.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  setPaymentType(type);
                  if (type === "cash") setCashReceived(finalUSD);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all",
                  paymentType === type
                    ? `bg-gradient-to-b ${color} text-white border-transparent shadow-lg scale-105`
                    : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/10"
                )}
              >
                <Icon className={cn("h-5 w-5", paymentType === type ? "" : "text-muted-foreground")} />
                {label}
              </button>
            ))}
          </div>

          {/* Cash received + change */}
          {paymentType === "cash" && (
            <div className="space-y-3 rounded-xl bg-muted/10 p-4 border border-border/40">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Recibido (USD)
                </label>
                <input
                  type="number"
                  min={finalUSD}
                  step="0.5"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(Math.max(finalUSD, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-center text-2xl font-bold tabular-nums font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              {cashReceived >= finalUSD && (
                <div className="flex items-center justify-between rounded-xl bg-success/10 border border-success/20 p-3.5">
                  <span className="text-sm font-semibold text-success">Cambio</span>
                  <span className="text-2xl font-bold text-success tabular-nums font-mono">{formatUSD(change)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-success font-semibold">Descuento efectivo</span>
                    <span className="text-success font-bold">-{formatUSD(discount)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile */}
          {paymentType === "mobile" && (
            <div className="rounded-xl bg-muted/10 p-4 border border-border/40">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Monto en Bs</label>
              <div className="rounded-xl bg-primary/5 p-4 text-center border border-primary/20">
                <span className="text-3xl font-bold tabular-nums font-mono">{formatBs(totalBS)}</span>
              </div>
            </div>
          )}

          {/* POS details */}
          {paymentType === "pos" && (
            <div className="space-y-3 rounded-xl border-2 border-border/60 p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detalles de la transacción</h3>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Número de Aprobación / Lote *
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej: APRO-123456"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Banco</label>
                <input
                  type="text"
                  value={paymentBank}
                  onChange={(e) => setPaymentBank(e.target.value)}
                  placeholder="Ej: Mercantil"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                        "flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                        cardType === t
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t === "debito" ? "Débito" : "Crédito"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mixed */}
          {paymentType === "mixed" && (
            <div className="space-y-3 rounded-xl bg-muted/10 p-4 border border-border/40">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Efectivo (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(Math.max(0, Math.min(finalUSD, Number(e.target.value) || 0)))}
                  className="w-full rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Pago Móvil (Bs)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={mobileBS || ""}
                  onChange={(e) => setMobileBS(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Customer section */}
          <div className="space-y-2 rounded-xl bg-muted/5 p-4 border border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</label>
              <button
                onClick={() => { setShowCustomerSearch(!showCustomerSearch); setCustomerQuery(""); }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Users className="h-3.5 w-3.5" /> {showCustomerSearch ? "Cerrar" : "Buscar"}
              </button>
            </div>

            {showCustomerSearch && (
              <div className="mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Nombre, RIF o teléfono..."
                    className="w-full rounded-lg border-2 border-border/60 bg-background pl-10 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>
                {customerResults.length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border-2 border-border/60 bg-card shadow-lg">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 border-b border-border/40 last:border-0 transition-colors"
                      >
                        <span className="font-semibold">{c.name}</span>
                        {c.id_card && <span className="ml-2 text-xs text-muted-foreground font-mono">{c.id_card}</span>}
                        {c.phone && <span className="ml-2 text-xs text-muted-foreground">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {customerQuery && customerResults.length === 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Sin resultados</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={customerRif}
                onChange={(e) => setCustomerRif(e.target.value.toUpperCase())}
                placeholder="RIF"
                className="w-1/3 rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                className="flex-1 rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Email para factura (opcional)"
                className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Invoice toggle */}
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3 border border-primary/20">
            <input
              type="checkbox"
              id="generateInvoice"
              checked={generateInvoice}
              onChange={(e) => setGenerateInvoice(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="generateInvoice" className="text-sm font-medium cursor-pointer select-none">
              Generar factura electrónica
            </label>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleConfirm}
            loading={saving}
            disabled={paymentType === "pos" && !paymentReference.trim()}
            className="!py-4 text-base"
          >
            <Check className="h-5 w-5" /> Confirmar Venta — {formatUSD(finalUSD)}
          </Button>
        </div>
      </div>
    </div>
  );
}
