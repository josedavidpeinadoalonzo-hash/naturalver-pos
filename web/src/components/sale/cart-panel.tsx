"use client";

import { useCart } from "@/lib/cart-store";
import { cn, formatUSD } from "@/lib/utils";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartPanelProps {
  onCheckout: () => void;
  className?: string;
}

export function CartPanel({ onCheckout, className }: CartPanelProps) {
  const { items, updateQuantity, removeItem, totalUSD, totalItems } = useCart();

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Carrito
          </h2>
          {totalItems > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Carrito vacío</p>
            <p className="text-xs text-muted-foreground/60">Toca un producto para agregar</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item, idx) => (
              <div key={`${item.product.id}-${item.presentation.id}`} className="px-4 py-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.presentation.name}</p>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1 text-muted-foreground hover:text-danger shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(idx, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(idx, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-bold">
                    {formatUSD(item.presentation.priceUSD * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{formatUSD(totalUSD)}</span>
          </div>
          <Button fullWidth onClick={onCheckout} size="lg">
            <ShoppingCart className="h-4 w-4" /> Cobrar {formatUSD(totalUSD)}
          </Button>
        </div>
      )}
    </div>
  );
}
