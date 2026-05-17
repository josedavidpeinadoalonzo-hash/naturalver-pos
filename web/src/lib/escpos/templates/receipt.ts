import { buildReceipt, type ReceiptLine } from "../printer";

interface ReceiptData {
  businessName: string;
  businessRif?: string;
  items: { name: string; qty: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  exchangeRate: number;
  paymentType: string;
  customerName?: string;
}

export function buildThermalReceipt(data: ReceiptData): Uint8Array {
  const lines: ReceiptLine[] = [];

  lines.push({ text: data.businessName, center: true, bold: true, double: true });
  if (data.businessRif) {
    lines.push({ text: `RIF: ${data.businessRif}`, center: true });
  }
  lines.push({ text: "═".repeat(32), center: true });
  lines.push({ text: "" });

  for (const item of data.items) {
    lines.push({ text: item.name, bold: true });
    lines.push({ text: `  ${item.qty} x $${item.price.toFixed(2)}   $${item.total.toFixed(2)}` });
  }

  lines.push({ text: "" });
  lines.push({ text: "─".repeat(32) });
  lines.push({ text: `SUBTOTAL:          $${data.subtotal.toFixed(2)}` });
  if (data.discount > 0) {
    lines.push({ text: `DESCUENTO:        -$${data.discount.toFixed(2)}` });
  }
  lines.push({ text: `TOTAL:             $${data.total.toFixed(2)}`, bold: true });
  if (data.exchangeRate > 0) {
    lines.push({ text: `Bs: ${(data.total * data.exchangeRate).toFixed(2)} @ ${data.exchangeRate.toFixed(2)}` });
  }
  lines.push({ text: "─".repeat(32) });
  lines.push({ text: `Pago: ${data.paymentType}` });
  if (data.customerName) {
    lines.push({ text: `Cliente: ${data.customerName}` });
  }
  lines.push({ text: "" });
  lines.push({ text: new Date().toLocaleString(), center: true });
  lines.push({ text: "" });
  lines.push({ text: "¡Gracias por su compra!", center: true, bold: true });
  lines.push({ text: "" });

  return buildReceipt(lines);
}
