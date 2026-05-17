export interface SaleRow {
  id: string
  product_name: string
  presentation_name: string
  quantity: number
  payment_type: string
  total_amount_usd: number
  total_amount_bs: number
  exchange_rate: number
  customer_name: string | null
  customer_phone: string | null
  invoice_number: string | null
  control_number: string | null
  rif_cliente: string | null
  iva_percentage: number
  iva_amount: number
  taxable_amount: number
  exempt_amount: number
  document_type: string
  created_at: string
}

export interface PurchaseOrderRow {
  id: string
  supplier_name: string
  supplier_rif: string
  invoice_number: string
  invoice_date: string
  total_with_iva: number
  total_without_iva: number
  iva_total: number
  items: any[]
  exchange_rate: number
  created_at: string
}

export interface CompanyData {
  rif: string
  name: string
  address: string
  phone: string
  email: string
}

function esc(text: string | number | null | undefined): string {
  if (text == null) return ""
  const str = String(text)
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function generateLibroVentasXML(
  company: CompanyData,
  yearMonth: string,
  sales: SaleRow[]
): string {
  const hasIVA = sales.some((s) => s.iva_percentage > 0)
  const totalExento = sales.reduce((sum, s) => sum + Number(s.exempt_amount || 0), 0)
  const totalBase = sales.reduce((sum, s) => sum + Number(s.taxable_amount || 0), 0)
  const totalIVA = sales.reduce((sum, s) => sum + Number(s.iva_amount || 0), 0)
  const total = totalExento + totalBase + totalIVA
  const totalBaseRet = sales
    .filter((s) => s.iva_percentage > 0)
    .reduce((sum, s) => sum + Number(s.taxable_amount || 0), 0)

  const header = `<?xml version="1.0" encoding="ISO-8859-1"?>
<LibroVentas xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Encabezado>
    <RifEmisor>${esc(company.rif)}</RifEmisor>
    <NombreEmisor>${esc(company.name)}</NombreEmisor>
    <Periodo>${esc(yearMonth)}</Periodo>
  </Encabezado>
  <Resumen>
    <CantidadOperaciones>${sales.length}</CantidadOperaciones>
    <TotalExento>${totalExento.toFixed(2)}</TotalExento>
    <TotalBaseImponible>${totalBase.toFixed(2)}</TotalBaseImponible>
    <TotalIVA>${totalIVA.toFixed(2)}</TotalIVA>
    <Total>${total.toFixed(2)}</Total>
    <TotalBaseRetencionIVA>${totalBaseRet.toFixed(2)}</TotalBaseRetencionIVA>
  </Resumen>
  <Operaciones>`

  const ops = sales
    .flatMap((s) => {
      if (!hasIVA || s.iva_percentage === 0) {
        return [
          `    <Operacion>
      <TipoDocumento>${esc(s.document_type)}</TipoDocumento>
      <NumeroDocumento>${esc(s.invoice_number || s.id.slice(0, 8))}</NumeroDocumento>
      <NumeroControl>${esc(s.control_number || "")}</NumeroControl>
      <FechaEmision>${fmtDate(s.created_at)}</FechaEmision>
      <RifCliente>${esc(s.rif_cliente || "V-99999999")}</RifCliente>
      <DenominacionCliente>${esc(s.customer_name || "CONSUMIDOR FINAL")}</DenominacionCliente>
      <MontoExento>${Number(s.total_amount_usd).toFixed(2)}</MontoExento>
      <BaseImponible>0.00</BaseImponible>
      <Iva>0.00</Iva>
      <Total>${Number(s.total_amount_usd).toFixed(2)}</Total>
    </Operacion>`,
        ]
      }
      return [
        `    <Operacion>
      <TipoDocumento>${esc(s.document_type)}</TipoDocumento>
      <NumeroDocumento>${esc(s.invoice_number || s.id.slice(0, 8))}</NumeroDocumento>
      <NumeroControl>${esc(s.control_number || "")}</NumeroControl>
      <FechaEmision>${fmtDate(s.created_at)}</FechaEmision>
      <RifCliente>${esc(s.rif_cliente || "V-99999999")}</RifCliente>
      <DenominacionCliente>${esc(s.customer_name || "CONSUMIDOR FINAL")}</DenominacionCliente>
      <MontoExento>${Number(s.exempt_amount || 0).toFixed(2)}</MontoExento>
      <BaseImponible>${Number(s.taxable_amount || 0).toFixed(2)}</BaseImponible>
      <Iva>${Number(s.iva_amount || 0).toFixed(2)}</Iva>
      <Total>${Number(s.total_amount_usd || s.taxable_amount || 0).toFixed(2)}</Total>
    </Operacion>`,
      ]
    })
    .join("\n")

  const footer = `
  </Operaciones>
</LibroVentas>`

  return header + "\n" + ops + "\n" + footer
}

export function generateLibroComprasXML(
  company: CompanyData,
  yearMonth: string,
  purchases: PurchaseOrderRow[]
): string {
  const totalExento = 0
  const totalBase = purchases.reduce((sum, p) => sum + Number(p.total_without_iva || 0), 0)
  const totalIVA = purchases.reduce((sum, p) => sum + Number(p.iva_total || 0), 0)
  const total = totalExento + totalBase + totalIVA

  const header = `<?xml version="1.0" encoding="ISO-8859-1"?>
<LibroCompras xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Encabezado>
    <RifEmisor>${esc(company.rif)}</RifEmisor>
    <NombreEmisor>${esc(company.name)}</NombreEmisor>
    <Periodo>${esc(yearMonth)}</Periodo>
  </Encabezado>
  <Resumen>
    <CantidadOperaciones>${purchases.length}</CantidadOperaciones>
    <TotalExento>${totalExento.toFixed(2)}</TotalExento>
    <TotalBaseImponible>${totalBase.toFixed(2)}</TotalBaseImponible>
    <TotalIVA>${totalIVA.toFixed(2)}</TotalIVA>
    <Total>${total.toFixed(2)}</Total>
  </Resumen>
  <Operaciones>`

  const ops = purchases
    .map(
      (p) => `    <Operacion>
      <TipoDocumento>01</TipoDocumento>
      <NumeroDocumento>${esc(p.invoice_number || p.id.slice(0, 8))}</NumeroDocumento>
      <FechaEmision>${fmtDate(p.invoice_date || p.created_at)}</FechaEmision>
      <RifProveedor>${esc(p.supplier_rif || "J-99999999-9")}</RifProveedor>
      <DenominacionProveedor>${esc(p.supplier_name)}</DenominacionProveedor>
      <MontoExento>${totalExento.toFixed(2)}</MontoExento>
      <BaseImponible>${Number(p.total_without_iva || 0).toFixed(2)}</BaseImponible>
      <Iva>${Number(p.iva_total || 0).toFixed(2)}</Iva>
      <Total>${Number(p.total_with_iva || 0).toFixed(2)}</Total>
    </Operacion>`
    )
    .join("\n")

  const footer = `
  </Operaciones>
</LibroCompras>`

  return header + "\n" + ops + "\n" + footer
}

export function getYearMonth(date?: Date): string {
  const d = date || new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
}
