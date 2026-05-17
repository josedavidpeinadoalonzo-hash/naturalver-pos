"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import type { Product, ProductPresentation } from "@/lib/models";
import type { CompanyConfig } from "@/lib/models";
import {
  ArrowLeft,
  ShoppingCart,
  FileText,
  Download,
  MessageSquare,
  Mail,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSD, formatBs } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf/invoice";
import {
  getNextInvoiceNumber,
  uploadInvoicePDF,
  openWhatsApp,
  sendInvoiceEmail,
} from "@/lib/invoice";
import {
  generateControlNumber,
} from "@/lib/models/invoice";

const MIN_WHOLESALE = 10;

type PaymentType = "mobile" | "cash" | "mixed" | "credit";

function WholesalePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<CompanyConfig | null>(null);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [step, setStep] = useState<"product" | "detail" | "confirm">("product");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPres, setSelectedPres] = useState<ProductPresentation | null>(null);
  const [quantity, setQuantity] = useState(MIN_WHOLESALE);
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerRif, setCustomerRif] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [includeIVA, setIncludeIVA] = useState(false);
  const [saving, setSaving] = useState(false);

  const [saleRecorded, setSaleRecorded] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [sentWA, setSentWA] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const rate = localStorage.getItem("bcv_rate");
    if (rate) setExchangeRate(Number(rate));
    const bId = getTenantBusinessId();
    Promise.all([
      supabase.from("products").select("*").eq("business_id", bId).order("name"),
      supabase.from("company_config").select("*").eq("business_id", bId).limit(1).single(),
    ]).then(([prods, comp]) => {
      if (prods.data) setProducts(prods.data as unknown as Product[]);
      if (comp.data) setCompany(comp.data as unknown as CompanyConfig);
    });
  }, []);

  const unitPrice = selectedPres?.wholesalePrice || selectedPres?.priceUSD || 0;
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotal * (discount / 100);
  const taxableUSD = subtotal - discountAmount;
  const ivaPercent = includeIVA ? 16 : 0;
  const ivaAmount = taxableUSD * (ivaPercent / 100);
  const totalUSD = taxableUSD + ivaAmount;
  const totalBS = totalUSD * exchangeRate;

  const handleConfirm = useCallback(async () => {
    if (!selectedProduct || !selectedPres) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();

      const invNum = await getNextInvoiceNumber();

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          business_id: getTenantBusinessId(),
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          presentation_id: selectedPres.id,
          presentation_name: selectedPres.name,
          quantity,
          payment_type: paymentType,
          total_amount_usd: totalUSD,
          total_amount_bs: totalBS,
          exchange_rate: exchangeRate,
          is_wholesale: true,
          wholesale_discount: discount,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          invoice_number: invNum,
          control_number: generateControlNumber(invNum, totalUSD),
          rif_cliente: customerRif || null,
          iva_percentage: includeIVA ? 16 : 0,
          iva_amount: ivaAmount,
          taxable_amount: taxableUSD,
          exempt_amount: includeIVA ? 0 : totalUSD,
          created_at: now,
        })
        .select()
        .single();

      if (saleError) throw saleError;
      setSaleRecorded(saleData);

      if (paymentType === "credit") {
        await tenantInsert("debts", {
          customer_name: customerName || "Cliente",
          customer_phone: customerPhone || null,
          product_name: selectedProduct.name,
          total_amount_usd: totalUSD,
          paid_amount_usd: 0,
          remaining_usd: totalUSD,
          status: "pending",
          created_at: now,
          updated_at: now,
        });
      }

      await supabase
        .from("products")
        .update({
          presentations: selectedProduct.presentations.map((p) =>
            p.id === selectedPres.id
              ? { ...p, stock: Math.max(0, p.stock - quantity) }
              : p
          ),
          updated_at: now,
        })
        .eq("id", selectedProduct.id);

      // Generate PDF
      setInvoiceNumber(invNum);

      const nowDate = new Date();
      const invData = {
        issuerName: company?.name || "NaturalVer's",
        issuerRif: company?.rif || "",
        issuerAddress: company?.address || "",
        issuerPhone: company?.phone || "",
        issuerEmail: company?.email || "",
        invoiceNumber: invNum,
        controlNumber: generateControlNumber(invNum, totalUSD),
        issueDate: nowDate.toLocaleDateString("es-VE"),
        issueTime: nowDate.toLocaleTimeString("es-VE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        customerName: customerName || "Cliente",
        customerRif: customerRif || "",
        customerAddress: customerAddress || "",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || undefined,
        description: selectedProduct.name,
        presentationName: selectedPres.name,
        quantity,
        unitPriceUSD: unitPrice,
        discountPercent: discount,
        discountAmount,
        subtotalUSD: subtotal,
        taxableUSD,
        ivaPercent,
        ivaAmount,
        totalUSD,
        totalBs: totalBS,
        exchangeRate,
        paymentType:
          paymentType === "cash"
            ? "Efectivo"
            : paymentType === "mobile"
              ? "Pago Móvil"
              : paymentType === "mixed"
                ? "Mixto"
                : "Crédito",
        paymentTerms: paymentType === "credit" ? "Pendiente de pago" : "Contado",
      };

      const pdf = await generateInvoicePDF(invData);
      const blob = pdf.output("blob");
      setPdfBlob(blob);

      // Try storage upload silently
      uploadInvoicePDF(blob, invNum).then((url) => {
        if (url) setInvoiceUrl(url);
      });

      setStep("confirm");
    } catch (err) {
      console.error("Sale error:", err);
    } finally {
      setSaving(false);
    }
  }, [
    selectedProduct,
    selectedPres,
    quantity,
    discount,
    paymentType,
    customerName,
    customerRif,
    customerAddress,
    customerPhone,
    customerEmail,
    exchangeRate,
    unitPrice,
    subtotal,
    discountAmount,
    taxableUSD,
    ivaPercent,
    ivaAmount,
    totalUSD,
    totalBS,
    company,
  ]);

  const handleDownload = useCallback(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfBlob, invoiceNumber]);

  const handleWhatsApp = useCallback(() => {
    if (!customerPhone) return;
    openWhatsApp(customerPhone, invoiceNumber, totalUSD, invoiceUrl || pdfBlob ? undefined : null);
    setSentWA(true);
  }, [customerPhone, invoiceNumber, totalUSD, invoiceUrl, pdfBlob]);

  const handleEmail = useCallback(async () => {
    if (!customerEmail || !pdfBlob) return;
    setSendingEmail(true);
    setEmailError(null);

    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await sendInvoiceEmail(
        customerEmail,
        invoiceNumber,
        totalUSD,
        customerName || "Cliente",
        base64
      );
      if (result.success) {
        setSentEmail(true);
      } else {
        setEmailError(result.error || "Error al enviar");
      }
      setSendingEmail(false);
    };
    reader.onerror = () => {
      setEmailError("Error al leer el PDF");
      setSendingEmail(false);
    };
  }, [customerEmail, invoiceNumber, totalUSD, customerName, pdfBlob]);

  // === CONFIRM SCREEN ===
  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center py-6 space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold">Venta Registrada</h2>
          <p className="text-sm text-muted-foreground">{invoiceNumber}</p>
          <p className="text-lg font-bold">{formatUSD(totalUSD)}</p>
          <p className="text-xs text-muted-foreground">
            {quantity} und · {discount}% desc.{" "}
            {includeIVA && `· IVA ${ivaPercent}% $${ivaAmount.toFixed(2)}`}
          </p>
        </div>

        <div className="space-y-2">
          <Button fullWidth variant="primary" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Descargar Factura PDF
          </Button>

          {customerPhone && (
            <Button
              fullWidth
              variant="outline"
              onClick={handleWhatsApp}
            >
              <MessageSquare className="h-4 w-4" />{" "}
              {sentWA ? "Reenviar por WhatsApp" : "Enviar por WhatsApp"}
            </Button>
          )}

          {customerEmail && (
            <Button
              fullWidth
              variant="outline"
              onClick={handleEmail}
              loading={sendingEmail}
              disabled={!pdfBlob || sendingEmail}
            >
              <Mail className="h-4 w-4" />{" "}
              {sendingEmail ? "Enviando..." : sentEmail ? "✓ Email Enviado" : "Enviar por Email"}
            </Button>
          )}
          {emailError && (
            <p className="text-xs text-danger text-center">{emailError}</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/")}
          >
            Ir al inicio
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setStep("product");
              setSelectedProduct(null);
              setSelectedPres(null);
              setQuantity(MIN_WHOLESALE);
              setDiscount(0);
              setPaymentType("cash");
              setCustomerName("");
              setCustomerRif("");
              setCustomerAddress("");
              setCustomerPhone("");
              setCustomerEmail("");
              setIncludeIVA(false);
              setInvoiceNumber("");
              setInvoiceUrl(null);
              setPdfBlob(null);
              setSentWA(false);
              setSentEmail(false);
              setSaleRecorded(null);
            }}
          >
            Nueva Venta
          </Button>
        </div>
      </div>
    );
  }

  // === STEP 1: PRODUCT SELECTION ===
  if (step === "product") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
          <h1 className="text-xl font-bold">Venta al Mayor</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <Card
              key={p.id}
              variant="elevated"
              className="cursor-pointer hover:scale-[1.01]"
              onPress={() => {
                setSelectedProduct(p);
                setSelectedPres(null);
                setStep("detail");
              }}
            >
              <CardContent>
                <h3 className="font-semibold text-sm">{p.name}</h3>
                <span className="text-xs text-muted-foreground">{p.category}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // === STEP 2: DETAIL FORM ===
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep("product")}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-xl font-bold">Venta al Mayor</h1>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {/* Presentation */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Presentación
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {selectedProduct?.presentations.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPres(p)}
                  className={`rounded-lg border px-3 py-2 text-sm text-left ${
                    selectedPres?.id === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatUSD(p.wholesalePrice || p.priceUSD)} c/u
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Cantidad (mín. {MIN_WHOLESALE})
            </label>
            <input
              type="number"
              min={MIN_WHOLESALE}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(MIN_WHOLESALE, Number(e.target.value)))
              }
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Descuento %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Fiscal Data */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-bold text-green-700 dark:text-green-400">
            Datos Fiscales del Cliente
          </h3>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Nombre / Razón Social *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: María Pérez"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              CI / RIF *
            </label>
            <input
              type="text"
              value={customerRif}
              onChange={(e) => setCustomerRif(e.target.value)}
              placeholder="Ej: V-12345678"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Dirección *
            </label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Dirección completa"
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Teléfono *
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0412-1234567"
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment + IVA */}
      <Card>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Tipo de Pago
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["cash", "mobile", "mixed", "credit"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPaymentType(t)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    paymentType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t === "cash"
                    ? "Efectivo"
                    : t === "mobile"
                      ? "Pago Móvil"
                      : t === "mixed"
                        ? "Mixto"
                        : "Crédito"}
                </button>
              ))}
            </div>
          </div>

          {/* IVA Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <span className="text-sm font-medium">Incluir IVA (16%)</span>
              <p className="text-xs text-muted-foreground">
                {includeIVA
                  ? `Monto IVA: $${ivaAmount.toFixed(2)}`
                  : "Producto exento de IVA"}
              </p>
            </div>
            <button
              onClick={() => setIncludeIVA(!includeIVA)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                includeIVA ? "bg-primary" : "bg-muted/30"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  includeIVA ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Price Summary */}
      {totalUSD > 0 && (
        <Card variant="elevated">
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatUSD(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-danger">
                <span>Descuento ({discount}%)</span>
                <span>-{formatUSD(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Base Imponible</span>
              <span>{formatUSD(taxableUSD)}</span>
            </div>
            {includeIVA && (
              <div className="flex justify-between text-sm text-warning">
                <span>IVA {ivaPercent}%</span>
                <span>{formatUSD(ivaAmount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-1 flex justify-between font-bold">
              <span>Total USD</span>
              <span>{formatUSD(totalUSD)}</span>
            </div>
            {exchangeRate > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Bs @ {exchangeRate.toFixed(2)}</span>
                <span>{formatBs(totalBS)}</span>
              </div>
            )}
            {paymentType === "credit" && (
              <p className="text-xs text-warning mt-1">
                * Crédito: se creará una deuda pendiente
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        fullWidth
        size="lg"
        onClick={handleConfirm}
        loading={saving}
        disabled={
          !selectedPres ||
          quantity < MIN_WHOLESALE ||
          !customerName.trim() ||
          !customerRif.trim() ||
          !customerAddress.trim() ||
          !customerPhone.trim()
        }
      >
        <FileText className="h-4 w-4" /> Facturar y Cobrar {formatUSD(totalUSD)}
      </Button>
    </div>
  );
}

export default WholesalePage;
