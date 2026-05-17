"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";

export interface Business {
  id: string;
  name: string;
  slug: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  active: boolean;
}

interface BusinessContextType {
  business: Business | null;
  businesses: Business[];
  setBusiness: (b: Business) => void;
  loadBusinesses: () => Promise<void>;
  businessId: string | null;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusinessState] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const loadBusinesses = useCallback(async () => {
    const { data } = await supabase.from("businesses").select("*").eq("active", true).order("name");
    if (data) setBusinesses(data as unknown as Business[]);
  }, []);

  useEffect(() => {
    loadBusinesses();

    const stored = localStorage.getItem("business");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBusinessState(parsed);
      } catch {
        localStorage.removeItem("business");
      }
    }
  }, [loadBusinesses]);

  const setBusiness = useCallback((b: Business) => {
    setBusinessState(b);
    localStorage.setItem("business", JSON.stringify(b));
  }, []);

  const ctx = useMemo(() => ({
    business,
    businesses,
    setBusiness,
    loadBusinesses,
    businessId: business?.id || null,
  }), [business, businesses, setBusiness, loadBusinesses]);

  return (
    <BusinessContext.Provider value={ctx}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
