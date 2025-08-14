// Offline Storage Service for Ghana Emergency Medical Services
// Handles IndexedDB storage for emergency requests when offline

export interface OfflineEmergencyRequest {
  id: string;
  data: {
    location: { lat: number; lng: number };
    severityLevel: 1 | 2 | 3 | 4;
    address?: string;
    callerPhone?: string;
    emergencyType?: string;
    contactName?: string;
    description?: string;
  };
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

class OfflineStorageService {
  private dbName = 'GhanaEMS';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<boolean> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return false;
    }

    try {
      this.db = await this.openDatabase();
      console.log('Offline storage initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      return false;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('pendingRequests')) {
          const store = db.createObjectStore('pendingRequests', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('cachedData')) {
          const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveEmergencyRequest(requestData: any): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const request: OfflineEmergencyRequest = {
      id: this.generateId(),
      data: requestData,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const addRequest = store.add(request);

      addRequest.onsuccess = () => {
        console.log('Emergency request saved offline:', request.id);
        resolve(request.id);
      };

      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getPendingRequests(): Promise<OfflineEmergencyRequest[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readonly');
      const store = transaction.objectStore('pendingRequests');
      const request = store.openCursor();
      const results: OfflineEmergencyRequest[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as OfflineEmergencyRequest;
          // Only include unsynced requests
          if (!record.synced) {
            results.push(record);
          }
          cursor.continue();
        } else {
          // No more entries
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async markRequestAsSynced(requestId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const getRequest = store.get(requestId);

      getRequest.onsuccess = () => {
        const request = getRequest.result;
        if (request) {
          request.synced = true;
          const updateRequest = store.put(request);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Request not found, consider it handled
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeRequest(requestId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const deleteRequest = store.delete(requestId);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  async incrementRetryCount(requestId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const getRequest = store.get(requestId);

      getRequest.onsuccess = () => {
        const request = getRequest.result;
        if (request) {
          request.retryCount += 1;
          const updateRequest = store.put(request);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readonly');
      const store = transaction.objectStore('cachedData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if data is still valid
          const now = Date.now();
          if (now - result.timestamp < result.ttl) {
            resolve(result.data);
          } else {
            // Data expired, remove it
            this.removeCachedData(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removeCachedData(key: string): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedData'], 'readwrite');
      const store = transaction.objectStore('cachedData');
      const request = store.openCursor();
      const now = Date.now();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (now - entry.timestamp >= entry.ttl) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async syncPendingRequests(): Promise<{ success: number; failed: number }> {
    const pendingRequests = await this.getPendingRequests();
    let success = 0;
    let failed = 0;

    for (const request of pendingRequests) {
      try {
        // Skip requests that have failed too many times
        if (request.retryCount >= 3) {
          console.warn(`Skipping request ${request.id} - too many retries`);
          failed++;
          continue;
        }

        const response = await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });

        if (response.ok) {
          await this.markRequestAsSynced(request.id);
          success++;
          console.log(`Successfully synced request ${request.id}`);
        } else {
          await this.incrementRetryCount(request.id);
          failed++;
          console.error(`Failed to sync request ${request.id}`);
        }
      } catch (error) {
        await this.incrementRetryCount(request.id);
        failed++;
        console.error(`Error syncing request ${request.id}:`, error);
      }
    }

    return { success, failed };
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService();

// Initialize when module loads
if (typeof window !== 'undefined') {
  offlineStorage.initialize().then((success) => {
    if (success) {
      console.log('Offline storage ready');
      
      // Set up online/offline event listeners
      window.addEventListener('online', async () => {
        console.log('Back online - syncing pending requests');
        const result = await offlineStorage.syncPendingRequests();
        console.log(`Sync complete: ${result.success} success, ${result.failed} failed`);
      });

      window.addEventListener('offline', () => {
        console.log('Gone offline - emergency requests will be queued');
      });
    }
  });
}
