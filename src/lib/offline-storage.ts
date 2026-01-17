export interface CachedFile {
    id: string; // bucket + path
    blob: Blob;
    name: string;
    type: string;
    timestamp: number;
}

const DB_NAME = 'smartdocs_offline_cache';
const DB_VERSION = 1;
const STORE_NAME = 'files';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveFileToCache = async (bucket: string, path: string, blob: Blob, name: string) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const file: CachedFile = {
            id: `${bucket}:${path}`,
            blob,
            name,
            type: blob.type,
            timestamp: Date.now()
        };

        await store.put(file);
    } catch (error) {
        console.error('Failed to save file to cache:', error);
    }
};

export const getFileFromCache = async (bucket: string, path: string): Promise<CachedFile | null> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(`${bucket}:${path}`);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get file from cache:', error);
        return null;
    }
};

export const isFileCached = async (bucket: string, path: string): Promise<boolean> => {
    const file = await getFileFromCache(bucket, path);
    return !!file;
};
