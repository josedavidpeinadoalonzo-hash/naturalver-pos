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
  customerName?: string;
  customerRif?: string;
}

export type PosPaymentType =
  | "efectivo_bs"
  | "efectivo_usd"
  | "pago_movil"
  | "punto_venta"
  | "tarjeta_credito"
  | "transferencia"
  | "divisas"
  | "mixto";

export interface PosPaymentData {
  paymentType: PosPaymentType;
  cashUSD: number;
  cashBS: number;
  mobileBS: number;
  receivedBS: number;
  receivedUSD: number;
  divisaType?: "EUR" | "COP";
  divisaRate?: number;
  divisaAmount?: number;
  customerName: string;
  customerRif?: string;
  customerEmail?: string;
  paymentReference?: string;
  paymentBank?: string;
  paymentPhone?: string;
  cardType?: "debito" | "credito";
  generateInvoice?: boolean;
}

const PAYMENT_OPTIONS: { type: PosPaymentType; label: string; icon: typeof Banknote; color: string }[] = [
  { type: "efectivo_bs", label: "Efectivo Bs", icon: Banknote, color: "from-emerald-600 to-emerald-700" },
  { type: "efectivo_usd", label: "Efectivo \$", icon: Banknote, color: "from-green-500 to-green-600" },
  { type: "pago_movil", label: "Pago Móvil", icon: Smartphone, color: "from-blue-500 to-blue-600" },
  { type: "punto_venta", label: "Pto. Venta", icon: CreditCard, color: "from-purple-500 to-purple-600" },
  { type: "tarjeta_credito", label: "Crédito", icon: CreditCard, color: "from-violet-500 to-violet-600" },
  { type: "transferencia", label: "Transfer.", icon: Smartphone, color: "from-cyan-500 to-cyan-600" },
  { type: "divisas", label: "Divisas", icon: Banknote, color: "from-amber-500 to-amber-600" },
  { type: "mixto", label: "Mixto", icon: Shuffle, color: "from-orange-500 to-orange-600" },
];

export function PosPayment({ exchangeRate, cashDiscount = 0, onConfirm, onClose, totalWithIVA, ivaAmount, customerName: initialCustomerName = "", customerRif: initialCustomerRif = "" }: PosPaymentProps) {
  const { totalUSD, clearCart } = useCart();
  const effectiveTotal = totalWithIVA !== undefined ? totalWithIVA : totalUSD;
  const totalBS = effectiveTotal * exchangeRate;
  const [paymentType, setPaymentType] = useState<PosPaymentType>("efectivo_bs");
  const [cashReceivedBS, setCashReceivedBS] = useState(totalBS);
  const [cashReceivedUSD, setCashReceivedUSD] = useState(effectiveTotal);
  const [mobileBS, setMobileBS] = useState(totalBS);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerRif, setCustomerRif] = useState(initialCustomerRif);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [cardType, setCardType] = useState<"debito" | "credito">("debito");
  const [divisaType, setDivisaType] = useState<"EUR" | "COP">("EUR");
  const [divisaRate, setDivisaRate] = useState(0);
  const [divisaAmount, setDivisaAmount] = useState(0);
  const [mixedCashBS, setMixedCashBS] = useState(0);
  const [mixedCashUSD, setMixedCashUSD] = useState(0);
  const [mixedMobileBS, setMixedMobileBS] = useState(0);
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

  const discount = paymentType === "efectivo_bs" || paymentType === "efectivo_usd" ? (cashDiscount || 0) : 0;
  const finalUSD = Math.max(0, effectiveTotal - discount);
  const finalBS = finalUSD * exchangeRate;
  const changeBS = Math.max(0, cashReceivedBS - finalBS);
  const changeUSD = Math.max(0, cashReceivedUSD - finalUSD);

  function getLabel(t: PosPaymentType): string {
    return PAYMENT_OPTIONS.find((o) => o.type === t)?.label || t;
  }

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      let cashUSD = 0;
      let cashBS = 0;
      let mobileBSAmt = 0;
      if (paymentType === "efectivo_bs") { cashBS = finalBS; cashUSD = 0; }
      else if (paymentType === "efectivo_usd") { cashUSD = finalUSD; cashBS = 0; }
      else if (paymentType === "pago_movil") { mobileBSAmt = finalBS; }
      else if (paymentType === "punto_venta" || paymentType === "tarjeta_credito") { cashUSD = finalUSD; }
      else if (paymentType === "transferencia") { mobileBSAmt = finalBS; }
      else if (paymentType === "divisas") { cashUSD = finalUSD; }
      else if (paymentType === "mixto") {
        cashBS = mixedCashBS;
        cashUSD = mixedCashUSD;
        mobileBSAmt = mixedMobileBS;
      }
      await onConfirm({
        paymentType,
        cashUSD,
        cashBS,
        mobileBS: mobileBSAmt,
        receivedBS: cashReceivedBS,
        receivedUSD: cashReceivedUSD,
        divisaType: paymentType === "divisas" ? divisaType : undefined,
        divisaRate: paymentType === "divisas" ? divisaRate : undefined,
        divisaAmount: paymentType === "divisas" ? divisaAmount : undefined,
        customerName,
        customerRif: customerRif.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentReference: paymentType === "punto_venta" || paymentType === "tarjeta_credito" || paymentType === "transferencia" || paymentType === "pago_movil" ? paymentReference : undefined,
        paymentBank: paymentType === "punto_venta" || paymentType === "tarjeta_credito" || paymentType === "transferencia" || paymentType === "pago_movil" ? paymentBank : undefined,
        paymentPhone: paymentType === "pago_movil" ? paymentPhone : undefined,
        cardType: paymentType === "punto_venta" || paymentType === "tarjeta_credito" ? cardType : undefined,
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
                Base: {formatUSD(Number((finalUSD - ivaAmount).toFixed(2)))} + IVA: {formatUSD(ivaAmount)}
              </p>
            )}
            {exchangeRate > 0 && (
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                Bs. {formatBs(finalBS)} <span className="text-xs text-muted-foreground/60">@ {exchangeRate.toFixed(2)}</span>
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
                  if (type === "efectivo_bs") setCashReceivedBS(totalBS);
                  if (type === "efectivo_usd") setCashReceivedUSD(effectiveTotal);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-[10px] font-semibold transition-all",
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

          {/* Efectivo Bs */}
          {paymentType === "efectivo_bs" && (
            <div className="space-y-3 rounded-xl bg-muted/10 p-4 border border-border/40">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Recibido (Bs)
                </label>
                <input
                  type="number"
                  min={finalBS}
                  step="10"
                  value={cashReceivedBS || ""}
                  onChange={(e) => setCashReceivedBS(Math.max(finalBS, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-center text-2xl font-bold tabular-nums font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              {cashReceivedBS >= finalBS && (
                <div className="flex items-center justify-between rounded-xl bg-success/10 border border-success/20 p-3.5">
                  <span className="text-sm font-semibold text-success">Cambio</span>
                  <span className="text-2xl font-bold text-success tabular-nums font-mono">
                    Bs. {formatBs(changeBS)}
                  </span>
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

          {/* Efectivo USD */}
          {paymentType === "efectivo_usd" && (
            <div className="space-y-3 rounded-xl bg-muted/10 p-4 border border-border/40">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Recibido (\$)
                </label>
                <input
                  type="number"
                  min={finalUSD}
                  step="0.5"
                  value={cashReceivedUSD || ""}
                  onChange={(e) => setCashReceivedUSD(Math.max(finalUSD, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-center text-2xl font-bold tabular-nums font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              {cashReceivedUSD >= finalUSD && (
                <div className="flex items-center justify-between rounded-xl bg-success/10 border border-success/20 p-3.5">
                  <span className="text-sm font-semibold text-success">Cambio</span>
                  <span className="text-2xl font-bold text-success tabular-nums font-mono">{formatUSD(changeUSD)}</span>
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

          {/* Pago Móvil */}
          {paymentType === "pago_movil" && (
            <div className="space-y-3 rounded-xl border-2 border-border/60 p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detalles Pago Móvil</h3>
              <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/20">
                <span className="text-sm text-muted-foreground">Monto</span>
                <p className="text-2xl font-bold tabular-nums font-mono">{formatBs(finalBS)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono</label>
                <input
                  type="text"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="Ej: 0412-1234567"
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
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Referencia</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="N° de referencia"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Punto de Venta */}
          {(paymentType === "punto_venta" || paymentType === "tarjeta_credito") && (
            <div className="space-y-3 rounded-xl border-2 border-border/60 p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {paymentType === "tarjeta_credito" ? "Tarjeta de Crédito" : "Punto de Venta"}
              </h3>
              <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/20">
                <span className="text-sm text-muted-foreground">Monto</span>
                <p className="text-2xl font-bold tabular-nums font-mono">{formatUSD(finalUSD)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">N° Aprobación / Lote *</label>
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
              {paymentType === "punto_venta" && (
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
              )}
            </div>
          )}

          {/* Transferencia */}
          {paymentType === "transferencia" && (
            <div className="space-y-3 rounded-xl border-2 border-border/60 p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transferencia</h3>
              <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/20">
                <span className="text-sm text-muted-foreground">Monto</span>
                <p className="text-2xl font-bold tabular-nums font-mono">{formatBs(finalBS)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Banco</label>
                <input
                  type="text"
                  value={paymentBank}
                  onChange={(e) => setPaymentBank(e.target.value)}
                  placeholder="Ej: Bancamiga"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Referencia *</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="N° de transferencia"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Divisas */}
          {paymentType === "divisas" && (
            <div className="space-y-3 rounded-xl border-2 border-border/60 p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Divisas</h3>
              <div className="grid grid-cols-2 gap-2">
                {(["EUR", "COP"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDivisaType(t)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all text-center",
                      divisaType === t
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border/60 text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tasa de cambio</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={divisaRate || ""}
                  onChange={(e) => setDivisaRate(Number(e.target.value) || 0)}
                  placeholder={divisaType === "EUR" ? "EUR/USD" : "COP/USD"}
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Monto recibido</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={divisaAmount || ""}
                  onChange={(e) => setDivisaAmount(Number(e.target.value) || 0)}
                  placeholder={`Monto en ${divisaType}`}
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              {divisaRate > 0 && divisaAmount > 0 && (
                <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
                  <span className="text-xs text-muted-foreground">Equivale a</span>
                  <p className="text-lg font-bold tabular-nums">{formatUSD(divisaAmount / divisaRate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Mixto */}
          {paymentType === "mixto" && (
            <div className="space-y-3 rounded-xl bg-muted/10 p-4 border border-border/40">
              <p className="text-xs text-center text-muted-foreground mb-1">
                Total: {formatUSD(finalUSD)} / Bs. {formatBs(finalBS)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Efvo. Bs</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={mixedCashBS || ""}
                    onChange={(e) => setMixedCashBS(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border-2 border-border/60 bg-background px-2 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Efvo. \$</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={mixedCashUSD || ""}
                    onChange={(e) => setMixedCashUSD(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border-2 border-border/60 bg-background px-2 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wider">Pgo. Móvil</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={mixedMobileBS || ""}
                    onChange={(e) => setMixedMobileBS(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border-2 border-border/60 bg-background px-2 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              {(() => {
                const totalMixedUSD = (mixedCashBS / exchangeRate) + mixedCashUSD + (mixedMobileBS / exchangeRate);
                const diff = finalUSD - totalMixedUSD;
                return (
                  <div className={cn("flex justify-between rounded-xl p-3 border text-sm font-semibold",
                    Math.abs(diff) < 0.01
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-danger/10 border-danger/20 text-danger"
                  )}>
                    <span>{Math.abs(diff) < 0.01 ? "Cubre el total" : "Diferencia"}</span>
                    <span>{Math.abs(diff) < 0.01 ? "✓" : formatUSD(diff)}</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Customer section */}
          <div className={`space-y-2 rounded-xl p-4 border transition-all ${
            customerName ? "bg-primary/[0.03] border-primary/30" : "bg-muted/5 border-border/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</label>
                {customerName && (
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {customerName}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setShowCustomerSearch(!showCustomerSearch); setCustomerQuery(""); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Search className="h-3.5 w-3.5" /> {showCustomerSearch ? "Cerrar" : customerName ? "Cambiar" : "Buscar"}
              </button>
            </div>

            {showCustomerSearch && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Nombre, RIF o teléfono..."
                    className="w-full rounded-lg border-2 border-border/60 bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>
                {customerResults.length > 0 && (
                  <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border-2 border-border/60 bg-card shadow-lg">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 border-b border-border/40 last:border-0 transition-all flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold">{c.name}</span>
                          {c.id_card && <span className="ml-2 text-xs text-muted-foreground font-mono">{c.id_card}</span>}
                        </div>
                        {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {customerQuery && customerResults.length === 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground text-center py-2">Sin resultados</p>
                )}
                {customerName && (
                  <button
                    onClick={() => { setCustomerName(""); setCustomerRif(""); setCustomerEmail(""); }}
                    className="mt-1.5 w-full rounded-lg py-1.5 text-xs font-semibold text-muted-foreground hover:text-danger hover:bg-danger/5 transition-all border border-dashed border-border/60"
                  >
                    Quitar cliente
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-[10px] text-muted-foreground mb-0.5 font-medium">RIF</label>
                <input
                  type="text"
                  value={customerRif}
                  onChange={(e) => setCustomerRif(e.target.value.toUpperCase())}
                  placeholder="J-XXXXXXXX-X"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-muted-foreground mb-0.5 font-medium">Nombre</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-0.5 font-medium">Email (opcional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-lg border-2 border-border/60 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
            disabled={(paymentType === "punto_venta" || paymentType === "tarjeta_credito" || paymentType === "transferencia") && !paymentReference.trim()}
            className="!py-4 text-base"
          >
            <Check className="h-5 w-5" /> Confirmar Venta — {formatUSD(finalUSD)}
          </Button>
        </div>
      </div>
    </div>
  );
}
