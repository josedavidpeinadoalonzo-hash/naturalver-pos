import ExcelJS from "exceljs";

const GREEN = "2E7D32";
const DARK = "17231C";
const GRAY = "6B7A70";
const LGRAY = "F5F7F5";
const WHITE = "FFFFFF";

interface SaleRow {
  created_at: string;
  product_name: string;
  presentation_name: string;
  quantity: number;
  total_amount_usd: number;
  total_amount_bs: number;
  payment_type: string;
  customer_name: string | null;
  is_wholesale: boolean;
  wholesale_discount: number;
}

export async function generateSalesReport(
  sales: SaleRow[],
  periodLabel: string,
  summary: {
    totalUSD: number;
    totalBs: number;
    totalCash: number;
    totalMobile: number;
    totalCredit: number;
    totalMixed: number;
    transactionCount: number;
    totalProducts: number;
  },
  company: { name?: string; rif?: string; address?: string; phone?: string }
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NaturalVer's POS";
  wb.created = new Date();
  const ws = wb.addWorksheet("Reporte de Ventas", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  // Column widths
  ws.getColumn(1).width = 4;   // #
  ws.getColumn(2).width = 14;  // Fecha
  ws.getColumn(3).width = 10;  // Hora
  ws.getColumn(4).width = 24;  // Producto
  ws.getColumn(5).width = 16;  // Presentación
  ws.getColumn(6).width = 9;   // Cant
  ws.getColumn(7).width = 14;  // Monto USD
  ws.getColumn(8).width = 14;  // Monto Bs
  ws.getColumn(9).width = 14;  // Tipo Pago
  ws.getColumn(10).width = 20; // Cliente
  ws.getColumn(11).width = 8;  // Desc.

  let r = 1;

  // ===== HEADER =====
  ws.mergeCells(r, 1, r, 11);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = company.name || "NaturalVer's";
  titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: GREEN } };
  r++;

  ws.mergeCells(r, 1, r, 11);
  const rifCell = ws.getCell(r, 1);
  rifCell.value = `RIF: ${company.rif || ""}${company.address ? ` | ${company.address}` : ""}${company.phone ? ` | Tel: ${company.phone}` : ""}`;
  rifCell.font = { name: "Calibri", size: 10, color: { argb: GRAY } };
  r++;
  r++;

  // ===== TITLE =====
  ws.mergeCells(r, 1, r, 11);
  const reportTitle = ws.getCell(r, 1);
  reportTitle.value = "REPORTE DE VENTAS";
  reportTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: DARK } };
  reportTitle.alignment = { horizontal: "center" };
  r++;

  ws.mergeCells(r, 1, r, 11);
  const periodCell = ws.getCell(r, 1);
  periodCell.value = `Período: ${periodLabel}`;
  periodCell.font = { name: "Calibri", size: 11, color: { argb: GRAY } };
  periodCell.alignment = { horizontal: "center" };
  r++;
  r++;

  // ===== SUMMARY SECTION =====
  const summaryHeader = (label: string, value: string, col: number) => {
    const c = ws.getCell(r, col);
    c.value = label;
    c.font = { name: "Calibri", size: 9, color: { argb: GRAY } };
    c.alignment = { horizontal: "center" };

    const v = ws.getCell(r + 1, col);
    v.value = value;
    v.font = { name: "Calibri", size: 14, bold: true, color: { argb: GREEN } };
    v.alignment = { horizontal: "center" };
  };

  ws.mergeCells(r, 1, r + 1, 1);
  const sumLabel = ws.getCell(r, 1);
  sumLabel.value = "RESUMEN";
  sumLabel.font = { name: "Calibri", size: 11, bold: true, color: { argb: DARK } };
  sumLabel.alignment = { vertical: "middle" };

  summaryHeader("Total Ventas", `$${summary.totalUSD.toFixed(2)}`, 3);
  summaryHeader("Transacciones", `${summary.transactionCount}`, 5);
  summaryHeader("Efectivo", `$${summary.totalCash.toFixed(2)}`, 7);
  summaryHeader("Pago Móvil", `$${summary.totalMobile.toFixed(2)}`, 9);
  summaryHeader("Productos Vend.", `${summary.totalProducts}`, 11);

  // Merge summary value cells for visual grouping
  ws.mergeCells(r, 3, r + 1, 4);
  ws.mergeCells(r, 5, r + 1, 6);
  ws.mergeCells(r, 7, r + 1, 8);
  ws.mergeCells(r, 9, r + 1, 10);

  // Summary row background
  [3, 5, 7, 9].forEach((c) => {
    for (let i = 0; i < 2; i++) {
      const cell = ws.getCell(r + i, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EBF5EB" } };
      cell.border = {
        top: { style: "thin", color: { argb: GREEN } },
        bottom: { style: "thin", color: { argb: GREEN } },
        left: { style: "thin", color: { argb: GREEN } },
        right: { style: "thin", color: { argb: GREEN } },
      };
    }
  });

  r += 3;
  r++;

  // Payment type breakdown
  ws.mergeCells(r, 1, r, 11);
  const breakdownLabel = ws.getCell(r, 1);
  breakdownLabel.value = `Desglose: Efectivo $${summary.totalCash.toFixed(2)} | Pago Móvil $${summary.totalMobile.toFixed(2)} | Mixto $${summary.totalMixed.toFixed(2)} | Crédito $${summary.totalCredit.toFixed(2)}`;
  breakdownLabel.font = { name: "Calibri", size: 10, color: { argb: GRAY } };
  r++;
  r++;

  // ===== TABLE HEADER =====
  const headers = [
    "#", "Fecha", "Hora", "Producto", "Presentación",
    "Cant.", "Monto USD", "Monto Bs", "Tipo Pago", "Cliente", "Desc.%"
  ];

  const headerRow = ws.getRow(r);
  headerRow.height = 22;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.alignment = { horizontal: i >= 5 ? "right" : "left", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: GREEN } },
      bottom: { style: "thin", color: { argb: GREEN } },
      left: { style: "thin", color: { argb: WHITE } },
      right: { style: "thin", color: { argb: WHITE } },
    };
  });
  r++;

  // ===== TABLE DATA =====
  sales.forEach((sale, idx) => {
    const row = ws.getRow(r);
    row.height = 18;
    const isEven = idx % 2 === 0;
    const bgColor = isEven ? WHITE : LGRAY;

    const d = new Date(sale.created_at);

    const values = [
      idx + 1,
      d.toLocaleDateString("es-VE"),
      d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
      sale.product_name,
      sale.presentation_name,
      sale.quantity,
      Number(sale.total_amount_usd),
      Number(sale.total_amount_bs),
      sale.payment_type === "cash" ? "Efectivo"
        : sale.payment_type === "mobile" ? "Pago Móvil"
        : sale.payment_type === "mixed" ? "Mixto"
        : "Crédito",
      sale.customer_name || "",
      sale.is_wholesale ? `${sale.wholesale_discount}%` : "",
    ];

    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: DARK },
      };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = {
        horizontal: i >= 5 ? "right" : "left",
        vertical: "middle",
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "E0E0E0" } },
      };

      // Format currency columns
      if (i === 6 || i === 7) {
        cell.numFmt = i === 7 ? '#,##0.00' : '$#,##0.00';
      }
    });

    r++;
  });

  // ===== TOTAL ROW =====
  const totalRow = ws.getRow(r);
  totalRow.height = 22;
  const totalValues = [
    "", "", "", "TOTAL", "",
    sales.reduce((s, x) => s + x.quantity, 0),
    sales.reduce((s, x) => s + Number(x.total_amount_usd), 0),
    sales.reduce((s, x) => s + Number(x.total_amount_bs), 0),
    "", "", ""
  ];

  totalValues.forEach((v, i) => {
    const cell = totalRow.getCell(i + 1);
    cell.value = v;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: DARK } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8F5E9" } };
    cell.border = {
      top: { style: "medium", color: { argb: GREEN } },
      bottom: { style: "medium", color: { argb: GREEN } },
    };
    if (i === 6 || i === 7) {
      cell.numFmt = i === 7 ? '#,##0.00' : '$#,##0.00';
    }
  });

  ws.mergeCells(r, 4, r, 5);
  r++;
  r++;

  // ===== FOOTER =====
  r++;
  const footerLabel = ws.getCell(r, 1);
  footerLabel.value = `Generado el ${new Date().toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} por NaturalVer's POS`;
  footerLabel.font = { name: "Calibri", size: 9, italic: true, color: { argb: GRAY } };

  return wb;
}

export function getPeriodLabel(period: string, start: string, end: string): string {
  switch (period) {
    case "daily":
      return `Hoy, ${new Date().toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`;
    case "weekly":
      return `Semana del ${start} al ${end}`;
    case "monthly": {
      const m = new Date().toLocaleDateString("es-VE", {
        month: "long",
        year: "numeric",
      });
      return `Mes de ${m}`;
    }
    default:
      return `${start} - ${end}`;
  }
}
