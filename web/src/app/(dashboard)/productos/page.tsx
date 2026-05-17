"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { tenantQuery, getTenantBusinessId } from "@/lib/tenant-query";
import type { Product } from "@/lib/models";
import { Plus, Search, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const businessId = getTenantBusinessId();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", businessId)
        .order("name");
      if (data) {
        setProducts(data as unknown as Product[]);
        const cats = [...new Set(data.map((p) => p.category))] as string[];
        setCategories(cats);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const getStockColor = (stock: number, threshold?: number) => {
    const t = threshold || 5;
    if (stock === 0) return "text-danger";
    if (stock <= t) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link href="/productos/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Cargando productos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="mb-2 h-12 w-12 opacity-30" />
          <p className="text-sm">No hay productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((product) => {
            const minStock = Math.min(...product.presentations.map((p) => p.stock));
            const threshold = product.presentations[0]?.lowStockThreshold || 5;
            return (
              <Link key={product.id} href={`/productos/${product.id}`}>
                <Card variant="elevated" className="hover:scale-[1.01] transition-transform cursor-pointer">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                      </div>
                      <span className={cn("text-xs font-medium", getStockColor(minStock, threshold))}>
                        {product.presentations.length} vars.
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.presentations.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs",
                            p.stock <= (p.lowStockThreshold || 5)
                              ? "bg-danger/10 text-danger"
                              : "bg-success/10 text-success"
                          )}
                        >
                          {p.name}: {p.stock}und
                        </span>
                      ))}
                      {product.presentations.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{product.presentations.length - 3} más
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
