const DATABASE = "starkeeper-v04";
let database: Promise<IDBDatabase> | undefined;

function openCache(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("cache");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  }
  return database;
}

export async function readCache<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openCache();
    return await new Promise<T | undefined>((resolve, reject) => {
      const request = db.transaction("cache").objectStore("cache").get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return undefined;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  const db = await openCache();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("cache", "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.objectStore("cache").put(value, key);
  });
}
