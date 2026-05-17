const DB_NAME = "naturalver";
const DB_VERSION = 1;

export interface PendingSale {
  id: string;
  data: Record<string, unknown>;
  created_at: string;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_sales")) {
        const s = db.createObjectStore("pending_sales", { keyPath: "id" });
        s.createIndex("synced", "synced");
      }
      if (!db.objectStoreNames.contains("last_sync")) {
        db.createObjectStore("last_sync", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const offlineDB = {
  async cacheProducts(products: unknown[]) {
    const db = await openDB();
    const tx = db.transaction("products", "readwrite");
    for (const p of products) {
      tx.objectStore("products").put(p);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getCachedProducts(): Promise<unknown[]> {
    const db = await openDB();
    const tx = db.transaction("products", "readonly");
    return new Promise((resolve, reject) => {
      const req = tx.objectStore("products").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async queueSale(sale: PendingSale) {
    const db = await openDB();
    const tx = db.transaction("pending_sales", "readwrite");
    tx.objectStore("pending_sales").put(sale);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getPendingSales(): Promise<PendingSale[]> {
    const db = await openDB();
    const tx = db.transaction("pending_sales", "readonly");
    const index = tx.objectStore("pending_sales").index("synced");
    return new Promise((resolve, reject) => {
      const req = index.getAll(IDBKeyRange.only(false));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async markSynced(id: string) {
    const db = await openDB();
    const tx = db.transaction("pending_sales", "readwrite");
    const s = tx.objectStore("pending_sales");
    const getReq = s.get(id);
    getReq.onsuccess = () => {
      const sale = getReq.result as PendingSale | undefined;
      if (sale) {
        sale.synced = true;
        s.put(sale);
      }
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearSynced() {
    const db = await openDB();
    const tx = db.transaction("pending_sales", "readwrite");
    const index = tx.objectStore("pending_sales").index("synced");
    const keyReq = index.getAllKeys(IDBKeyRange.only(true));
    keyReq.onsuccess = () => {
      const s = tx.objectStore("pending_sales");
      for (const key of keyReq.result) {
        s.delete(key);
      }
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
