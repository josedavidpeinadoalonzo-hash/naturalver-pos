"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Product } from "@/lib/models";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { useEmployee } from "@/lib/employee-store";
import { useBusiness } from "@/lib/business-store";
import { fetchWithOffline, insertWithOffline } from "@/lib/offline/fetch";
import { syncPendingSales } from "@/lib/offline/sync";
import { formatUSD } from "@/lib/utils";
import { playBeep, playErrorBeep } from "@/lib/beep";
import { getNextInvoiceNumber } from "@/lib/invoice";
import { Check, CloudOff, History, RotateCcw, Pause, Play, Eye, X, Trash2, RefreshCw, DollarSign, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeInput } from "./barcode-input";
import { Numpad } from "./numpad";
import { ReceiptPanel } from "./receipt-panel";
import { ProductPanel } from "./product-panel";
import { PosPayment, type PosPaymentData } from "./pos-payment";
import { PriceSelector, type PriceTier } from "./price-selector";
import { CurrencySelector, type CurrencyCode } from "./currency-selector";
import { BarcodeScanner } from "@/components/sale/barcode-scanner";

interface PosLayoutProps {
  products: Product[];
  exchangeRate: number;
  cashDiscount?: number;
}

interface HeldSale {
  id: string;
  items: { product: Product; presentation: Product["presentations"][0]; quantity: number; discount?: number }[];
  globalDiscount: number;
  createdAt: string;
}

export function PosLayout({ products, exchangeRate: initialRate, cashDiscount = 0 }: PosLayoutProps) {
  const { items, totalUSD, clearCart, addItem, globalDiscount, setGlobalDiscount } = useCart();
  const { employee } = useEmployee();
  const { business } = useBusiness();
  const [quantity, setQuantity] = useState(1);
  const [priceTier, setPriceTier] = useState<PriceTier>("P1");
  const [currency, setCurrency] = useState<CurrencyCode>("VES");
  const [ivaPercent, setIvaPercent] = useState(16);
  const [copRate, setCopRate] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(initialRate);
  const [showHistory, setShowHistory] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showReturns, setShowReturns] = useState(false);
  const [returnCode, setReturnCode] = useState("");
  const [returnData, setReturnData] = useState<any>(null);
  const [showStockInfo, setShowStockInfo] = useState<Product | null>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");

  const mobileResults = useMemo(() => {
    if (!mobileQuery.trim()) return [];
    const q = mobileQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }, [products, mobileQuery]);

  function basePrice(pres: Product["presentations"][0]): number {
    if (pres.exento || ivaPercent === 0) return pres.priceUSD;
    return pres.priceUSD / (1 + ivaPercent / 100);
  }

  const ivaAmount = useMemo(() => {
    const taxable = items
      .filter(i => !i.presentation.exento)
      .reduce((s, i) => s + Math.max(0, basePrice(i.presentation) - (i.discount || 0)) * i.quantity, 0);
    return (taxable * ivaPercent) / 100;
  }, [items, ivaPercent]);

  const totalWithIVA = totalUSD + ivaAmount;

  useEffect(() => {
    const rate = localStorage.getItem("bcv_rate");
    if (rate) setExchangeRate(Number(rate));
    const cop = localStorage.getItem("cop_rate");
    if (cop) setCopRate(Number(cop));
    syncPendingSales();
    loadHeldSales();
    loadIvaPercent();
  }, []);

  async function loadIvaPercent() {
    try {
      const bid = await getTenantBusinessId();
      const { data } = await supabase
        .from("business_config")
        .select("value")
        .eq("business_id", bid)
        .eq("key", "iva_percent")
        .single();
      if (data?.value) setIvaPercent(Number(data.value));
    } catch {}
  }

  function loadHeldSales() {
    try {
      const stored = localStorage.getItem("pos_held_sales");
      if (stored) setHeldSales(JSON.parse(stored));
    } catch {}
  }

  function saveHeldSales(sales: HeldSale[]) {
    localStorage.setItem("pos_held_sales", JSON.stringify(sales));
    setHeldSales(sales);
  }

  function findProductByBarcode(code: string): Product | null {
    const found = products.find((p) => p.barcode === code);
    if (!found) {
      const byName = products.find((p) =>
        p.name.toLowerCase().includes(code.toLowerCase())
      );
      return byName || null;
    }
    return found;
  }

  function addToCart(product: Product) {
    const pres = product.presentations.length === 1
      ? product.presentations[0]
      : product.presentations[0];
    for (let i = 0; i < quantity; i++) {
      addItem(product, pres);
    }
    playBeep();
    setQuantity(1);
  }

  function handleBarcode(code: string) {
    const product = findProductByBarcode(code);
    if (product) {
      addToCart(product);
    } else {
      playErrorBeep();
    }
  }

  function handleOpenScanner() {
    setShowScanner(true);
  }

  function handleScannerDetected(code: string) {
    setShowScanner(false);
    handleBarcode(code);
  }

  function handleHoldSale() {
    if (items.length === 0) return;
    const held: HeldSale = {
      id: Date.now().toString(),
      items: items.map((i) => ({
        product: i.product,
        presentation: i.presentation,
        quantity: i.quantity,
        discount: i.discount,
      })),
      globalDiscount,
      createdAt: new Date().toLocaleString(),
    };
    saveHeldSales([...heldSales, held]);
    clearCart();
  }

  function handleResumeSale(held: HeldSale) {
    clearCart();
    for (const item of held.items) {
      const product = products.find((p) => p.id === item.product.id);
      if (product) {
        const pres = product.presentations.find((p) => p.id === item.presentation.id);
        if (pres) {
          for (let i = 0; i < item.quantity; i++) {
            addItem(product, pres);
          }
        }
      }
    }
    if (held.globalDiscount > 0) {
      setGlobalDiscount(held.globalDiscount);
    }
    const updated = heldSales.filter((h) => h.id !== held.id);
    saveHeldSales(updated);
  }

  function handleDeleteHeld(id: string) {
    saveHeldSales(heldSales.filter((h) => h.id !== id));
  }

  async function loadRecentSales() {
    setShowHistory(true);
    try {
      const businessId = await getTenantBusinessId();
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20);
      setRecentSales(data || []);
    } catch {
      setRecentSales([]);
    }
  }

  async function handleReturnLookup() {
    if (!returnCode.trim()) return;
    try {
      const businessId = await getTenantBusinessId();
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("business_id", businessId)
        .eq("product_name", returnCode.trim())
        .order("created_at", { ascending: false })
        .limit(5);
      if (data && data.length > 0) {
        setReturnData(data);
      } else {
        setReturnData([]);
      }
    } catch {
      setReturnData([]);
    }
  }

  async function handleReturn(sale: any) {
    const record = {
      ...sale,
      id: undefined,
      document_type: "02",
      quantity: -sale.quantity,
      total_amount_usd: -(sale.total_amount_usd || 0),
      total_amount_bs: -(sale.total_amount_bs || 0),
      cash_amount_usd: -(sale.cash_amount_usd || 0),
      mobile_amount_bs: -(sale.mobile_amount_bs || 0),
      discount_amount: -(sale.discount_amount || 0),
      created_at: new Date().toISOString(),
    };
    await insertWithOffline("sales", record);
    setReturnData(null);
    setReturnCode("");
    alert("Devolución registrada");

    if (navigator.onLine) {
      await supabase
        .from("products")
        .update({
          presentations: sale.product_presentations
            ? sale.product_presentations
            : [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", sale.product_id);
    }
  }

  const handleConfirm = useCallback(async (payment: PosPaymentData) => {
    const rifCliente = payment.customerRif || null;
    let invoiceNumber: string | null = null;
    let controlNumber: string | null = null;
    if (payment.generateInvoice) {
      invoiceNumber = await getNextInvoiceNumber();
      const { generateControlNumber } = await import("@/lib/models/invoice");
      controlNumber = generateControlNumber(invoiceNumber, totalUSD);
      localStorage.setItem("last_invoice_number", invoiceNumber);
      localStorage.setItem("last_control_number", controlNumber!);
    } else {
      localStorage.removeItem("last_invoice_number");
      localStorage.removeItem("last_control_number");
    }

    let taxableTotal = 0;
    let exemptTotal = 0;

    for (const item of items) {
      const itemBase = item.presentation.exento || ivaPercent === 0
        ? item.presentation.priceUSD
        : item.presentation.priceUSD / (1 + ivaPercent / 100);
      const unitPrice = itemBase - (item.discount || 0);
      const lineTotal = Math.max(0, unitPrice) * item.quantity;
      if (item.presentation.exento) {
        exemptTotal += lineTotal;
      } else {
        taxableTotal += lineTotal;
      }
      const record: Record<string, any> = {
        product_id: item.product.id,
        product_name: item.product.name,
        presentation_id: item.presentation.id,
        presentation_name: item.presentation.name,
        quantity: item.quantity,
        payment_type: payment.paymentType,
        total_amount_usd: lineTotal,
        total_amount_bs: lineTotal * exchangeRate,
        exchange_rate: exchangeRate,
        mobile_amount_bs: payment.mobileBS,
        cash_amount_usd: payment.cashUSD,
        payment_reference: payment.paymentReference || null,
        payment_bank: payment.paymentBank || null,
        card_type: payment.cardType || null,
        is_wholesale: false,
        wholesale_discount: 0,
        customer_name: payment.customerName || null,
        rif_cliente: rifCliente,
        discount_amount: globalDiscount > 0 ? globalDiscount / items.length : 0,
        employee_name: employee?.name || null,
        employee_role: employee?.role || null,
        invoice_number: invoiceNumber,
        control_number: controlNumber,
        document_type: "01",
        created_at: new Date().toISOString(),
      };

      const bid = await getTenantBusinessId();
      if (bid) record.business_id = bid;

      const inserted = await insertWithOffline("sales", record);

      if (inserted && navigator.onLine) {
        await supabase
          .from("products")
          .update({
            presentations: item.product.presentations.map((p) =>
              p.id === item.presentation.id
                ? { ...p, stock: Math.max(0, p.stock - item.quantity) }
                : p
            ),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.product.id);
      }
    }

    if (payment.generateInvoice && invoiceNumber && controlNumber && navigator.onLine) {
      try {
        const bid = await getTenantBusinessId();
        const { data: config } = await supabase
          .from("business_config")
          .select("value")
          .eq("business_id", bid)
          .eq("key", "iva_percent")
          .single();
        const ivaRate = Number(config?.value || 16);
        const ivaAmount = (taxableTotal * ivaRate) / 100;
        const { submitToSENIAT } = await import("@/lib/seniat/api");
        await submitToSENIAT({
          invoiceNumber,
          controlNumber,
          documentType: "01",
          issueDate: new Date().toISOString().split("T")[0],
          sellerRif: localStorage.getItem("business_rif") || "",
          sellerName: localStorage.getItem("business_name") || "",
          buyerRif: rifCliente || "V-00000000-0",
          buyerName: payment.customerName || "Consumidor Final",
          items: items.map((i) => {
            const iBase = i.presentation.exento || ivaRate === 0
              ? i.presentation.priceUSD
              : i.presentation.priceUSD / (1 + ivaRate / 100);
            const iEff = iBase - (i.discount || 0);
            return {
              description: i.product.name,
              quantity: i.quantity,
              unitPrice: iBase,
              exemptAmount: i.presentation.exento ? iEff * i.quantity : 0,
              taxableAmount: i.presentation.exento ? 0 : iEff * i.quantity,
              ivaAmount: i.presentation.exento ? 0 : (iEff * i.quantity * ivaRate) / 100,
              totalAmount: iEff * i.quantity,
            };
          }),
          subtotal: totalUSD,
          exemptAmount: exemptTotal,
          taxableAmount: taxableTotal,
          ivaRate,
          ivaAmount,
          totalAmount: totalUSD,
          exchangeRate,
          currency: "USD",
        });
      } catch {}
    }

    setConfirmed(true);
  }, [items, exchangeRate, employee, globalDiscount]);

  function handleProductInfo(product: Product) {
    setShowStockInfo(product);
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 animate-in zoom-in">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Venta Registrada</h2>
        {offline && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <CloudOff className="h-3.5 w-3.5" />
            Se sincronizará cuando tengas conexión
          </div>
        )}
        <p className="text-lg font-bold">{formatUSD(totalWithIVA)}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setConfirmed(false);
            clearCart();
          }}>
            Nueva Venta
          </Button>
          <Button onClick={() => window.location.href = "/"}>Finalizar</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop POS */}
      <div className="hidden md:flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold">{business?.name || "POS"}</h2>
              <p className="text-[10px] text-muted-foreground">
                {new Date().toLocaleDateString("es-VE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySelector
              active={currency}
              onChange={setCurrency}
              exchangeRateVES={exchangeRate}
              exchangeRateCOP={copRate}
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 rounded-lg px-2.5 py-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>VES: <strong className="text-foreground">{exchangeRate.toFixed(2)}</strong></span>
              {copRate > 0 && (
                <span className="ml-1">COP: <strong className="text-foreground">{copRate.toFixed(2)}</strong></span>
              )}
            </div>
            {employee?.name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 rounded-lg px-2.5 py-1.5">
                <User className="h-3.5 w-3.5" />
                <span><strong className="text-foreground">{employee.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 gap-3 min-h-0">
          {/* Left: Receipt */}
          <div className="w-[45%] shrink-0">
            <ReceiptPanel
              onCheckout={() => setShowPayment(true)}
              currency={currency}
              ivaPercent={ivaPercent}
              exchangeRate={exchangeRate}
              ivaAmount={ivaAmount}
              totalWithIVA={totalWithIVA}
            />
          </div>

          {/* Right: Scanner + Products */}
          <div className="flex flex-1 flex-col gap-3 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <BarcodeInput onBarcode={handleBarcode} onOpenScanner={handleOpenScanner} />
              <button
                onClick={handleHoldSale}
                disabled={items.length === 0}
                className="shrink-0 rounded-xl border-2 border-border/60 p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 disabled:opacity-30 transition-all"
                title="Pausar venta"
              >
                <Pause className="h-4 w-4" />
              </button>
              <button
                onClick={loadRecentSales}
                className="shrink-0 rounded-xl border-2 border-border/60 p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 transition-all"
                title="Historial de ventas"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setReturnCode(""); setReturnData(null); setShowReturns(!showReturns); }}
                className="shrink-0 rounded-xl border-2 border-border/60 p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-primary/30 transition-all"
                title="Devoluciones"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 gap-3 min-h-0">
              {/* Numpad */}
              <div className="w-44 shrink-0">
                <Numpad quantity={quantity} onChange={setQuantity} />
                {quantity > 1 && (
                  <p className="mt-1.5 text-center text-xs font-semibold text-warning bg-warning/10 rounded-lg py-1">
                    Cantidad: {quantity}
                  </p>
                )}
                {heldSales.length > 0 && (
                  <div className="mt-2 rounded-xl border-2 border-warning/30 bg-warning/5 p-2.5">
                    <p className="text-[10px] font-semibold text-warning mb-1.5 uppercase tracking-wider">Ventas en pausa</p>
                    {heldSales.map((h) => (
                      <div key={h.id} className="flex items-center justify-between py-1">
                        <button
                          onClick={() => handleResumeSale(h)}
                          className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          <Play className="h-2.5 w-2.5" />
                          {h.createdAt}
                        </button>
                        <button onClick={() => handleDeleteHeld(h.id)} className="text-danger/50 hover:text-danger transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {/* Price tier selector */}
            <div className="shrink-0">
              <PriceSelector activeTier={priceTier} onChange={setPriceTier} />
            </div>

            {/* Product quick buttons */}
            <div className="flex-1 min-w-0">
              <ProductPanel
                products={products}
                quantity={quantity}
                priceTier={priceTier}
                onProductInfo={handleProductInfo}
              />
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile POS */}
      <div className="md:hidden flex flex-col h-[calc(100vh-10rem)] gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold">{business?.name || "POS"}</h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Tasa: Bs {exchangeRate.toFixed(2)}</span>
            {employee?.name && <span>· {employee.name}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex-1">
            <BarcodeInput onBarcode={handleBarcode} onOpenScanner={handleOpenScanner} />
          </div>
          <button
            onClick={handleHoldSale}
            disabled={items.length === 0}
            className="shrink-0 rounded-xl border-2 border-border/60 p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            title="Pausar"
          >
            <Pause className="h-4 w-4" />
          </button>
          <button
            onClick={loadRecentSales}
            className="shrink-0 rounded-xl border-2 border-border/60 p-2 text-muted-foreground hover:text-foreground transition-all"
            title="Historial"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setReturnCode(""); setReturnData(null); setShowReturns(!showReturns); }}
            className="shrink-0 rounded-xl border-2 border-border/60 p-2 text-muted-foreground hover:text-foreground transition-all"
            title="Devoluciones"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Inline product search */}
          {showMobileSearch && (
            <div className="absolute inset-0 z-20 bg-background flex flex-col animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 px-1 pt-1 pb-2 border-b border-border/40">
                <input
                  type="text"
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="flex-1 rounded-xl border-2 border-primary/40 bg-muted/10 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
                <button
                  onClick={() => { setMobileQuery(""); setShowMobileSearch(false); }}
                  className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-1">
                <div className="flex items-center justify-between px-1 py-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {mobileResults.length} producto{mobileResults.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => { setMobileQuery(""); setShowMobileSearch(false); setShowProductSearch(true); }}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Ver todos
                  </button>
                </div>
                {mobileResults.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">Sin resultados</p>
                ) : (
                  <div className="space-y-1">
                    {mobileResults.map((p) => {
                      const pres = p.presentations[0];
                      const price = pres ? formatUSD(basePrice(pres)) : "";
                      return (
                        <button
                          key={p.id}
                          onClick={() => { addToCart(p); setMobileQuery(""); setShowMobileSearch(false); }}
                          className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-3 py-3 text-left text-sm hover:border-primary/40 hover:bg-muted/10 active:scale-[0.98] transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block truncate">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {pres?.name || ""} · Stock: {pres?.stock || 0}und
                            </span>
                          </div>
                          <span className="font-bold text-sm shrink-0">{price}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          <ReceiptPanel
            onCheckout={() => setShowPayment(true)}
            currency={currency}
            ivaPercent={ivaPercent}
            exchangeRate={exchangeRate}
            ivaAmount={ivaAmount}
            totalWithIVA={totalWithIVA}
          />
        </div>

        {heldSales.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {heldSales.map((h) => (
              <button
                key={h.id}
                onClick={() => handleResumeSale(h)}
                className="shrink-0 rounded-xl border-2 border-warning/30 bg-warning/5 px-3 py-1.5 text-[10px] font-medium text-primary flex items-center gap-1"
              >
                <Play className="h-2.5 w-2.5" />
                {h.createdAt}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => { setMobileQuery(""); setShowMobileSearch(true); }}
            className="rounded-xl border-2 border-border/60 px-3 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
          <div className="w-20 shrink-0">
            <Numpad quantity={quantity} onChange={setQuantity} />
          </div>
          <button
            onClick={() => setShowPayment(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all"
          >
            Cobrar {formatUSD(totalWithIVA)}
          </button>
        </div>
      </div>

      {/* Mobile product search modal */}
      {showProductSearch && (
        <div className="fixed inset-0 z-50 bg-background md:hidden flex flex-col animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <h2 className="text-sm font-bold">Buscar Productos</h2>
            <button onClick={() => setShowProductSearch(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ProductPanel
              products={products}
              quantity={quantity}
              priceTier={priceTier}
              onProductInfo={handleProductInfo}
            />
          </div>
        </div>
      )}

      {/* Sale History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-card p-6 md:rounded-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Últimas Ventas</h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin ventas recientes</p>
            ) : (
              <div className="space-y-2">
                {recentSales.map((s: any, i: number) => (
                  <div key={s.id || i} className="rounded-xl border-2 border-border/60 p-3.5 text-sm hover:bg-muted/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold truncate">{s.product_name}</span>
                      <span className="font-bold tabular-nums font-mono shrink-0 ml-2">${Number(s.total_amount_usd).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                      <span className="capitalize">{s.payment_type} · {s.quantity}und</span>
                      <span>{new Date(s.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Returns Modal */}
      {showReturns && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center" onClick={() => setShowReturns(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-card p-6 md:rounded-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Devoluciones</h2>
              <button onClick={() => setShowReturns(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={returnCode}
                onChange={(e) => setReturnCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReturnLookup()}
                placeholder="Buscar por nombre de producto..."
                className="flex-1 rounded-xl border-2 border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
              <Button onClick={handleReturnLookup} size="sm">Buscar</Button>
            </div>
            {returnData !== null && returnData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>
            )}
            {returnData && returnData.length > 0 && (
              <div className="space-y-2">
                {returnData.map((s: any, i: number) => (
                  <div key={s.id || i} className="rounded-xl border-2 border-border/60 p-3.5 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{s.product_name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.presentation_name} · {s.quantity}und · ${Number(s.total_amount_usd).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturn(s)}
                        className="text-danger border-danger/30 hover:bg-danger/5"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Devolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock info Modal */}
      {showStockInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center" onClick={() => setShowStockInfo(null)}>
          <div className="w-full max-w-sm rounded-t-2xl bg-card p-6 md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{showStockInfo.name}</h3>
              <button onClick={() => setShowStockInfo(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Categoría</span>
                <span className="font-semibold">{showStockInfo.category}</span>
              </div>
              {showStockInfo.barcode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Código de barras</span>
                  <span className="font-mono text-xs font-medium">{showStockInfo.barcode}</span>
                </div>
              )}
              <div className="border-t-2 border-border/40 pt-3 mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Presentaciones / Stock</p>
                {showStockInfo.presentations.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                    <span className="font-medium">{p.name}</span>
                    <span className={p.stock <= (p.lowStockThreshold || 5) ? "text-danger font-bold font-mono" : "text-success font-bold font-mono"}>
                      {p.stock}und · ${p.priceUSD.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera scanner */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScannerDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Payment modal */}
      {showPayment && (
        <PosPayment
          exchangeRate={exchangeRate}
          cashDiscount={cashDiscount}
          onConfirm={handleConfirm}
          onClose={() => setShowPayment(false)}
          totalWithIVA={totalWithIVA}
          ivaAmount={ivaAmount}
        />
      )}
    </>
  );
}
