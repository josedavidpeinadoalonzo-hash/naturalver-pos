export interface InvoiceData {
  issuerName: string;
  issuerRif: string;
  issuerAddress: string;
  issuerPhone: string;
  issuerEmail: string;

  invoiceNumber: string;
  controlNumber: string;
  issueDate: string;
  issueTime: string;

  customerName: string;
  customerRif: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail?: string;

  description: string;
  presentationName: string;
  quantity: number;
  unitPriceUSD: number;
  discountPercent: number;
  discountAmount: number;
  subtotalUSD: number;
  taxableUSD: number;
  ivaPercent: number;
  ivaAmount: number;
  totalUSD: number;
  totalBs: number;
  exchangeRate: number;

  paymentType: string;
  paymentTerms: string;
}

export function generateControlNumber(invoiceNumber: string, totalUSD: number): string {
  const hash = Array.from(invoiceNumber + totalUSD.toFixed(2))
    .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `CTRL-${hex.slice(0, 8)}`;
}

export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `FAC-${year}-${String(sequence).padStart(5, "0")}`;
}
