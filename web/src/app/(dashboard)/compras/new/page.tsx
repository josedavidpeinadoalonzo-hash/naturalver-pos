"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId, tenantInsert } from "@/lib/tenant-query";
import { getStoredBCVRate, getStoredCOPRate, setCOPRate } from "@/lib/services/exchange-rate";
import { ArrowLeft, Plus, Trash2, Save, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function NewPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isColombia = searchParams.get("type") === "colombia";

  const [supplierName, setSupplierName] = useState("");
  const [supplierRif, setSupplierRif] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [copRate, setCopRateState] = useState(getStoredCOPRate());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productName: string; quantity: number; costWithIVA: number; costWithoutIVA: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const ivaRate = 16;
  const exchangeRate = getStoredBCVRate();

  function addItem() {
    setItems([...items, { productName: "", quantity: 1, costWithIVA: 0, costWithoutIVA: 0 }]);
  }

  function updateItem(index: number, field: string, value: any) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === "costWithIVA") {
        newItem.costWithoutIVA = Math.round((Number(value) / (1 + ivaRate / 100)) * 100) / 100;
      }
      if (field === "costWithoutIVA") {
        newItem.costWithIVA = Math.round(Number(value) * (1 + ivaRate / 100) * 100) / 100;
      }
      return newItem;
    });
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  const totalWithIVA = items.reduce((s, i) => s + i.costWithIVA * i.quantity, 0);
  const totalWithoutIVA = items.reduce((s, i) => s + i.costWithoutIVA * i.quantity, 0);
  const ivaTotal = totalWithIVA - totalWithoutIVA;

  async function incrementStock(productName: string, quantity: number) {
    try {
      const bid = getTenantBusinessId();
      const { data: products } = await supabase
        .from("products")
        .select("id, name, presentations")
        .eq("business_id", bid)
        .ilike("name", `%${productName}%`)
        .limit(1);
      if (products && products.length > 0) {
        const product = products[0] as any;
        const presentations = product.presentations || [];
        if (presentations.length > 0) {
          presentations[0].stock = (presentations[0].stock || 0) + quantity;
          await supabase
            .from("products")
            .update({ presentations, updated_at: new Date().toISOString() })
            .eq("id", product.id);
        }
      }
    } catch {}
  }

  async function handleSave() {
    if (!supplierName.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const bId = getTenantBusinessId();

      if (isColombia) {
        const usdTotal = items.reduce((s, i) => s + i.costWithoutIVA * i.quantity, 0);
        const copTotal = copRate > 0 ? usdTotal / copRate : 0;
        const bsTotal = usdTotal * exchangeRate;

        await supabase.from("colombia_purchases").insert({
          business_id: bId,
          supplier_name: supplierName.trim(),
          invoice_number: invoiceNumber.trim(),
          total_cop: copTotal,
          exchange_rate_cop_usd: copRate,
          exchange_rate_usd_bs: exchangeRate,
          total_usd: usdTotal,
          total_bs: bsTotal,
          items: items.map(i => ({
            product_name: i.productName,
            quantity: i.quantity,
            cost_usd: i.costWithoutIVA,
            cost_cop: copRate > 0 ? i.costWithoutIVA / copRate : 0,
          })),
          notes: notes.trim(),
          created_at: new Date().toISOString(),
        });

        for (const item of items) {
          await incrementStock(item.productName, item.quantity);
        }
      } else {
        await supabase.from("purchase_orders").insert({
          business_id: bId,
          supplier_name: supplierName.trim(),
          supplier_rif: supplierRif.trim(),
          invoice_number: invoiceNumber.trim(),
          invoice_date: new Date().toISOString().split("T")[0],
          items: items.map(i => ({
            product_name: i.productName,
            quantity: i.quantity,
            cost_with_iva: i.costWithIVA,
            cost_without_iva: i.costWithoutIVA,
          })),
          total_with_iva: totalWithIVA,
          total_without_iva: totalWithoutIVA,
          iva_total: ivaTotal,
          exchange_rate: exchangeRate,
          created_at: new Date().toISOString(),
        });

        for (const item of items) {
          await incrementStock(item.productName, item.quantity);
        }
      }

      router.push("/compras");
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-xl font-bold">
          {isColombia ? "Nueva Compra Colombia" : "Nueva Orden de Compra"}
        </h1>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Proveedor *</label>
            <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nombre del proveedor" />
          </div>

          {!isColombia && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">RIF Proveedor</label>
              <input type="text" value={supplierRif} onChange={(e) => setSupplierRif(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="J-XXXXXXXX-X" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Factura N°</label>
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="N° de factura" />
          </div>

          {isColombia && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tasa COP/USD</label>
              <input type="number" step="0.000001" min="0" value={copRate}
                onChange={(e) => { const v = Number(e.target.value); setCopRateState(v); setCOPRate(v); }}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: 0.00024" />
            </div>
          )}

          {isColombia && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Productos</h3>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3" /> Agregar
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Agrega al menos un producto</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <Card key={idx} variant="flat" className="border border-border">
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <input type="text" value={item.productName}
                        onChange={(e) => updateItem(idx, "productName", e.target.value)}
                        placeholder="Nombre del producto"
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button onClick={() => removeItem(idx)} className="ml-2 p-1 text-danger hover:opacity-80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Cantidad</label>
                        <input type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      {isColombia ? (
                        <div className="col-span-2">
                          <label className="text-[10px] text-muted-foreground">Costo USD</label>
                          <input type="number" step="0.01" min="0" value={item.costWithoutIVA}
                            onChange={(e) => updateItem(idx, "costWithoutIVA", Number(e.target.value))}
                            className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Costo c/IVA</label>
                            <input type="number" step="0.01" min="0" value={item.costWithIVA}
                              onChange={(e) => updateItem(idx, "costWithIVA", Number(e.target.value))}
                              className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Costo s/IVA</label>
                            <input type="number" step="0.01" min="0" value={item.costWithoutIVA}
                              onChange={(e) => updateItem(idx, "costWithoutIVA", Number(e.target.value))}
                              className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      {items.length > 0 && !isColombia && (
        <Card variant="elevated">
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Base Imponible</span><span>$ {totalWithoutIVA.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IVA {ivaRate}%</span><span>$ {ivaTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>$ {totalWithIVA.toFixed(2)}</span></div>
            {exchangeRate > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground"><span>Bs @ {exchangeRate.toFixed(2)}</span><span>Bs {(totalWithIVA * exchangeRate).toFixed(2)}</span></div>
            )}
          </CardContent>
        </Card>
      )}

      {items.length > 0 && isColombia && (
        <Card variant="elevated">
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total USD</span><span>$ {totalWithoutIVA.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total COP @ {copRate}</span><span>{(copRate > 0 ? (totalWithoutIVA / copRate) : 0).toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })}</span></div>
            {exchangeRate > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Total Bs @ {exchangeRate.toFixed(2)}</span><span>Bs {(totalWithoutIVA * exchangeRate).toFixed(2)}</span></div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} loading={saving}
          disabled={!supplierName.trim() || items.length === 0}>
          <Save className="h-4 w-4" /> {isColombia ? "Registrar Compra" : "Registrar Orden"}
        </Button>
      </div>
    </div>
  );
}

export default NewPurchasePage;
