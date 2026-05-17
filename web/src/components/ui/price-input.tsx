"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PriceInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  currency?: "USD" | "BS";
}

const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ label, currency = "USD", className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-muted-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="number"
            step="0.01"
            min="0"
            className={cn(
              "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
              "placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "no-spinner",
              className
            )}
            {...props}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {currency === "USD" ? "$" : "Bs"}
          </span>
        </div>
      </div>
    );
  }
);

PriceInput.displayName = "PriceInput";

export { PriceInput };
