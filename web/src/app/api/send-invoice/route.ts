import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "NaturalVer's";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, pdfBase64, invoiceNumber } = await request.json();

    if (!to || !subject || !html || !pdfBase64 || !invoiceNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return NextResponse.json({ error: data.message || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("Send invoice error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
