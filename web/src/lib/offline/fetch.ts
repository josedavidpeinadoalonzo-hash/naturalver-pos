import { supabase } from "@/lib/supabase/client";
import { getTenantBusinessId } from "@/lib/tenant-query";
import { offlineDB } from "./index";

export async function fetchWithOffline<T>(
  table: string,
  options: { order?: string; select?: string } = {}
): Promise<T[]> {
  const businessId = getTenantBusinessId();

  if (!navigator.onLine) {
    const cached = await offlineDB.getCachedProducts();
    return cached as T[];
  }

  let query = supabase.from(table).select(options.select || "*");
  if (businessId) query = query.eq("business_id", businessId);
  if (options.order) query = query.order(options.order);
  const { data, error } = await query;

  if (!error && data) {
    if (table === "products") {
      await offlineDB.cacheProducts(data);
    }
    return data as unknown as T[];
  }

  const cached = await offlineDB.getCachedProducts();
  return cached as T[];
}

export async function insertWithOffline(
  table: string,
  record: Record<string, unknown>
): Promise<boolean> {
  const businessId = getTenantBusinessId();
  if (businessId) {
    record.business_id = businessId;
  }

  if (navigator.onLine) {
    const { error } = await supabase.from(table).insert(record);
    if (!error) return true;
  }

  await offlineDB.queueSale({
    id: crypto.randomUUID(),
    data: record,
    created_at: new Date().toISOString(),
    synced: false,
  });
  return false;
}
