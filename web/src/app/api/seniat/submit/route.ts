import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceNumber } = body;

    if (!invoiceNumber) {
      return NextResponse.json(
        { success: false, message: "Número de factura requerido" },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual SENIAT API endpoint
    // For now, simulate a successful submission
    console.log(`SENIAT: Invoice ${invoiceNumber} submitted successfully`);

    return NextResponse.json({
      success: true,
      message: `Factura ${invoiceNumber} registrada en SENIAT`,
      receiptCode: `SENIAT-${Date.now()}`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
