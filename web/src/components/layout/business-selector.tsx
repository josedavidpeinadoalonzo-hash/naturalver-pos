"use client";

import { useBusiness } from "@/lib/business-store";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

export function BusinessSelector() {
  const { business, businesses, setBusiness } = useBusiness();
  const [open, setOpen] = useState(false);

  if (!business) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors"
      >
        <Building2 className="h-4 w-4" />
        <span className="hidden md:inline max-w-[140px] truncate">{business.name}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBusiness(b);
                  setOpen(false);
                  window.location.reload();
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/20 ${
                  b.id === business.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
              >
                <span className="flex-1 text-left truncate">{b.name}</span>
                {b.id === business.id && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
