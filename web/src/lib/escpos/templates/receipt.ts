import { buildReceipt, type ReceiptLine } from "../printer";

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
  exento?: boolean;
}

interface ReceiptData {
  businessName: string;
  businessRif?: string;
  businessAddress?: string;
  businessPhone?: string;
  items: ReceiptItem[];
  subtotal: number;
  taxableAmount: number;
  exemptAmount: number;
  ivaAmount: number;
  ivaPercent: number;
  discount: number;
  total: number;
  exchangeRate: number;
  paymentType: string;
  paymentReference?: string;
  paymentBank?: string;
  paymentPhone?: string;
  cardType?: string;
  receivedBS?: number;
  receivedUSD?: number;
  customerName?: string;
  invoiceNumber?: string;
  controlNumber?: string;
  currency?: "USD" | "VES" | "COP";
}

function fmt(amount: number, currency: string): string {
  if (currency === "VES") {
    return `Bs ${amount.toFixed(2).replace(".", ",")}`;
  }
  if (currency === "COP") {
    return `$${Math.round(amount).toLocaleString("es-CO")}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function buildThermalReceipt(data: ReceiptData): Uint8Array {
  const lines: ReceiptLine[] = [];
  const cur = data.currency || "USD";

  lines.push({ text: data.businessName, center: true, bold: true, double: true });
  if (data.businessRif) {
    lines.push({ text: `RIF: ${data.businessRif}`, center: true });
  }
  if (data.businessAddress) {
    lines.push({ text: data.businessAddress, center: true });
  }
  if (data.businessPhone) {
    lines.push({ text: `Telf: ${data.businessPhone}`, center: true });
  }
  lines.push({ text: "═".repeat(32), center: true });

  if (data.invoiceNumber) {
    lines.push({ text: `Factura N°: ${data.invoiceNumber}`, center: true });
    lines.push({ text: `N° Control: ${data.controlNumber || ""}`, center: true });
    lines.push({ text: "AUTORIZADO SENIAT", center: true, bold: true });
    lines.push({ text: "═".repeat(32), center: true });
  }

  lines.push({ text: new Date().toLocaleString(), center: true });
  lines.push({ text: "" });

  for (const item of data.items) {
    const label = item.exento ? `${item.name} (E)` : item.name;
    lines.push({ text: label, bold: true });
    const priceStr = fmt(item.price, cur);
    const totalStr = fmt(item.total, cur);
    lines.push({ text: `  ${item.qty} x ${priceStr.padStart(7)}  ${totalStr.padStart(7)}` });
  }

  lines.push({ text: "" });
  lines.push({ text: "─".repeat(32) });
  lines.push({ text: `BASE IMPONIBLE:  ${fmt(data.taxableAmount, cur)}` });
  if (data.exemptAmount > 0) {
    lines.push({ text: `EXENTO:          ${fmt(data.exemptAmount, cur)}` });
  }
  if (data.ivaAmount > 0 && data.ivaPercent > 0) {
    lines.push({ text: `IVA (${data.ivaPercent}%):   ${fmt(data.ivaAmount, cur)}` });
  }
  lines.push({ text: `SUBTOTAL:        ${fmt(data.taxableAmount + data.exemptAmount, cur)}` });
  if (data.discount > 0) {
    lines.push({ text: `DESCUENTO:      -${fmt(data.discount, cur)}` });
  }
  lines.push({ text: `TOTAL:           ${fmt(data.total, cur)}`, bold: true });
  if (data.exchangeRate > 0) {
    lines.push({ text: `Bs: ${(data.total * data.exchangeRate).toFixed(2).replace(".", ",")} @ ${data.exchangeRate.toFixed(2)}` });
  }

  lines.push({ text: "─".repeat(32) });
  lines.push({ text: `Pago: ${data.paymentType}` });
  if (data.paymentReference) lines.push({ text: `Ref: ${data.paymentReference}` });
  if (data.paymentBank) lines.push({ text: `Banco: ${data.paymentBank}` });
  if (data.paymentPhone) lines.push({ text: `Tel: ${data.paymentPhone}` });
  if (data.cardType) lines.push({ text: `Tarjeta: ${data.cardType}` });
  if (data.receivedBS && data.receivedBS > 0) {
    lines.push({ text: `Recibido: Bs ${data.receivedBS.toFixed(2).replace(".", ",")}` });
    const change = Math.max(0, data.receivedBS - data.total * data.exchangeRate);
    if (change > 0) lines.push({ text: `Cambio:   Bs ${change.toFixed(2).replace(".", ",")}` });
  }
  if (data.receivedUSD && data.receivedUSD > 0) {
    lines.push({ text: `Recibido: $${data.receivedUSD.toFixed(2)}` });
    const change = Math.max(0, data.receivedUSD - data.total);
    if (change > 0) lines.push({ text: `Cambio:   $${change.toFixed(2)}` });
  }
  if (data.customerName) {
    lines.push({ text: `Cliente: ${data.customerName}` });
  }

  if (data.invoiceNumber) {
    lines.push({ text: "" });
    lines.push({ text: "AUTORIZADO POR SENIAT", center: true, bold: true });
  }
  lines.push({ text: "" });
  lines.push({ text: new Date().toLocaleString(), center: true });
  lines.push({ text: "" });
  lines.push({ text: "¡Gracias por su compra!", center: true, bold: true });
  lines.push({ text: "" });

  return buildReceipt(lines);
}
