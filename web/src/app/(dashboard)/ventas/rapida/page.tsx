"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import type { Product } from "@/lib/models";
import { CartProvider, useCart } from "@/lib/cart-store";
import { ProductGrid } from "@/components/sale/product-grid";
import { CartPanel } from "@/components/sale/cart-panel";
import { PaymentModal, type PaymentData } from "@/components/sale/payment-modal";
import { PosLayout } from "@/components/pos/pos-layout";
import { useBusiness } from "@/lib/business-store";
import { Check, ShoppingCart, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils";
import { fetchWithOffline, insertWithOffline } from "@/lib/offline/fetch";
import { syncPendingSales } from "@/lib/offline/sync";
import { useEmployee } from "@/lib/employee-store";

function QuickSaleInner() {
  const router = useRouter();
  const { items, totalUSD, clearCart } = useCart();
  const { employee } = useEmployee();
  const { business } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const rate = localStorage.getItem("bcv_rate");
    if (rate) setExchangeRate(Number(rate));

    fetchWithOffline<Product>("products", { order: "name" }).then((data) => {
      setProducts(data);
      if (!navigator.onLine) setOffline(true);
    });

    syncPendingSales();
  }, []);

  async function handleConfirm(payment: PaymentData) {
    for (const item of items) {
      const record = {
        product_id: item.product.id,
        product_name: item.product.name,
        presentation_id: item.presentation.id,
        presentation_name: item.presentation.name,
        quantity: item.quantity,
        payment_type: payment.paymentType,
        total_amount_usd: item.presentation.priceUSD * item.quantity,
        total_amount_bs: (item.presentation.priceUSD * item.quantity) * exchangeRate,
        exchange_rate: exchangeRate,
        mobile_amount_bs: payment.mobileBS,
        cash_amount_usd: payment.cashUSD,
        payment_reference: payment.paymentReference || null,
        payment_bank: payment.paymentBank || null,
        card_type: payment.cardType || null,
        is_wholesale: false,
        customer_name: payment.customerName || null,
        customer_phone: payment.customerPhone || null,
        employee_name: employee?.name || null,
        employee_role: employee?.role || null,
        created_at: new Date().toISOString(),
      };

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

    setConfirmed(true);
  }

  // POS mode for supermarket (Distribuidora DC)
  if (business?.slug === "bodega-derwin" && !confirmed) {
    return <PosLayout products={products} exchangeRate={exchangeRate} cashDiscount={0} />;
  }

  if (business?.slug === "naturalvers" && !confirmed) {
    return <PosLayout products={products} exchangeRate={exchangeRate} cashDiscount={0.5} />;
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold">Venta Registrada</h2>
        {offline && (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <CloudOff className="h-3.5 w-3.5" />
            Se sincronizará cuando tengas conexión
          </div>
        )}
        <p className="text-lg font-bold">{formatUSD(totalUSD)}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setConfirmed(false);
            clearCart();
          }}>
            Nueva Venta
          </Button>
          <Button onClick={() => router.push("/")}>Finalizar</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: side-by-side */}
      <div className="hidden md:flex h-[calc(100vh-8rem)] gap-4">
        <div className="flex-1 overflow-y-auto pb-4">
          <ProductGrid products={products} />
        </div>
        <div className="w-80 shrink-0 rounded-xl border border-border bg-card overflow-hidden">
          <CartPanel onCheckout={() => setShowPayment(true)} />
        </div>
      </div>

      {/* Mobile: full-width grid + floating FAB */}
      <div className="md:hidden space-y-4 pb-20">
        <ProductGrid products={products} />
      </div>

      {/* Mobile floating cart button */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={() => setShowPayment(true)}
            className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <span className="font-bold">{formatUSD(totalUSD)}</span>
          </button>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          exchangeRate={exchangeRate}
          onConfirm={handleConfirm}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
}

export default function QuickSalePage() {
  return (
    <CartProvider>
      <QuickSaleInner />
    </CartProvider>
  );
}
