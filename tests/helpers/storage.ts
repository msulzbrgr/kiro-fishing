import type { Page } from '@playwright/test';

export async function loadStoredSessions(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kiro-fishing');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const tx = db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as unknown[]);
    });
    db.close();
    return records;
  });
}
