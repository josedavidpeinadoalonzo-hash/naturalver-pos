export interface SENIATInvoice {
  invoiceNumber: string;
  controlNumber: string;
  documentType: "01" | "02" | "03";
  issueDate: string;
  sellerRif: string;
  sellerName: string;
  sellerAddress?: string;
  buyerRif: string;
  buyerName: string;
  buyerAddress?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    exemptAmount: number;
    taxableAmount: number;
    ivaAmount: number;
    totalAmount: number;
  }[];
  subtotal: number;
  exemptAmount: number;
  taxableAmount: number;
  ivaRate: number;
  ivaAmount: number;
  totalAmount: number;
  exchangeRate: number;
  currency: "USD" | "VES" | "COP";
}

export async function submitToSENIAT(invoice: SENIATInvoice): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/seniat/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });
    return await response.json();
  } catch (err) {
    return { success: false, message: "Error de conexión con SENIAT" };
  }
}

export function generateSENIATXML(invoice: SENIATInvoice): string {
  const itemsXML = invoice.items
    .map(
      (item) => `
    <Detalle>
      <Descripcion>${escapeXML(item.description)}</Descripcion>
      <Cantidad>${item.quantity}</Cantidad>
      <PrecioUnitario>${item.unitPrice.toFixed(2)}</PrecioUnitario>
      <MontoExento>${item.exemptAmount.toFixed(2)}</MontoExento>
      <BaseImponible>${item.taxableAmount.toFixed(2)}</BaseImponible>
      <Iva>${item.ivaAmount.toFixed(2)}</Iva>
      <Total>${item.totalAmount.toFixed(2)}</Total>
    </Detalle>`
    )
    .join("");

  return `<?xml version="1.0" encoding="utf-8"?>
<FacturaElectronica>
  <Cabecera>
    <NumeroFactura>${escapeXML(invoice.invoiceNumber)}</NumeroFactura>
    <NumeroControl>${escapeXML(invoice.controlNumber)}</NumeroControl>
    <TipoDocumento>${invoice.documentType}</TipoDocumento>
    <FechaEmision>${invoice.issueDate}</FechaEmision>
  </Cabecera>
  <Emisor>
    <Rif>${escapeXML(invoice.sellerRif)}</Rif>
    <Nombre>${escapeXML(invoice.sellerName)}</Nombre>
    <Direccion>${escapeXML(invoice.sellerAddress || "")}</Direccion>
  </Emisor>
  <Receptor>
    <Rif>${escapeXML(invoice.buyerRif)}</Rif>
    <Nombre>${escapeXML(invoice.buyerName)}</Nombre>
    <Direccion>${escapeXML(invoice.buyerAddress || "")}</Direccion>
  </Receptor>
  <Detalles>${itemsXML}</Detalles>
  <Totales>
    <Subtotal>${invoice.subtotal.toFixed(2)}</Subtotal>
    <MontoExento>${invoice.exemptAmount.toFixed(2)}</MontoExento>
    <BaseImponible>${invoice.taxableAmount.toFixed(2)}</BaseImponible>
    <PorcentajeIva>${invoice.ivaRate.toFixed(2)}</PorcentajeIva>
    <MontoIva>${invoice.ivaAmount.toFixed(2)}</MontoIva>
    <Total>${invoice.totalAmount.toFixed(2)}</Total>
  </Totales>
</FacturaElectronica>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
