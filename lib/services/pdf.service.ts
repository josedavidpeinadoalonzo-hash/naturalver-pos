import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Sale, Product, ProductPresentation, CompanyConfig, Customer } from '../models';

class PdfService {
  async generateInvoice(
    sale: Sale,
    product: Product,
    presentation: ProductPresentation,
    company: CompanyConfig | null,
    customer?: Customer | null
  ): Promise<string> {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .company-info { flex: 1; }
            .invoice-info { text-align: right; }
            .logo { max-width: 150px; margin-bottom: 10px; }
            h1 { color: #10B981; margin: 0; font-size: 24px; }
            .section { margin-bottom: 30px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 10px; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f8f8f8; text-align: left; padding: 12px; border-bottom: 2px solid #eee; font-size: 14px; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row.grand-total { border-top: 2px solid #10B981; margin-top: 10px; padding-top: 15px; font-weight: bold; font-size: 18px; color: #10B981; }
            .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${company?.logoUri ? `<img src="${company.logoUri}" class="logo" />` : ''}
              <h1>${company?.name || "NaturalVer's"}</h1>
              <p>${company?.rif || ''}</p>
              <p>${company?.address || ''}</p>
              <p>${company?.phone || ''}</p>
            </div>
            <div class="invoice-info">
              <h2 style="margin: 0; color: #666;">FACTURA</h2>
              <p style="margin: 5px 0;">#${sale.id.slice(-8).toUpperCase()}</p>
              <p style="margin: 5px 0;">Fecha: ${new Date(sale.createdAt).toLocaleDateString('es-VE')}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Cliente</div>
            <p><strong>Nombre:</strong> ${customer?.name || sale.customerName || 'Cliente General'}</p>
            ${customer?.idCard ? `<p><strong>CI / RIF:</strong> ${customer.idCard}</p>` : ''}
            ${customer?.address ? `<p><strong>Dirección:</strong> ${customer.address}</p>` : ''}
            ${customer?.phone || sale.customerPhone ? `<p><strong>Teléfono:</strong> ${customer?.phone || sale.customerPhone}</p>` : ''}
            ${customer?.email ? `<p><strong>Correo:</strong> ${customer.email}</p>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${product.name} - ${presentation.name}</td>
                <td style="text-align: center;">${sale.quantity}</td>
                <td style="text-align: right;">$${presentation.priceUSD.toFixed(2)}</td>
                <td style="text-align: right;">$${(presentation.priceUSD * sale.quantity).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${(presentation.priceUSD * sale.quantity).toFixed(2)}</span>
            </div>
            ${sale.wholesaleDiscount ? `
            <div class="total-row" style="color: #EF4444;">
              <span>Descuento (${sale.wholesaleDiscount}%):</span>
              <span>-$${((presentation.priceUSD * sale.quantity * sale.wholesaleDiscount) / 100).toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL USD:</span>
              <span>$${sale.totalAmountUSD.toFixed(2)}</span>
            </div>
            <div class="total-row" style="font-weight: bold; color: #3B82F6;">
              <span>TOTAL BS:</span>
              <span>${sale.totalAmountBS.toFixed(2)} Bs</span>
            </div>
            <div style="text-align: right; font-size: 10px; color: #999; margin-top: 5px;">
              Tasa: ${sale.exchangeRate.toFixed(2)} Bs/$
            </div>
          </div>

          <div class="footer">
            <p>Gracias por su compra. Para cualquier duda, contáctenos.</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }

  async sharePdf(uri: string, filename: string = 'factura.pdf'): Promise<void> {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('El intercambio no está disponible en este dispositivo');
    }
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Factura PDF', UTI: 'com.adobe.pdf' });
  }

  async generateDailyReport(
    sales: Sale[],
    expenses: any[],
    summary: any,
    company: CompanyConfig | null
  ): Promise<string> {
    // Similar to invoice but for daily report
    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #10B981; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 20px; }
            .stat { flex: 1; min-width: 120px; }
            .stat-val { font-size: 20px; font-weight: bold; color: #10B981; }
          </style>
        </head>
        <body>
          <h1>Reporte Diario - ${new Date().toLocaleDateString('es-VE')}</h1>
          <p><strong>Empresa:</strong> ${company?.name || "NaturalVer's"}</p>
          
          <div class="summary">
            <div class="stat"><div class="stat-label">Total Ventas</div><div class="stat-val">$${summary.totalSales.toFixed(2)}</div></div>
            <div class="stat"><div class="stat-label">Total Gastos</div><div class="stat-val" style="color: #EF4444;">$${(summary.totalExpenses || 0).toFixed(2)}</div></div>
            <div class="stat"><div class="stat-label">Ganancia Neta</div><div class="stat-val">${(summary.totalSales - (summary.totalExpenses || 0)).toFixed(2)}</div></div>
          </div>

          <h2>Detalle de Ventas</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Monto USD</th>
                <th>Monto BS</th>
                <th>Tipo Pago</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(s => `
                <tr>
                  <td>${s.id.slice(-6).toUpperCase()}</td>
                  <td>${s.customerName || 'General'}</td>
                  <td>$${s.totalAmountUSD.toFixed(2)}</td>
                  <td>${s.totalAmountBS.toFixed(2)} Bs</td>
                  <td>${s.paymentType}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  }
}

export const pdfService = new PdfService();
