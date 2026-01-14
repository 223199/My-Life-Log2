const DB_NAME = "lifeLogPhotos";
const STORE_NAME = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB error"));
  });
}

export async function savePhoto(dateKey: string, dataUrl: string) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(dataUrl, dateKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("tx error"));
  });
}

export async function getPhoto(dateKey: string): Promise<string> {
  const db = await openDB();
  return await new Promise<string>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(dateKey);
    req.onsuccess = () => resolve((req.result as string) || "");
    req.onerror = () => reject(req.error || new Error("get error"));
  });
}

export async function deletePhoto(dateKey: string) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(dateKey);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error("delete error"));
  });
}
