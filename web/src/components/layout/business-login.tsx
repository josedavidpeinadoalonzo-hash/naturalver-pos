"use client";

import { useBusiness } from "@/lib/business-store";
import { Building2 } from "lucide-react";

export function BusinessLogin() {
  const { businesses, setBusiness } = useBusiness();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold mb-1">NaturalVer&apos;s</h1>
      <p className="text-sm text-muted-foreground mb-8">Selecciona un negocio</p>

      <div className="w-full max-w-xs space-y-3">
        {businesses.map((b) => (
          <button
            key={b.id}
            onClick={() => setBusiness(b)}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.rif || "Sin RIF"}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
