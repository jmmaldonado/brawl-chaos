import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'avatar-cache';
const STORE_NAME = 'avatars';
const DICEBEAR_URL = 'https://api.dicebear.com/9.x/bottts/svg?seed=';

let dbPromise: Promise<IDBPDatabase> | null = null;
const memoryCache = new Map<string, string>();

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple global queue to serialize fetches and maintain rate limits
let fetchQueue: Promise<any> = Promise.resolve();

async function queuedFetch(name: string): Promise<string | null> {
  const result = await (fetchQueue = fetchQueue.then(async () => {
    // Check IndexedDB again inside the queue because it might have been fulfilled by a previous task
    const db = await getDB();
    const cached = await db.get(STORE_NAME, name);
    if (cached) return cached;

    // Minimum delay to stay way below 50 requests / sec
    // 100ms == 10 req/sec maximum
    await delay(110);

    try {
      const response = await fetch(`${DICEBEAR_URL}${encodeURIComponent(name)}`);
      if (response.status === 429) {
        console.warn(`Rate limited by DiceBear for seed: ${name}`);
        return null;
      }
      if (!response.ok) return null;
      
      const svgText = await response.text();
      await db.put(STORE_NAME, svgText, name);
      return svgText;
    } catch (e) {
      console.error(`Fetch failed for ${name}:`, e);
      return null;
    }
  }));

  return result;
}

export async function getAvatar(name: string): Promise<string> {
  // 1. Memory Check
  if (memoryCache.has(name)) {
    return memoryCache.get(name)!;
  }

  // 2. IndexedDB Check
  const db = await getDB();
  const cached = await db.get(STORE_NAME, name);

  if (cached) {
    const url = URL.createObjectURL(new Blob([cached], { type: 'image/svg+xml' }));
    memoryCache.set(name, url);
    return url;
  }

  // 3. Queued Fetch
  const svgText = await queuedFetch(name);
  if (svgText) {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    memoryCache.set(name, url);
    return url;
  }

  // Fallback to direct URL if everything fails (at least it's one last pokušaj)
  return `${DICEBEAR_URL}${encodeURIComponent(name)}`;
}

export async function preloadAvatars(names: string[]) {
  // We just fire them off; the queuedFetch will handle the serialization and timing
  // We don't even need to wait for them here, but we can to be thorough
  for (const name of names) {
    getAvatar(name);
  }
}
