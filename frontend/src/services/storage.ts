import { Track, PlayerSettings } from '../types';

const DB_NAME = 'ytm_player_db';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';
const STORE_FAVORITES = 'favorites';
const STORE_QUEUE = 'queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addToHistory(track: Track): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    store.put({ ...track, playedAt: Date.now() });
  } catch (e) {
    console.warn('Could not save to history:', e);
  }
}

export async function getHistory(): Promise<Track[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const store = tx.objectStore(STORE_HISTORY);
    const req = store.getAll();
    return new Promise(resolve => {
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));
        resolve(items.slice(0, 50));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function toggleFavorite(track: Track): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FAVORITES, 'readwrite');
    const store = tx.objectStore(STORE_FAVORITES);
    const existing = await new Promise<any>(resolve => {
      const r = store.get(track.id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(null);
    });

    if (existing) {
      store.delete(track.id);
      return false;
    } else {
      store.put({ ...track, favoritedAt: Date.now() });
      return true;
    }
  } catch {
    return false;
  }
}

export async function getFavorites(): Promise<Track[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FAVORITES, 'readonly');
    const store = tx.objectStore(STORE_FAVORITES);
    const req = store.getAll();
    return new Promise(resolve => {
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => (b.favoritedAt || 0) - (a.favoritedAt || 0));
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function isFavorite(trackId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_FAVORITES, 'readonly');
    const store = tx.objectStore(STORE_FAVORITES);
    return new Promise(resolve => {
      const r = store.get(trackId);
      r.onsuccess = () => resolve(!!r.result);
      r.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

const SETTINGS_KEY = 'ytm_player_settings';

export function getSavedSettings(): PlayerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    crossfadeDuration: 4,
    audioQuality: 'high',
    volume: 0.85,
    autoQueueRadio: true,
  };
}

export function saveSettings(settings: PlayerSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
