import type { ItemImage } from "./types";

/**
 * Photos attached to an unpublished draft, kept in IndexedDB: they are too big for localStorage,
 * and have to survive leaving to log in or sign up (often finished in another tab).
 */
const DB = "wwfi";
const STORE = "draft-photos";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
  const db = await open();
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadDraftPhotos(key: string): Promise<ItemImage[]> {
  try {
    const saved = await run("readonly", (s) => s.get(key));
    return Array.isArray(saved) ? (saved as ItemImage[]) : [];
  } catch {
    return [];
  }
}

export async function saveDraftPhotos(key: string, images: ItemImage[]): Promise<void> {
  try {
    await run("readwrite", (s) => (images.length ? s.put(images, key) : s.delete(key)));
  } catch {
    /* ignore */
  }
}
