"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import type { Product, ProductPresentation } from "@/lib/models";
import { ArrowLeft, Save, Trash2, Plus, Barcode, Camera, Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceInput } from "@/components/ui/price-input";
import { BarcodeScanner } from "@/components/sale/barcode-scanner";
import { playBeep, playErrorBeep } from "@/lib/beep";
import { uploadProductImage } from "@/lib/services/upload";

function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const isNew = productIdParam === "new";

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [exchangeRateCop, setExchangeRateCop] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [presentations, setPresentations] = useState<ProductPresentation[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [showScanner, setShowScanner] = useState(false);
  const [ivaPercent, setIvaPercent] = useState(16);
  const [duplicateWarn, setDuplicateWarn] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barcodeLastCharRef = useRef(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef("");

  useEffect(() => {
    loadIvaPercent();
    if (isNew) {
      addPresentation();
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } else {
      loadProduct();
    }
  }, [params.id]);

  async function loadIvaPercent() {
    try {
      const bid = await getTenantBusinessId();
      const { data } = await supabase
        .from("business_config")
        .select("value")
        .eq("business_id", bid)
        .eq("key", "iva_percent")
        .single();
      if (data?.value && Number(data.value) > 0) setIvaPercent(Number(data.value));
    } catch {}
  }

  async function checkDuplicate(code: string) {
    if (!code.trim()) return;
    try {
      const bid = await getTenantBusinessId();
      const { data } = await supabase
        .from("products")
        .select("id, name")
        .eq("barcode", code.trim())
        .eq("business_id", bid)
        .limit(1);
      if (data && data.length > 0) {
        setDuplicateWarn(`Ya existe: "${data[0].name}"`);
        playErrorBeep();
      } else {
        playBeep();
      }
    } catch {
      playBeep();
    }
  }

  async function loadProduct() {
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", productIdParam)
        .single();
      if (data) {
        const p = data as unknown as Product;
        setName(p.name);
        setCategory(p.category);
        setDescription(p.description || "");
        setBarcode(p.barcode || "");
        setImageUrl(p.image_url || "");
        setExchangeRateCop(p.exchangeRateCop || 0);
        setPresentations(p.presentations.map((pr) => {
          if (pr.exento || ivaPercent === 0) return pr;
          return {
            ...pr,
            priceUSD: pr.priceUSD * (1 + ivaPercent / 100),
            wholesalePrice: pr.wholesalePrice ? pr.wholesalePrice * (1 + ivaPercent / 100) : undefined,
            pricePremium: pr.pricePremium ? pr.pricePremium * (1 + ivaPercent / 100) : undefined,
            priceDistributor: pr.priceDistributor ? pr.priceDistributor * (1 + ivaPercent / 100) : undefined,
          };
        }));
        setQuantity(p.presentations[0]?.stock || 0);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }

  function addPresentation() {
    const id = `pres_${Date.now()}`;
    setPresentations([
      ...presentations,
      { id, name: "", priceUSD: 0, priceBs: 0, priceCop: 0, stock: 0, lowStockThreshold: 5 },
    ]);
  }

  function removePresentation(id: string) {
    setPresentations(presentations.filter((p) => p.id !== id));
  }

  function updatePresentation(id: string, field: keyof ProductPresentation, value: any) {
    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, [field]: value };
        const recalc = field === "priceUSD" || field === "exento";
        if (recalc) {
          const bcvRate = Number(localStorage.getItem("bcv_rate") || "0");
          const copRate = Number(localStorage.getItem("cop_rate") || "0");
          const exento = field === "exento" ? Boolean(value) : p.exento;
          const factor = exento || ivaPercent === 0 ? 1 : 1 + ivaPercent / 100;
          const priceUSD = field === "priceUSD" ? Number(value) : p.priceUSD;
          const baseUSD = priceUSD / factor;
          if (bcvRate > 0) next.priceBs = Math.round(baseUSD * bcvRate * 100) / 100;
          if (copRate > 0) next.priceCop = Math.round(baseUSD * copRate * 100) / 100;
        }
        return next;
      });
      if (field === "stock" && updated[0]?.id === id) {
        setQuantity(value);
      }
      return updated;
    });
  }

  async function handleSave() {
    if (!name.trim() || presentations.length === 0) return;
    setErrorMsg("");
    setSaving(true);
    try {
      const savedPresentations = presentations.map((p) => {
        if (p.exento || ivaPercent === 0) return p;
        const factor = 1 + ivaPercent / 100;
        return {
          ...p,
          priceUSD: p.priceUSD / factor,
          wholesalePrice: p.wholesalePrice ? p.wholesalePrice / factor : undefined,
          pricePremium: p.pricePremium ? p.pricePremium / factor : undefined,
          priceDistributor: p.priceDistributor ? p.priceDistributor / factor : undefined,
        };
      });

      const product = {
        name: name.trim(),
        category: category.trim() || "General",
        description: description.trim(),
        image_url: imageUrl || null,
        barcode: barcode.trim() || null,
        exchange_rate_cop: exchangeRateCop || 0,
        presentations: savedPresentations,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        await supabase.from("products").insert({
          ...product,
          business_id: await getTenantBusinessId(),
          created_at: new Date().toISOString(),
        });
      } else {
        await supabase.from("products").update(product).eq("id", productIdParam);
      }
      router.push("/productos");
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al guardar. Revisa que todos los campos sean válidos.");
    } finally {
      setSaving(false);
      if (errorMsg) setTimeout(() => setErrorMsg(""), 5000);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await supabase.from("products").delete().eq("id", productIdParam);
      router.push("/productos");
    } catch (err) {}
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        </button>
        <h1 className="text-xl font-bold">{isNew ? "Nuevo Producto" : "Editar Producto"}</h1>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
          {errorMsg}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nombre del producto"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Categoría</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: Cremas, Aceites"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Código de Barras</label>
            <div className="relative mt-1">
              <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                autoFocus={isNew}
                onChange={(e) => {
                  const val = e.target.value;
                  barcodeRef.current = val;
                  setBarcode(val);
                  setDuplicateWarn("");
                  const now = Date.now();
                  const isScanner = val.length > 2 && (barcodeLastCharRef.current === 0 || now - barcodeLastCharRef.current < 40);
                  barcodeLastCharRef.current = now;
                  if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
                  if (isScanner && val.length >= 4) {
                    barcodeTimerRef.current = setTimeout(() => {
                      checkDuplicate(val);
                    }, 120);
                  }
                }}
                onKeyDown={(e: KeyboardEvent) => {
                  const current = barcodeRef.current;
                  if (e.key === "Enter" && current.trim()) {
                    e.preventDefault();
                    checkDuplicate(current.trim());
                  }
                }}
                className="w-full rounded-lg border border-border bg-card pl-10 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                placeholder="Escanea o escribe el código"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => setShowScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                title="Escanear con cámara"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            {duplicateWarn && (
              <p className="mt-1 text-xs text-warning flex items-center gap-1">
                ⚠ {duplicateWarn}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Imagen del producto</label>
            <div className="flex items-start gap-3">
              <div className="w-24 h-24 rounded-xl border-2 border-border/60 overflow-hidden bg-muted/20 flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground cursor-pointer transition-all">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const url = await uploadProductImage(file, isNew ? "temp" : productIdParam);
                      if (url) setImageUrl(url);
                      setUploading(false);
                    }}
                  />
                </label>
                {imageUrl && (
                  <button
                    onClick={() => setImageUrl("")}
                    className="flex items-center gap-1 text-xs text-danger hover:opacity-80"
                  >
                    <X className="h-3 w-3" /> Quitar imagen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Cantidad / Stock
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => {
                const q = Number(e.target.value) || 0;
                setQuantity(q);
                if (presentations.length > 0) {
                  setPresentations(presentations.map((p, i) => i === 0 ? { ...p, stock: q } : p));
                } else {
                  addPresentation();
                  setTimeout(() => setQuantity(q), 0);
                }
              }}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0"
            />
          </div>

          <div className="border-t border-border pt-3">
            <label className="text-xs font-medium text-muted-foreground">
              Tasa COP/USD <span className="text-[10px]">(para compras Colombia)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={exchangeRateCop}
              onChange={(e) => setExchangeRateCop(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ej: 0.00024"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Presentaciones</label>
            <Button variant="outline" size="sm" onClick={addPresentation}>
              <Plus className="h-3 w-3" /> Agregar
            </Button>
          </div>

          {presentations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              Agrega al menos una presentación
            </p>
          ) : (
            <div className="space-y-3">
              {presentations.map((p) => (
                <Card key={p.id} variant="flat" className="border border-border">
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updatePresentation(p.id, "name", e.target.value)}
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Ej: 60g, 30ml"
                      />
                      <button
                        onClick={() => removePresentation(p.id)}
                        className="ml-2 p-1 text-danger hover:opacity-80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <PriceInput
                        label={p.exento ? "Precio USD (Exento)" : `Precio Final (IVA ${ivaPercent}% incluido)`}
                        currency="USD"
                        value={p.priceUSD ? Number(p.priceUSD.toFixed(2)) : ""}
                        onChange={(e) => updatePresentation(p.id, "priceUSD", Number(e.target.value))}
                      />
                      <PriceInput
                        label="Precio Bs"
                        currency="BS"
                        value={p.priceBs ? Number(p.priceBs.toFixed(2)) : ""}
                        onChange={(e) => updatePresentation(p.id, "priceBs", Number(e.target.value))}
                      />
                      <div className="col-span-2 flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                        <input
                          type="checkbox"
                          id={`exento-${p.id}`}
                          checked={p.exento || false}
                          onChange={(e) => updatePresentation(p.id, "exento", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`exento-${p.id}`} className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                          Exento de IVA
                        </label>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Precio COP</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.priceCop ? Number(p.priceCop.toFixed(2)) : ""}
                          onChange={(e) => updatePresentation(p.id, "priceCop", Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="$ cop"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={p.stock}
                          onChange={(e) => updatePresentation(p.id, "stock", Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Stock Mínimo</label>
                        <input
                          type="number"
                          min="0"
                          value={p.lowStockThreshold || 5}
                          onChange={(e) => updatePresentation(p.id, "lowStockThreshold", Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <PriceInput
                        label="Precio Mayor"
                        currency="USD"
                        value={p.wholesalePrice ? Number(p.wholesalePrice.toFixed(2)) : ""}
                        onChange={(e) => updatePresentation(p.id, "wholesalePrice", Number(e.target.value))}
                      />
                      <PriceInput
                        label="Precio Premium"
                        currency="USD"
                        value={p.pricePremium ? Number(p.pricePremium.toFixed(2)) : ""}
                        onChange={(e) => updatePresentation(p.id, "pricePremium", Number(e.target.value))}
                      />
                      <PriceInput
                        label="Precio Distribuidor"
                        currency="USD"
                        value={p.priceDistributor ? Number(p.priceDistributor.toFixed(2)) : ""}
                        onChange={(e) => updatePresentation(p.id, "priceDistributor", Number(e.target.value))}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {!isNew && (
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>

        {showScanner && (
          <BarcodeScanner
            onDetected={(code) => {
              setBarcode(code);
              setShowScanner(false);
              checkDuplicate(code);
              barcodeInputRef.current?.focus();
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
    </div>
  );
}

export default ProductEditPage;
