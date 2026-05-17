"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Product, ProductPresentation } from "@/lib/models";
import { useCart } from "@/lib/cart-store";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatUSD } from "@/lib/utils";
import { Search, Plus, X, Package, Camera, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "./barcode-scanner";

interface ProductGridProps {
  products: Product[];
}

const ALL = "todas";

export function ProductGrid({ products }: ProductGridProps) {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [picker, setPicker] = useState<{ product: Product; open: boolean } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return [ALL, ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === ALL || p.category === category;
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  function handleProductClick(p: Product) {
    if (p.presentations.length === 1) {
      addItem(p, p.presentations[0]);
    } else {
      setPicker({ product: p, open: true });
    }
  }

  function handlePickPresentation(pres: ProductPresentation) {
    if (!picker) return;
    addItem(picker.product, pres);
    setPicker(null);
  }

  function handleBarcode(code: string) {
    setShowScanner(false);
    setLastScannedBarcode(code);
    const found = products.find((p) => p.barcode === code);
    if (found) {
      if (found.presentations.length === 1) {
        addItem(found, found.presentations[0]);
      } else {
        setPicker({ product: found, open: true });
      }
      setLastScannedBarcode(null);
    } else {
      setSearch(code);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto o código..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={() => setShowScanner(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/20"
            title="Escanear código de barras"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              {c === ALL ? "Todas" : c}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Package className="mx-auto h-8 w-8 mb-2 opacity-40" />
            <p>No hay productos</p>
            {lastScannedBarcode && (
              <Link
                href={`/productos/new?barcode=${encodeURIComponent(lastScannedBarcode)}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Crear producto con código {lastScannedBarcode}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map((p) => (
              <Card
                key={p.id}
                variant="elevated"
                className="cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                onClick={() => handleProductClick(p)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight truncate">{p.name}</p>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {p.category}
                      </span>
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-primary ml-1 mt-0.5" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.presentations.slice(0, 2).map((pr) => (
                      <span
                        key={pr.id}
                        className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary font-medium"
                      >
                        {pr.name} {formatUSD(pr.priceUSD)}
                      </span>
                    ))}
                    {p.presentations.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{p.presentations.length - 2}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Presentation picker modal */}
      {picker?.open && picker.product && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center"
          onClick={() => setPicker(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl bg-card p-6 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{picker.product.name}</h3>
              <button onClick={() => setPicker(null)} className="p-1 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {picker.product.presentations.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePickPresentation(p)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:bg-card/50 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Stock: {p.stock}und</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatUSD(p.priceUSD)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
