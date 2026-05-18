import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { generateInvoiceNumber, generateControlNumber } from "@/lib/models/invoice";

export async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const businessId = getTenantBusinessId();

  const { data, error } = await supabase.rpc("increment_invoice_sequence", {
    p_business_id: businessId,
    p_year: year,
  });

  if (error || !data) {
    console.error("invoice sequence error, falling back to count:", error);
    const { data: fallback } = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", `${year}-01-01`)
      .lte("created_at", `${year}-12-31`);
    const next = (fallback?.length || 0) + 1;
    return generateInvoiceNumber(next);
  }

  return generateInvoiceNumber(data);
}

export async function uploadInvoicePDF(
  pdfBlob: Blob,
  invoiceNumber: string
): Promise<string | null> {
  const fileName = `invoices/${invoiceNumber}.pdf`;

  const { error } = await supabase.storage
    .from("invoices")
    .upload(fileName, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Storage upload error:", error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("invoices")
    .getPublicUrl(fileName);

  return urlData?.publicUrl || null;
}

export function getInvoiceMessage(
  invoiceNumber: string,
  totalUSD: number,
  url?: string | null
): string {
  let msg = `🧾 *FACTURA NaturalVer's*\n\n`;
  msg += `N°: ${invoiceNumber}\n`;
  msg += `Total: $${totalUSD.toFixed(2)}\n`;

  if (url) {
    msg += `\n📎 Descarga tu factura aquí:\n${url}`;
  }

  msg += `\n\n¡Gracias por tu compra! 🌿`;
  return msg;
}

export function openWhatsApp(
  phone: string,
  invoiceNumber: string,
  totalUSD: number,
  url?: string | null
) {
  const msg = encodeURIComponent(getInvoiceMessage(invoiceNumber, totalUSD, url));
  const cleanedPhone = phone.replace(/[^0-9]/g, "");
  window.open(`https://wa.me/${cleanedPhone}?text=${msg}`, "_blank");
}

export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  totalUSD: number,
  customerName: string,
  pdfBase64: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = `Factura NaturalVer's ${invoiceNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2E7D32; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">NaturalVer's</h2>
        </div>
        <div style="padding: 24px; background: #f9f9f9; border: 1px solid #ddd;">
          <p>Hola <strong>${customerName}</strong>,</p>
          <p>Gracias por tu compra. Adjuntamos la factura <strong>${invoiceNumber}</strong> por un total de <strong>$${totalUSD.toFixed(2)}</strong>.</p>
          <p>Si tienes alguna duda, no dudes en contactarnos.</p>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Este correo fue generado automáticamente por NaturalVer's POS.
          </p>
        </div>
        <div style="background: #2E7D32; color: white; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
          🌿 NaturalVer's — Productos Naturales
        </div>
      </div>
    `;

    const res = await fetch("/api/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, pdfBase64, invoiceNumber }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Error sending email" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
