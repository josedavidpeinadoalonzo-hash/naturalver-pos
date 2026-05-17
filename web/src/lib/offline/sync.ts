import { supabase } from "@/lib/supabase/client";
import { offlineDB, type PendingSale } from "./index";

let syncing = false;

export async function syncPendingSales() {
  if (syncing || !navigator.onLine) return;
  syncing = true;

  try {
    const pending = await offlineDB.getPendingSales();
    const unsynced = pending.filter((s) => !s.synced);

    for (const sale of unsynced) {
      try {
        const { data: inserted } = await supabase.from("sales").insert(sale.data);
        if (inserted || sale.data) {
          await offlineDB.markSynced(sale.id);
        }
      } catch {
        // individual sale failed, continue with others
      }
    }

    await offlineDB.clearSynced();
  } finally {
    syncing = false;
  }
}

export function startSyncListener() {
  window.addEventListener("online", () => {
    syncPendingSales();
  });

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncPendingSales();
    }
  });
}
