import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Sale, Expense } from '../models';

type SheetRow = Record<string, string | number | boolean>;

function escapeXml(value: string | number | boolean): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildWorksheet(name: string, rows: SheetRow[]): string {
  const headers = rows[0] ? Object.keys(rows[0]) : ['Sin datos'];
  const headerCells = headers
    .map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`)
    .join('');
  const bodyRows = rows.map((row) => {
    const cells = headers
      .map((header) => {
        const value = row[header] ?? '';
        const type = typeof value === 'number' ? 'Number' : 'String';
        return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
      })
      .join('');
    return `<Row>${cells}</Row>`;
  });

  return `<Worksheet ss:Name="${escapeXml(name)}"><Table><Row>${headerCells}</Row>${bodyRows.join('')}</Table></Worksheet>`;
}

class ExcelService {
  /**
   * Genera un reporte Excel completo (Ventas, Gastos, Resumen)
   */
  async generateReport(
    sales: Sale[],
    expenses: Expense[],
    summary: any,
    title: string = 'Reporte'
  ): Promise<string> {
    // 1. Hoja de Ventas
    const salesData = sales.map(s => ({
      ID: s.id.slice(-8).toUpperCase(),
      Fecha: new Date(s.createdAt).toLocaleDateString('es-VE'),
      Hora: new Date(s.createdAt).toLocaleTimeString('es-VE'),
      Cliente: s.customerName || 'General',
      Producto: s.productName || '-',
      Cantidad: s.quantity,
      'Total USD': s.totalAmountUSD,
      'Total BS': s.totalAmountBS,
      Tasa: s.exchangeRate,
      'Tipo Pago': s.paymentType === 'cash' ? 'Efectivo' : s.paymentType === 'mobile' ? 'Pago Móvil' : 'Mixto',
      'Monto Móvil (Bs)': s.mobileAmountBS || 0,
      'Monto Efectivo ($)': s.cashAmountUSD || 0,
      Wholesale: s.isWholesale ? 'SÍ' : 'NO'
    }));
    // 2. Hoja de Gastos
    const expensesData = expenses.map(e => ({
      ID: e.id.slice(-8).toUpperCase(),
      Fecha: new Date(e.createdAt).toLocaleDateString('es-VE'),
      Descripción: e.description,
      Categoría: e.category,
      'Monto USD': e.amountUSD,
      'Monto BS': e.amountBS,
      Tasa: e.exchangeRate
    }));
    // 3. Hoja de Resumen Financiero
    const summaryData = [
      { Concepto: 'Periodo', Valor: title },
      { Concepto: 'Total Ventas ($)', Valor: summary.totalSales },
      { Concepto: 'Total Gastos ($)', Valor: summary.totalExpenses || 0 },
      { Concepto: 'Utilidad Neta ($)', Valor: summary.totalSales - (summary.totalExpenses || 0) },
      { Concepto: 'Ingreso Pago Móvil (Bs)', Valor: summary.totalMobileIncome * summary.exchangeRate || 0 },
      { Concepto: 'Ingreso Efectivo ($)', Valor: summary.totalCashIncome },
      { Concepto: 'Cantidad de Ventas', Valor: sales.length },
      { Concepto: 'Productos Vendidos', Valor: summary.productsCount }
    ];
    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${buildWorksheet('Ventas', salesData)}
  ${buildWorksheet('Gastos', expensesData)}
  ${buildWorksheet('Resumen', summaryData)}
</Workbook>`;
    const filename = `NaturalVer_${title.replace(/\s/g, '_')}_${new Date().getTime()}.xls`;
    
    // Acceso dinámico para evitar errores de tipos en compilación
    const fs = FileSystem as any;
    const uri = (fs.documentDirectory || fs.cacheDirectory || '') + filename;

    await fs.writeAsStringAsync(uri, workbook);
    return uri;
  }

  async shareExcel(uri: string): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('El intercambio no está disponible en este dispositivo');
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.ms-excel',
      dialogTitle: 'Exportar Reporte NaturalVer',
      UTI: 'com.microsoft.excel.xls'
    });
  }
}

export const excelService = new ExcelService();
