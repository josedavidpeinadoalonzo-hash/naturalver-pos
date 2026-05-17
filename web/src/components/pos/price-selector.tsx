"use client";

import { cn } from "@/lib/utils";
import { Tag, DollarSign, BadgePercent, Store, Crown, Truck } from "lucide-react";

export type PriceTier = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7";

interface PriceSelectorProps {
  activeTier: PriceTier;
  onChange: (tier: PriceTier) => void;
}

const TIERS: { key: PriceTier; label: string; icon: typeof Tag; desc: string }[] = [
  { key: "P1", label: "P1 Normal", icon: DollarSign, desc: "Precio estándar USD" },
  { key: "P2", label: "P2 Bs", icon: Tag, desc: "Precio en bolívares" },
  { key: "P3", label: "P3 COP", icon: Tag, desc: "Precio en pesos" },
  { key: "P4", label: "P4 Mayor", icon: BadgePercent, desc: "Precio al mayor" },
  { key: "P5", label: "P5 Revendedor", icon: Store, desc: "Precio revendedor" },
  { key: "P6", label: "P6 Premium", icon: Crown, desc: "Precio premium" },
  { key: "P7", label: "P7 Distribuidor", icon: Truck, desc: "Precio distribuidor" },
];

export function PriceSelector({ activeTier, onChange }: PriceSelectorProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      {TIERS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap transition-all border",
            activeTier === key
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
          )}
          title={TIERS.find((t) => t.key === key)?.desc}
        >
          <Icon className="h-3 w-3" />
          {key}
        </button>
      ))}
    </div>
  );
}

export function getPriceForTier(
  pres: { priceUSD: number; priceBs: number; priceCop?: number; wholesalePrice?: number; resellerPrice?: number; pricePremium?: number; priceDistributor?: number },
  tier: PriceTier
): number {
  switch (tier) {
    case "P1": return pres.priceUSD;
    case "P2": return pres.priceBs;
    case "P3": return pres.priceCop || pres.priceUSD;
    case "P4": return pres.wholesalePrice || pres.priceUSD;
    case "P5": return pres.resellerPrice || pres.priceUSD;
    case "P6": return pres.pricePremium || pres.priceUSD;
    case "P7": return pres.priceDistributor || pres.priceUSD;
    default: return pres.priceUSD;
  }
}

export function formatTierPrice(price: number, tier: PriceTier): string {
  if (tier === "P2") {
    return new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", minimumFractionDigits: 2 }).format(price);
  }
  if (tier === "P3") {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(price);
}
