"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useEmployee } from "@/lib/employee-store";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { fetchBCVRate, getStoredBCVRate } from "@/lib/services/exchange-rate";
import { RefreshCw } from "lucide-react";

export function PriceUpdater() {
  const { employee } = useEmployee();
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!employee || employee.role !== "admin") return;
    autoUpdatePrices();
  }, [employee]);

  async function autoUpdatePrices() {
    try {
      const newRate = await fetchBCVRate();
      if (newRate <= 0) return;

      const oldRate = getStoredBCVRate();
      const businessId = getTenantBusinessId();
      if (!businessId) return;

      const { data: products } = await supabase
        .from("products")
        .select("id, presentations")
        .eq("business_id", businessId);

      if (!products || products.length === 0) return;

      let updated = 0;
      for (const product of products) {
        const pres = product.presentations as any[];
        let changed = false;
        const updatedPres = pres.map((p: any) => {
          if (p.priceUSD > 0) {
            const newBs = Math.round(p.priceUSD * newRate * 100) / 100;
            if (Math.abs(newBs - (p.priceBs || 0)) > 0.01) {
              changed = true;
              return { ...p, priceBs: newBs };
            }
          }
          return p;
        });

        if (changed) {
          await supabase
            .from("products")
            .update({ presentations: updatedPres, updated_at: new Date().toISOString() })
            .eq("id", product.id);
          updated++;
        }
      }

      if (updated > 0) {
        setMessage(`Precios actualizados: ${updated} productos @ Bs ${newRate.toFixed(2)}`);
        setType("success");
      } else if (oldRate !== newRate) {
        setMessage(`Tasa BCV: Bs ${newRate.toFixed(2)} (sin cambios de precio)`);
        setType("success");
      } else {
        return;
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch {
      setMessage("Error al actualizar precios");
      setType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  }

  if (!showToast) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 transition-all ${
        type === "success" ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"
      }`}
    >
      <RefreshCw className={`h-4 w-4 ${type === "success" ? "animate-none" : ""}`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => setShowToast(false)} className="text-sm opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}
