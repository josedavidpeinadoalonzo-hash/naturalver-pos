"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { formatUSD, formatBs } from "@/lib/utils";
import { Trash2, Minus, Plus, ShoppingCart, Printer, Percent, Receipt } from "lucide-react";
import type { CurrencyCode } from "./currency-selector";
import { formatByCurrency } from "./currency-selector";
import type { PosPaymentData } from "./pos-payment";
import type { Business } from "@/lib/business-store";

interface ReceiptPanelProps {
  onCheckout: () => void;
  currency?: CurrencyCode;
  ivaPercent?: number;
  exchangeRate?: number;
  totalWithIVA?: number;
  ivaAmount?: number;
  lastPayment?: PosPaymentData | null;
  business?: Business | null;
}

export function ReceiptPanel({ onCheckout, currency = "VES", ivaPercent = 0, exchangeRate = 0, totalWithIVA, ivaAmount: ivaAmt, lastPayment, business }: ReceiptPanelProps) {
  const { items, updateQuantity, removeItem, totalUSD, totalItems, setItemDiscount, globalDiscount, setGlobalDiscount } = useCart();
  const [discountTarget, setDiscountTarget] = useState<{ idx: number } | null>(null);

  const rate = currency === "VES" ? exchangeRate : currency === "COP" ? (() => { try { return Number(localStorage.getItem("cop_rate") || "0"); } catch { return 0; } })() : 1;

  function ivaFactor(): number {
    return 1 + (ivaPercent || 0) / 100;
  }

  function finalUnitPrice(pres: { exento?: boolean; priceUSD: number }): number {
    return pres.exento || !ivaPercent ? pres.priceUSD : pres.priceUSD * ivaFactor();
  }

  function itemEffectivePrice(item: typeof items[0]): number {
    return item.presentation.priceUSD - (item.discount || 0);
  }

  function itemFinalUnitPrice(item: typeof items[0]): number {
    const base = item.presentation.priceUSD;
    const discount = item.discount || 0;
    const finalBase = base * ivaFactor();
    const finalDiscount = discount * ivaFactor();
    return finalBase - finalDiscount;
  }

  function itemLineTotal(item: typeof items[0]): number {
    return itemFinalUnitPrice(item) * item.quantity;
  }

  function subtotal(): number {
    return items.reduce((s, i) => s + itemFinalUnitPrice(i) * i.quantity, 0);
  }

  function baseSubtotal(): number {
    return items.reduce((s, i) => s + i.presentation.priceUSD * i.quantity, 0);
  }

  function fmt(usd: number): string {
    return formatByCurrency(usd, currency, exchangeRate, rate);
  }

  function taxableSubtotal(): number {
    return items
      .filter((i) => !i.presentation.exento)
      .reduce((s, i) => s + i.presentation.priceUSD * i.quantity, 0);
  }

  function ivaAmount(): number {
    const taxable = items
      .filter((i) => !i.presentation.exento)
      .reduce((s, i) => s + Math.max(0, itemEffectivePrice(i)) * i.quantity, 0);
    return (taxable * ivaPercent) / 100;
  }

  function handlePrint() {
    const bName = business?.name || localStorage.getItem("business_name") || "Distribuidora DC";
    const bRif = business?.rif || localStorage.getItem("business_rif") || "";
    const bAddr = business?.address || localStorage.getItem("business_address") || "";
    const bPhone = business?.phone || localStorage.getItem("business_phone") || "";
    const invoiceNumber = localStorage.getItem("last_invoice_number") || "";
    const controlNumber = localStorage.getItem("last_control_number") || "";

    const taxableTotal = items
      .filter((i) => !i.presentation.exento)
      .reduce((s, i) => s + itemEffectivePrice(i) * i.quantity, 0);
    const exemptTotal = items
      .filter((i) => i.presentation.exento)
      .reduce((s, i) => s + itemEffectivePrice(i) * i.quantity, 0);
    const tax = ivaAmount();

    const lines: string[] = [];
    const W = 32;

    function center(text: string) {
      const pad = Math.max(0, W - text.length);
      const left = Math.floor(pad / 2);
      return " ".repeat(left) + text;
    }

    lines.push(center(bName));
    if (bRif) lines.push(center(`RIF: ${bRif}`));
    if (bAddr) lines.push(center(bAddr));
    if (bPhone) lines.push(center(`Telf: ${bPhone}`));
    lines.push("=".repeat(W));

    if (invoiceNumber) {
      lines.push(center(`Factura N°: ${invoiceNumber}`));
      lines.push(center(`N° Control: ${controlNumber}`));
      lines.push(center("AUTORIZADO SENIAT"));
      lines.push("=".repeat(W));
    }

    lines.push(new Date().toLocaleString());
    lines.push("");

    items.forEach((item) => {
      const uPrice = itemFinalUnitPrice(item);
      const total = uPrice * item.quantity;
      const ex = item.presentation.exento ? " (E)" : "";
      const name = (item.product.name + ex).substring(0, W);
      const line = `${item.quantity} x ${fmt(uPrice).padStart(7)}  ${fmt(total).padStart(7)}`;
      lines.push(name);
      lines.push(" ".repeat(Math.max(0, W - line.length)) + line);
      if (item.discount) {
        lines.push(`  Desc: -${fmt((item.discount || 0) * ivaFactor() * item.quantity)}`);
      }
    });

    lines.push("");
    lines.push("-".repeat(W));
    const finalSubtotal = items.reduce((s, i) => s + itemFinalUnitPrice(i) * i.quantity, 0);
    lines.push(`SUBTOTAL:      ${fmt(finalSubtotal).padStart(W - 14)}`);
    if (taxableTotal > 0) {
      lines.push(`BASE IMPONIBLE:${fmt(taxableTotal).padStart(W - 14)}`);
    }
    if (exemptTotal > 0) {
      lines.push(`EXENTO:        ${fmt(exemptTotal).padStart(W - 14)}`);
    }
    if (tax > 0) {
      lines.push(`IVA (${ivaPercent}%):   ${fmt(tax).padStart(W - 14)}`);
    }
    if (globalDiscount > 0) {
      lines.push(`DESCUENTO:    -${fmt(globalDiscount).padStart(W - 15)}`);
    }
    lines.push(`TOTAL:         ${fmt(finalSubtotal - globalDiscount).padStart(W - 14)}`);

    if (lastPayment) {
      lines.push("-".repeat(W));
      const pLabels: Record<string, string> = {
        efectivo_bs: "Efectivo Bs", efectivo_usd: "Efectivo USD", pago_movil: "Pago Móvil",
        punto_venta: "Punto de Venta", tarjeta_credito: "Tarjeta Crédito",
        transferencia: "Transferencia", divisas: "Divisas", mixto: "Mixto",
      };
      const pl = pLabels[lastPayment.paymentType] || lastPayment.paymentType;
      lines.push(`Pago: ${pl}`);
      if (lastPayment.paymentReference) lines.push(`Ref: ${lastPayment.paymentReference}`);
      if (lastPayment.paymentBank) lines.push(`Banco: ${lastPayment.paymentBank}`);
      if (lastPayment.paymentPhone) lines.push(`Tel: ${lastPayment.paymentPhone}`);
      if (lastPayment.cardType) lines.push(`Tarjeta: ${lastPayment.cardType === "debito" ? "Débito" : "Crédito"}`);
      if (lastPayment.divisaType) lines.push(`Divisa: ${lastPayment.divisaType} @ ${lastPayment.divisaRate}`);
      if (lastPayment.paymentType === "efectivo_bs" && lastPayment.receivedBS > 0) {
        lines.push(`Recibido:     ${fmt(lastPayment.receivedBS / exchangeRate)}`);
        const ch = Math.max(0, lastPayment.receivedBS - (totalUSD + tax) * exchangeRate);
        if (ch > 0) lines.push(`Cambio:       ${fmt(ch / exchangeRate)}`);
      }
      if (lastPayment.paymentType === "efectivo_usd" && lastPayment.receivedUSD > 0) {
        lines.push(`Recibido:     ${fmt(lastPayment.receivedUSD)}`);
        const ch = Math.max(0, lastPayment.receivedUSD - (totalUSD + tax));
        if (ch > 0) lines.push(`Cambio:       ${fmt(ch)}`);
      }
    }

    if (invoiceNumber) {
      lines.push("-".repeat(W));
      lines.push(center("AUTORIZADO POR SENIAT"));
    }
    lines.push("-".repeat(W));
    lines.push(new Date().toLocaleString());
    lines.push("=".repeat(W));
    lines.push(center("¡Gracias por su compra!"));

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Ticket</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 16px; width: 80mm; }
        pre { margin: 0; }
        @media print { @page { margin: 0; } body { margin: 0; padding: 8px; } }
      </style></head><body><pre>${lines.join("\n")}</pre>
      <script>window.onload=()=>{window.print();window.close()}</script></body></html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="flex h-full flex-col bg-[#f8f8f8] rounded-xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-wider">RECIBO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">
              {totalItems} items
            </span>
            {items.length > 0 && (
              <button onClick={handlePrint} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-gray-100 transition-all" title="Imprimir ticket">
                <Printer className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Carrito vacío</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Escanea o selecciona productos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              const discount = item.discount || 0;
              const displayUnit = finalUnitPrice(item.presentation);
              const effectivePrice = itemFinalUnitPrice(item);
              const lineTotal = effectivePrice * item.quantity;
              return (
                <div
                  key={`${item.product.id}-${item.presentation.id}`}
                  className="px-3 py-2.5 hover:bg-gray-50 transition-colors animate-in slide-in-from-bottom-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {item.product.name}
                        {item.presentation.exento && <span className="text-[10px] text-muted-foreground ml-1 font-normal">(E)</span>}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {item.presentation.name} · {fmt(displayUnit)}
                        {!item.presentation.exento && ivaPercent > 0 && <span className="text-success ml-1">IVA incl.</span>}
                        {discount > 0 && <span className="text-success ml-1">(-{fmt(discount)})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setDiscountTarget({ idx })}
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
                        title="Descuento"
                      >
                        <Percent className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-danger hover:bg-danger/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 transition-all active:scale-90"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 transition-all active:scale-90"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold tabular-nums font-mono">{fmt(lineTotal)}</span>
                  </div>

                  {discountTarget?.idx === idx && (
                    <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={discount || ""}
                        onChange={(e) => setItemDiscount(idx, Number(e.target.value) || 0)}
                        placeholder="Descuento unitario"
                        className="flex-1 rounded-lg border-2 border-border/60 bg-background px-3 py-1.5 text-xs font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        autoFocus
                      />
                      <button
                        onClick={() => setDiscountTarget(null)}
                        className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-mono font-medium">{fmt(subtotal())}</span>
          </div>

          {ivaPercent > 0 && ivaAmt !== undefined && ivaAmt > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Base Imponible</span>
                <span className="tabular-nums font-mono font-medium">{fmt(baseSubtotal())}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>IVA ({ivaPercent}%)</span>
                <span className="tabular-nums font-mono font-medium">{fmt(ivaAmt)}</span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Descuento</span>
              <button
                onClick={() => setGlobalDiscount(globalDiscount > 0 ? 0 : 1)}
                className="rounded-lg p-1 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all"
              >
                <Percent className="h-3.5 w-3.5" />
              </button>
            </div>
            {globalDiscount > 0 ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
                  className="w-22 rounded-lg border-2 border-border/60 bg-background px-2 py-1 text-right text-xs font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"
                />
                <span className="text-success text-sm font-semibold">-{fmt(globalDiscount)}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">{fmt(0)}</span>
            )}
          </div>

          <div className="border-t border-border/30 pt-2" />

          <div className="flex items-center justify-between">
            <span className="text-base font-bold">TOTAL</span>
            <span className="text-xl font-bold tabular-nums font-mono text-primary">
              {totalWithIVA !== undefined ? fmt(totalWithIVA) : fmt(totalUSD)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Cobrar {totalWithIVA !== undefined ? fmt(totalWithIVA) : fmt(totalUSD)}
          </button>
        </div>
      )}
    </div>
  );
}
