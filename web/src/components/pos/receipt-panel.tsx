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
    if (item.presentation.exento || !ivaPercent) return base - discount;
    const factor = ivaFactor();
    return base * factor - discount * factor;
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
    const lastName = lastPayment?.customerName || localStorage.getItem("last_customer_name") || "";
    const lastRif = lastPayment?.customerRif || localStorage.getItem("last_customer_rif") || "";

    const tax = ivaAmount();
    const baseTotal = items
      .reduce((s, i) => s + Math.max(0, i.presentation.priceUSD - (i.discount || 0)) * i.quantity, 0);
    const taxableTotal = items
      .filter((i) => !i.presentation.exento)
      .reduce((s, i) => s + Math.max(0, i.presentation.priceUSD - (i.discount || 0)) * i.quantity, 0);
    const exemptTotal = items
      .filter((i) => i.presentation.exento)
      .reduce((s, i) => s + Math.max(0, i.presentation.priceUSD - (i.discount || 0)) * i.quantity, 0);
    const finalSubtotal = items.reduce((s, i) => s + itemFinalUnitPrice(i) * i.quantity, 0);
    const totalAfterDiscount = Math.max(0, finalSubtotal - globalDiscount);

    const lines: string[] = [];
    const W = 36;

    function center(text: string) {
      const pad = Math.max(0, W - text.length);
      const left = Math.floor(pad / 2);
      return " ".repeat(left) + text;
    }

    function rPad(text: string, width: number): string {
      return text.padStart(width);
    }

    // ── Header ──
    lines.push(center(bName));
    if (bRif) lines.push(center(`RIF: ${bRif}`));
    if (bAddr) lines.push(center(bAddr.length > W ? bAddr.substring(0, W) : bAddr));
    if (bPhone) lines.push(center(`Telf: ${bPhone}`));
    lines.push("=".repeat(W));

    if (invoiceNumber) {
      lines.push(`FACTURA N°: ${invoiceNumber}`);
      lines.push(`N° CONTROL: ${controlNumber}`);
      lines.push(center("AUTORIZADO SENIAT"));
      lines.push("=".repeat(W));
    }

    lines.push(new Date().toLocaleString("es-VE", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }));
    lines.push("");

    // ── Customer ──
    if (lastName || lastRif) {
      if (lastName) lines.push(`CLIENTE: ${lastName.substring(0, W - 9)}`);
      if (lastRif) lines.push(`RIF/C.I: ${lastRif}`);
      lines.push("-".repeat(W));
    }

    // ── Items ──
    items.forEach((item) => {
      const basePrice = Math.max(0, item.presentation.priceUSD - (item.discount || 0));
      const finalPrice = itemFinalUnitPrice(item);
      const lineTotal = finalPrice * item.quantity;
      const ex = item.presentation.exento ? " (E)" : "";
      const name = (item.product.name + ex).substring(0, 28);
      lines.push(name);
      const qty = `${item.quantity}`;
      const unitFmt = fmt(basePrice);
      const totalFmt = fmt(lineTotal);
      const line = `  ${qty} x ${unitFmt.padStart(9)}  ${totalFmt.padStart(9)}`;
      lines.push(line);
      if (item.discount) {
        const dAmt = (item.discount * ivaFactor() * item.quantity);
        lines.push(`       Desc: -${fmt(dAmt).padStart(9)}`);
      }
    });

    lines.push("");
    lines.push("=".repeat(W));

    // ── Summary ──
    const labelW = 18;
    const valW = W - labelW;
    const baseBeforeDiscount = items.reduce((s, i) => s + Math.max(0, i.presentation.priceUSD - (i.discount || 0)) * i.quantity, 0);
    lines.push(`Subtotal (s/IVA)   ${rPad(fmt(baseBeforeDiscount), valW)}`);
    if (taxableTotal > 0) {
      lines.push(`Base Imponible     ${rPad(fmt(taxableTotal), valW)}`);
    }
    if (exemptTotal > 0) {
      lines.push(`Exento             ${rPad(fmt(exemptTotal), valW)}`);
    }
    if (globalDiscount > 0) {
      lines.push(`Descuento         -${rPad(fmt(globalDiscount), valW - 1)}`);
    }
    if (tax > 0) {
      lines.push(`IVA (${ivaPercent}%)          ${rPad(fmt(tax), valW)}`);
    }
    lines.push(`TOTAL (c/IVA)     ${rPad(fmt(totalAfterDiscount), valW)}`);

    // ── Payment ──
    if (lastPayment) {
      lines.push("=".repeat(W));
      const pLabels: Record<string, string> = {
        efectivo_bs: "Efectivo Bs", efectivo_usd: "Efectivo USD", pago_movil: "Pago Móvil",
        punto_venta: "Punto de Venta", tarjeta_credito: "Tarjeta Crédito",
        transferencia: "Transferencia", divisas: "Divisas", mixto: "Mixto",
      };
      const pl = pLabels[lastPayment.paymentType] || lastPayment.paymentType;
      lines.push(`Forma de pago: ${pl}`);
      if (lastPayment.paymentReference) lines.push(`Ref: ${lastPayment.paymentReference}`);
      if (lastPayment.paymentBank) lines.push(`Banco: ${lastPayment.paymentBank}`);
      if (lastPayment.paymentPhone) lines.push(`Tel: ${lastPayment.paymentPhone}`);
      if (lastPayment.cardType === "debito") lines.push(`Tarjeta: Débito`);
      else if (lastPayment.cardType === "credito") lines.push(`Tarjeta: Crédito`);
      if (lastPayment.divisaType) lines.push(`Divisa: ${lastPayment.divisaType}`);
      if (lastPayment.divisaRate) lines.push(`Tasa: ${lastPayment.divisaRate}`);

      const totalChk = baseTotal + tax;
      if (lastPayment.paymentType === "efectivo_bs" && lastPayment.receivedBS > 0) {
        const recUSD = lastPayment.receivedBS / exchangeRate;
        lines.push(`Recibido Bs        ${rPad(fmt(recUSD), valW)}`);
        const ch = Math.max(0, lastPayment.receivedBS - totalChk * exchangeRate);
        if (ch > 0) lines.push(`Cambio             ${rPad(fmt(ch / exchangeRate), valW)}`);
      }
      if (lastPayment.paymentType === "efectivo_usd" && lastPayment.receivedUSD > 0) {
        lines.push(`Recibido USD       ${rPad(fmt(lastPayment.receivedUSD), valW)}`);
        const ch = Math.max(0, lastPayment.receivedUSD - totalChk);
        if (ch > 0) lines.push(`Cambio             ${rPad(fmt(ch), valW)}`);
      }
    }

    // ── Footer ──
    if (invoiceNumber) {
      lines.push("-".repeat(W));
      lines.push(center("AUTORIZADO POR SENIAT"));
    }
    lines.push("=".repeat(W));
    lines.push(center("¡Gracias por su compra!"));
    lines.push("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${invoiceNumber ? `Factura ${invoiceNumber}` : "Ticket"}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 16px; width: 80mm; }
        pre { margin: 0; }
        td { padding: 0; }
        @media print { @page { margin: 0; } body { margin: 0; padding: 8px; } }
      </style></head><body><pre>${lines.join("\n")}</pre>
      <script>window.onload=()=>{window.print();window.close()}</script></body></html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#fafafa] to-[#f5f5f5] rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="border-b border-gray-200 bg-gradient-to-r from-white to-gray-50/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-primary/20">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-widest text-gray-700">RECIBO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground bg-gray-100 rounded-full px-2.5 py-0.5 tabular-nums">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            {items.length > 0 && (
              <button onClick={handlePrint} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-gray-100 transition-all active:scale-90" title="Imprimir ticket (Ctrl+P)">
                <Printer className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
            <div className="rounded-full bg-gradient-to-br from-gray-100 to-gray-50 p-5 mb-4 ring-1 ring-gray-200">
              <ShoppingCart className="h-12 w-12 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">Carrito vacío</p>
            <p className="text-xs text-gray-400 mt-1">Escanea o selecciona productos</p>
            <div className="mt-4 flex gap-3 text-[10px] text-gray-400">
              <span className="bg-gray-100 rounded-md px-2 py-1 font-mono">F2</span>
              <span className="text-gray-300">Buscar</span>
              <span className="bg-gray-100 rounded-md px-2 py-1 font-mono">F8</span>
              <span className="text-gray-300">Cobrar</span>
            </div>
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
                  className="px-3 py-2.5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all animate-in slide-in-from-bottom-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                        {item.product.name}
                        {item.presentation.exento && <span className="text-[10px] text-muted-foreground ml-1 font-normal">(E)</span>}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {item.presentation.name}
                        {!item.presentation.exento && ivaPercent > 0 && <span className="text-success ml-1.5 font-semibold">IVA incl.</span>}
                        {discount > 0 && <span className="text-danger ml-1.5 font-semibold">-{fmt(discount)}/u</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setDiscountTarget({ idx })}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                        title="Descuento"
                      >
                        <Percent className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-danger hover:bg-danger/10 transition-all active:scale-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 transition-all active:scale-90"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums font-mono text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 transition-all active:scale-90"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold tabular-nums font-mono text-gray-800">{fmt(lineTotal)}</span>
                  </div>

                  {discountTarget?.idx === idx && (
                    <div className="mt-2 flex items-center gap-2 animate-in slide-in-from-top-1 p-2 rounded-lg bg-primary/[0.02] border border-primary/10">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={discount || ""}
                        onChange={(e) => setItemDiscount(idx, Number(e.target.value) || 0)}
                        placeholder="$0.00"
                        className="flex-1 rounded-lg border-2 border-border/60 bg-background px-3 py-1.5 text-xs font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        autoFocus
                      />
                      <span className="text-[10px] text-muted-foreground font-medium">Desc./u</span>
                      <button
                        onClick={() => setDiscountTarget(null)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
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
        <div className="border-t-2 border-gray-200 bg-gradient-to-b from-white to-gray-50/50 px-4 py-3 space-y-2.5 shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Subtotal</span>
            <span className="tabular-nums font-mono font-semibold text-gray-700">{fmt(subtotal())}</span>
          </div>

          {ivaPercent > 0 && ivaAmt !== undefined && ivaAmt > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Base Imponible</span>
                <span className="tabular-nums font-mono font-semibold text-gray-700">{fmt(baseSubtotal())}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">IVA ({ivaPercent}%)</span>
                <span className="tabular-nums font-mono font-semibold text-gray-700">{fmt(ivaAmt)}</span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Descuento</span>
              <button
                onClick={() => setGlobalDiscount(globalDiscount > 0 ? 0 : 1)}
                className="rounded-lg p-1 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
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
                  className="w-20 rounded-lg border-2 border-border/60 bg-background px-2 py-1 text-right text-xs font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"
                />
                <span className="text-success text-sm font-bold">-{fmt(globalDiscount)}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">$0.00</span>
            )}
          </div>

          <div className="border-t-2 border-gray-100 pt-2" />

          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-gray-900">TOTAL</span>
            <span className="text-xl font-extrabold tabular-nums font-mono text-primary drop-shadow-sm">
              {totalWithIVA !== undefined ? fmt(totalWithIVA) : fmt(totalUSD)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/95 py-4 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all"
          >
            Cobrar {totalWithIVA !== undefined ? fmt(totalWithIVA) : fmt(totalUSD)}
          </button>
        </div>
      )}
    </div>
  );
}
