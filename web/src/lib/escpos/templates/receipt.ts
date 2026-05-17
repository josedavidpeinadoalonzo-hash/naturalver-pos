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
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  exchangeRate: number;
  paymentType: string;
  customerName?: string;
  invoiceNumber?: string;
  controlNumber?: string;
  ivaPercent?: number;
  ivaAmount?: number;
  exemptAmount?: number;
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
  lines.push({ text: "═".repeat(32), center: true });
  lines.push({ text: "" });

  for (const item of data.items) {
    const label = item.exento ? `${item.name} (E)` : item.name;
    lines.push({ text: label, bold: true });
    lines.push({ text: `  ${item.qty} x ${fmt(item.price, cur)}   ${fmt(item.total, cur)}` });
  }

  lines.push({ text: "" });
  lines.push({ text: "─".repeat(32) });
  lines.push({ text: `SUBTOTAL:        ${fmt(data.subtotal, cur)}` });
  if (data.ivaAmount && data.ivaAmount > 0 && data.ivaPercent) {
    lines.push({ text: `IVA (${data.ivaPercent}%):  ${fmt(data.ivaAmount, cur)}` });
  }
  if (data.exemptAmount && data.exemptAmount > 0) {
    lines.push({ text: `EXENTO:          ${fmt(data.exemptAmount, cur)}` });
  }
  if (data.discount > 0) {
    lines.push({ text: `DESCUENTO:      -${fmt(data.discount, cur)}` });
  }
  lines.push({ text: `TOTAL:           ${fmt(data.total, cur)}`, bold: true });
  if (data.exchangeRate > 0) {
    lines.push({ text: `Bs: ${(data.total * data.exchangeRate).toFixed(2).replace(".", ",")} @ ${data.exchangeRate.toFixed(2)}` });
  }
  lines.push({ text: "─".repeat(32) });
  lines.push({ text: `Pago: ${data.paymentType}` });
  if (data.customerName) {
    lines.push({ text: `Cliente: ${data.customerName}` });
  }
  if (data.invoiceNumber) {
    lines.push({ text: "" });
    lines.push({ text: `Factura N°: ${data.invoiceNumber}`, center: true });
    lines.push({ text: `N° Control: ${data.controlNumber || ""}`, center: true });
    lines.push({ text: "AUTORIZADO POR SENIAT", center: true, bold: true });
  }
  lines.push({ text: "" });
  lines.push({ text: new Date().toLocaleString(), center: true });
  lines.push({ text: "" });
  lines.push({ text: "¡Gracias por su compra!", center: true, bold: true });
  lines.push({ text: "" });

  return buildReceipt(lines);
}
