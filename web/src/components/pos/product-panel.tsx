"use client";

import { useState, useMemo } from "react";
import type { Product, ProductPresentation } from "@/lib/models";
import { useCart } from "@/lib/cart-store";
import { formatUSD } from "@/lib/utils";
import { X, Plus, Eye, Package, AlertTriangle } from "lucide-react";
import type { PriceTier } from "./price-selector";
import { getPriceForTier, formatTierPrice } from "./price-selector";

interface ProductPanelProps {
  products: Product[];
  quantity: number;
  priceTier?: PriceTier;
  onProductInfo?: (product: Product) => void;
}

const ALL = "todas";

const CATEGORY_COLORS: Record<string, string> = {
  lacteos: "bg-blue-100 text-blue-700 border-blue-200",
  carnes: "bg-red-100 text-red-700 border-red-200",
  verduras: "bg-green-100 text-green-700 border-green-200",
  frutas: "bg-orange-100 text-orange-700 border-orange-200",
  bebidas: "bg-cyan-100 text-cyan-700 border-cyan-200",
  limpieza: "bg-purple-100 text-purple-700 border-purple-200",
  harina: "bg-amber-100 text-amber-700 border-amber-200",
  enlatados: "bg-yellow-100 text-yellow-700 border-yellow-200",
  aseo: "bg-pink-100 text-pink-700 border-pink-200",
  general: "bg-gray-100 text-gray-700 border-gray-200",
};

function getCategoryColor(cat: string): string {
  const key = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function ProductImage({ url, name }: { url?: string; name: string }) {
  const [error, setError] = useState(false);
  if (url && !error) {
    return (
      <img
        src={url}
        alt={name}
        className="w-full h-24 object-cover rounded-t-lg"
        onError={() => setError(true)}
      />
    );
  }
  return (
    <div className="w-full h-24 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60 rounded-t-lg">
      <Package className="h-8 w-8 text-muted-foreground/40" />
    </div>
  );
}

export function ProductPanel({ products, quantity, priceTier, onProductInfo }: ProductPanelProps) {
  const { addItem } = useCart();
  const [category, setCategory] = useState(ALL);
  const [search, setSearch] = useState("");
  const [picker, setPicker] = useState<{ product: Product } | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return [ALL, ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search);
      const matchCat = category === ALL || p.category === category;
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  function handleSelect(p: Product) {
    if (p.presentations.length === 1) {
      addItemWithQty(p, p.presentations[0], quantity);
    } else {
      setPicker({ product: p });
    }
  }

  function addItemWithQty(p: Product, pres: ProductPresentation, qty: number) {
    for (let i = 0; i < qty; i++) {
      addItem(p, { ...pres, priceUSD: getPriceForTier(pres, priceTier || "P1") });
    }
  }

  function handlePickPresentation(pres: ProductPresentation) {
    if (!picker) return;
    addItemWithQty(picker.product, pres, quantity);
    setPicker(null);
  }

  const isLowStock = (pres: ProductPresentation) =>
    pres.stock <= (pres.lowStockThreshold || 5);

  return (
    <div className="flex h-full flex-col gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar producto..."
        className="w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {categories.slice(0, 8).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              category === c
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/20 text-muted-foreground hover:text-foreground border border-border/60 hover:border-primary/30"
            }`}
          >
            {c === ALL ? "Todo" : c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Sin resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((p) => {
              const minStock = Math.min(...p.presentations.map((pr) => pr.stock));
              const anyLow = p.presentations.some((pr) => isLowStock(pr));
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="flex flex-col rounded-xl border border-border/60 bg-card shadow-sm hover:shadow-lg hover:border-primary/40 active:scale-[0.98] transition-all relative group overflow-hidden"
                >
                  {p.image_url && (
                    <ProductImage url={p.image_url} name={p.name} />
                  )}
                  {onProductInfo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onProductInfo(p); }}
                      className="absolute top-1.5 right-1.5 rounded-lg bg-background/80 backdrop-blur-sm p-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-primary transition-all z-10"
                      title="Ver información"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="flex flex-col p-2.5 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold leading-tight line-clamp-2 flex-1 text-left">
                        {p.name}
                      </span>
                      {anyLow && (
                        <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0 mt-0.5" />
                      )}
                    </div>
                    <span className="mt-1 self-start rounded-md px-1.5 py-0.5 text-[10px] font-medium border {getCategoryColor(p.category)}">
                      {p.category}
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.presentations.slice(0, 2).map((pr) => {
                        const tierPrice = getPriceForTier(pr, priceTier || "P1");
                        return (
                          <span
                            key={pr.id}
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              isLowStock(pr)
                                ? "bg-danger/10 text-danger"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {pr.name} {formatTierPrice(tierPrice, priceTier || "P1")}
                          </span>
                        );
                      })}
                    </div>
                    {anyLow && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-danger font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                        Stock bajo ({minStock}und)
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {picker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center md:justify-center"
          onClick={() => setPicker(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-card p-6 md:rounded-2xl shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{picker.product.name}</h3>
              <button onClick={() => setPicker(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {quantity > 1 && (
              <p className="text-xs text-muted-foreground mb-3">
                Cantidad: <span className="font-bold text-foreground">{quantity}</span> unidades
              </p>
            )}
            <div className="space-y-2">
              {picker.product.presentations.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePickPresentation(p)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3.5 text-sm hover:bg-primary/5 transition-all ${
                    isLowStock(p)
                      ? "border-danger/20 hover:border-danger/40"
                      : "border-border/60 hover:border-primary/30"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold">{p.name}</p>
                    <p className={`text-xs mt-0.5 ${isLowStock(p) ? "text-danger font-medium" : "text-muted-foreground"}`}>
                      Stock: {p.stock}und
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{formatTierPrice(getPriceForTier(p, priceTier || "P1"), priceTier || "P1")}</p>
                    <div className="rounded-lg bg-primary/10 p-1.5">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
