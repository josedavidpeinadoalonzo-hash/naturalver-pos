"use client";

import { cn, formatUSD, formatBs, formatCOP } from "@/lib/utils";
import { DollarSign, Banknote, Coins } from "lucide-react";

export type CurrencyCode = "USD" | "VES" | "COP";

interface CurrencySelectorProps {
  active: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  exchangeRateVES?: number;
  exchangeRateCOP?: number;
}

const CURRENCIES: { key: CurrencyCode; label: string; icon: typeof DollarSign; symbol: string }[] = [
  { key: "USD", label: "USD", icon: DollarSign, symbol: "$" },
  { key: "VES", label: "Bs", icon: Banknote, symbol: "Bs" },
  { key: "COP", label: "COP", icon: Coins, symbol: "$" },
];

export function CurrencySelector({ active, onChange, exchangeRateVES, exchangeRateCOP }: CurrencySelectorProps) {
  return (
    <div className="flex gap-1">
      {CURRENCIES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-all border",
            active === key
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
      {active === "VES" && exchangeRateVES && exchangeRateVES > 0 && (
        <span className="text-[10px] text-muted-foreground self-center ml-1">@{exchangeRateVES.toFixed(2)}</span>
      )}
      {active === "COP" && exchangeRateCOP && exchangeRateCOP > 0 && (
        <span className="text-[10px] text-muted-foreground self-center ml-1">@{exchangeRateCOP.toFixed(2)}</span>
      )}
    </div>
  );
}

export function formatByCurrency(amountUSD: number, currency: CurrencyCode, rateVES: number, rateCOP: number): string {
  switch (currency) {
    case "VES":
      return formatBs(amountUSD * rateVES);
    case "COP":
      return formatCOP(amountUSD * rateCOP);
    default:
      return formatUSD(amountUSD);
  }
}

export function convertAmount(amountUSD: number, from: CurrencyCode, to: CurrencyCode, rateVES: number, rateCOP: number): number {
  let inUSD = amountUSD;
  if (from === "VES") inUSD = rateVES > 0 ? amountUSD / rateVES : 0;
  if (from === "COP") inUSD = rateCOP > 0 ? amountUSD / rateCOP : 0;

  switch (to) {
    case "VES": return inUSD * rateVES;
    case "COP": return inUSD * rateCOP;
    default: return inUSD;
  }
}
