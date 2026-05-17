import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { InvoiceData } from "@/lib/models/invoice";

const PW = 215.9;
const PH = 279.4;
const M = 12;
const CW = PW - 2 * M;
const GRN = "#2E7D32";
const DRK = "#17231C";
const GRY = "#6B7A70";
const LGR = "#E8F0E9";
const WHT = "#FFFFFF";

async function qr(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: DRK, light: WHT } });
}

export async function generateInvoicePDF(d: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  let y = M;

  // Outer border
  doc.setDrawColor(GRN);
  doc.setLineWidth(0.3);
  doc.rect(M - 3, M - 3, CW + 6, PH - 2 * M + 6);
  doc.setLineWidth(2);
  doc.rect(M - 2, M - 2, CW + 4, 28);

  // === HEADER ===
  doc.setFontSize(18);
  doc.setTextColor(GRN);
  doc.setFont("helvetica", "bold");
  doc.text("NATURALVER'S", M + 2, M + 9);

  doc.setFontSize(7.5);
  doc.setTextColor(GRY);
  doc.setFont("helvetica", "normal");
  doc.text(`RIF: ${d.issuerRif || "J-00000000-0"}`, M + 2, M + 15);
  doc.text(`${d.issuerAddress || ""}`, M + 2, M + 19);
  doc.text(`Tel: ${d.issuerPhone || ""}`, M + 2, M + 23);

  // Invoice type badge (right side)
  doc.setFillColor(GRN);
  doc.rect(PW - M - 52, M + 1, 52, 14, "F");
  doc.setTextColor(WHT);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", PW - M - 26, M + 10, { align: "center" });

  doc.setTextColor(DRK);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`N° ${d.invoiceNumber}`, PW - M - 26, M + 19, { align: "center" });
  doc.setTextColor(GRY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Control: ${d.controlNumber}`, PW - M - 26, M + 24, { align: "center" });

  y = M + 32;

  // === DATE LINE ===
  doc.setFontSize(8);
  doc.setTextColor(GRY);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de emisión: ${d.issueDate}  ${d.issueTime}`, M, y);
  y += 5;

  // === CLIENT SECTION ===
  doc.setFillColor(LGR);
  doc.rect(M, y, CW, 28, "F");
  doc.setFontSize(9);
  doc.setTextColor(GRN);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", M + 2, y + 4);

  doc.setFontSize(8);
  doc.setTextColor(DRK);
  const ci = M + 52;

  doc.setFont("helvetica", "bold");
  doc.text("Razón Social:", M + 2, y + 10);
  doc.setFont("helvetica", "normal");
  doc.text(d.customerName, ci, y + 10);

  doc.setFont("helvetica", "bold");
  doc.text("RIF / CI:", M + 2, y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(d.customerRif || "V-00000000", ci, y + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Dirección:", M + 2, y + 20);
  doc.setFont("helvetica", "normal");
  doc.text(d.customerAddress || "", ci, y + 20);

  const ci2 = PW / 2 + 8;
  doc.setFont("helvetica", "bold");
  doc.text("Teléfono:", PW / 2 + 2, y + 10);
  doc.setFont("helvetica", "normal");
  doc.text(d.customerPhone || "", ci2, y + 10);

  if (d.customerEmail) {
    doc.setFont("helvetica", "bold");
    doc.text("Email:", PW / 2 + 2, y + 15);
    doc.setFont("helvetica", "normal");
    doc.text(d.customerEmail, ci2, y + 15);
  }

  y += 34;

  // === TABLE HEADER ===
  const colX = [M, M + 14, PW / 2 + 10, PW - M - 40, PW - M - 18];
  const colW = [12, PW / 2 - 36, 40, 22, 18];

  doc.setFillColor(GRN);
  doc.rect(colX[0], y, colW[0] + colW[1] + colW[2] + colW[3] + colW[4], 6, "F");
  doc.setTextColor(WHT);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");

  const labels = ["Cant.", "Descripción", "Presentación", "P/U ($)", "Total ($)"];
  const aligns: ("left" | "right")[] = ["left", "left", "left", "right", "right"];

  labels.forEach((l, i) => {
    let x = colX[i];
    if (aligns[i] === "right") x += colW[i];
    doc.text(l, x, y + 4, { align: aligns[i] });
  });

  y += 8;

  // === TABLE ROW ===
  doc.setFontSize(8);
  doc.setTextColor(DRK);
  doc.setFont("helvetica", "normal");

  const desc = `${d.description}`;
  doc.text(String(d.quantity), colX[0], y, { align: "left" });

  const maxDW = colW[1] - 2;
  let displayDesc = desc;
  if (doc.getTextWidth(desc) > maxDW) {
    while (doc.getTextWidth(displayDesc + "…") > maxDW && displayDesc.length > 0) {
      displayDesc = displayDesc.slice(0, -1);
    }
    displayDesc += "…";
  }
  doc.text(displayDesc, colX[1], y);

  doc.text(d.presentationName, colX[2], y);
  doc.text(d.unitPriceUSD.toFixed(2), colX[3], y, { align: "right" });
  doc.text(d.subtotalUSD.toFixed(2), colX[4], y, { align: "right" });

  y += 6;

  // Bottom line of table
  doc.setDrawColor(LGR);
  doc.setLineWidth(0.3);
  doc.line(colX[0], y, colX[0] + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y);
  y += 4;

  // === TOTALS ===
  const tx = PW - M - 5;

  function tr(label: string, value: string, bold = false, color = DRK, size = 9) {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(color);

    const vl = doc.getTextWidth(label);
    const vv = doc.getTextWidth(value);

    doc.text(label, tx - 60, y);
    doc.text(value, tx, y, { align: "right" });
    y += bold ? 6 : 4.5;
  }

  tr("Subtotal:", `$ ${d.subtotalUSD.toFixed(2)}`);

  if (d.discountPercent > 0) {
    tr(`Descuento (${d.discountPercent}%):`, `- $ ${d.discountAmount.toFixed(2)}`, false, "#C62828");
    tr("Base Imponible:", `$ ${d.taxableUSD.toFixed(2)}`);
  }

  if (d.ivaPercent > 0) {
    doc.setDrawColor(LGR);
    doc.line(tx - 60, y - 1, tx, y - 1);
    tr(`IVA ${d.ivaPercent}%:`, `$ ${d.ivaAmount.toFixed(2)}`, false, "#B26A00");
  }

  // Total
  doc.setDrawColor(GRN);
  doc.setLineWidth(0.5);
  doc.line(tx - 60, y, tx, y);
  y += 2;
  tr("TOTAL USD:", `$ ${d.totalUSD.toFixed(2)}`, true, GRN, 12);
  doc.setFontSize(8);
  tr("TOTAL Bs:", `Bs ${d.totalBs.toFixed(2)}`);
  tr(`Tasa BCV:`, `${d.exchangeRate.toFixed(2)}`);
  y += 2;

  // === PAYMENT INFO ===
  doc.setDrawColor(LGR);
  doc.line(M, y, PW - M, y);
  y += 3;

  doc.setFontSize(8);
  doc.setTextColor(DRK);
  doc.setFont("helvetica", "bold");
  doc.text("Forma de Pago:", M, y);
  doc.setFont("helvetica", "normal");
  doc.text(d.paymentType, M + 26, y);
  doc.setFont("helvetica", "bold");
  doc.text("Términos:", PW / 2, y);
  doc.setFont("helvetica", "normal");
  doc.text(d.paymentTerms, PW / 2 + 18, y);

  y += 10;

  // === QR + SIGNATURES ROW ===
  const qrSize = 22;

  // QR Code
  let qrImg: string | null = null;
  try {
    qrImg = await qr(JSON.stringify({
      rif: d.issuerRif, n: d.invoiceNumber, c: d.controlNumber,
      f: d.issueDate, cl: d.customerRif || d.customerName,
      t: d.totalUSD, i: d.ivaAmount || 0,
    }));
  } catch {}

  if (qrImg) {
    // QR box
    doc.setDrawColor(LGR);
    doc.setLineWidth(0.3);
    doc.rect(PW - M - qrSize - 6, y - 2, qrSize + 12, qrSize + 14);
    doc.addImage(qrImg, "PNG", PW - M - qrSize - 1, y + 1, qrSize, qrSize);
    doc.setFontSize(5.5);
    doc.setTextColor(GRY);
    doc.setFont("helvetica", "normal");
    doc.text("Código de verificación", PW - M - qrSize / 2 - 1, y + qrSize + 8, { align: "center" });
  }

  // Signature lines
  doc.setFontSize(8);
  doc.setTextColor(GRY);
  doc.setFont("helvetica", "normal");

  const sY = y + 12;
  doc.setDrawColor(LGR);
  doc.setLineWidth(0.5);
  doc.line(M, sY, M + 55, sY);
  doc.text("Recibí Conforme", M, sY + 4);

  doc.line(PW / 2 - 10, sY, PW / 2 + 45, sY);
  doc.text("Entregué Conforme", PW / 2 - 10, sY + 4);

  y = sY + 12;

  // === FOOTER LINE ===
  doc.setDrawColor(GRN);
  doc.setLineWidth(0.3);
  doc.line(M, y, PW - M, y);
  y += 3;

  doc.setFontSize(6.5);
  doc.setTextColor(GRY);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado: ${d.issueDate} ${d.issueTime}  |  ${d.invoiceNumber}  |  Ctrl: ${d.controlNumber}`, M, y);

  y += 4;
  doc.setFontSize(9);
  doc.setTextColor(GRN);
  doc.setFont("helvetica", "bold");
  doc.text("¡Gracias por su compra! 🌿", PW / 2, y, { align: "center" });

  return doc;
}
