import { supabase } from "@/lib/supabase/client";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

let _businessId: string | null = null;

export function setTenantBusinessId(id: string | null) {
  _businessId = id;
}

export function getTenantBusinessId(): string | null {
  if (_businessId) return _businessId;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("business");
      if (stored) {
        const parsed = JSON.parse(stored);
        _businessId = parsed.id;
        return _businessId;
      }
    } catch {}
  }
  return null;
}

export function tenantQuery(table: string) {
  const businessId = getTenantBusinessId();
  let query = supabase.from(table).select("*");
  if (businessId) {
    query = (query as any).eq("business_id", businessId) as any;
  }
  return query;
}

export function tenantInsert(table: string, values: Record<string, any>) {
  const businessId = getTenantBusinessId();
  if (businessId) {
    values.business_id = businessId;
  }
  return supabase.from(table).insert(values);
}
