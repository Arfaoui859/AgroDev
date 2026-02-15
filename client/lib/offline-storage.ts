// IndexedDB Offline Storage System for AgroGrowth Platform

interface OfflineAction {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  synced: boolean;
  retryCount: number;
  lastRetry?: string;
  error?: string;
}

interface CachedData {
  id: string;
  endpoint: string;
  data: any;
  timestamp: string;
  expiresAt: string;
  version: number;
}

interface OfflineConfig {
  dbName: string;
  version: number;
  stores: {
    actions: string;
    cache: string;
    sync: string;
    analytics: string;
  };
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private config: OfflineConfig;
  private syncInProgress = false;

  constructor() {
    this.config = {
      dbName: "AgroGrowthOfflineDB",
      version: 1,
      stores: {
        actions: "offline_actions",
        cache: "data_cache",
        sync: "sync_queue",
        analytics: "offline_analytics",
      },
    };
  }

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        console.error("IndexedDB failed to open:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB opened successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupStores(db);
      };
    });
  }

  // Setup IndexedDB object stores
  private setupStores(db: IDBDatabase): void {
    // Offline actions store
    if (!db.objectStoreNames.contains(this.config.stores.actions)) {
      const actionsStore = db.createObjectStore(this.config.stores.actions, {
        keyPath: "id",
      });
      actionsStore.createIndex("timestamp", "timestamp");
      actionsStore.createIndex("synced", "synced");
      actionsStore.createIndex("url", "url");
    }

    // Data cache store
    if (!db.objectStoreNames.contains(this.config.stores.cache)) {
      const cacheStore = db.createObjectStore(this.config.stores.cache, {
        keyPath: "id",
      });
      cacheStore.createIndex("endpoint", "endpoint");
      cacheStore.createIndex("timestamp", "timestamp");
      cacheStore.createIndex("expiresAt", "expiresAt");
    }

    // Sync queue store
    if (!db.objectStoreNames.contains(this.config.stores.sync)) {
      const syncStore = db.createObjectStore(this.config.stores.sync, {
        keyPath: "id",
      });
      syncStore.createIndex("priority", "priority");
      syncStore.createIndex("timestamp", "timestamp");
    }

    // Analytics store
    if (!db.objectStoreNames.contains(this.config.stores.analytics)) {
      const analyticsStore = db.createObjectStore(
        this.config.stores.analytics,
        { keyPath: "id" },
      );
      analyticsStore.createIndex("type", "type");
      analyticsStore.createIndex("timestamp", "timestamp");
    }

    console.log("IndexedDB stores setup completed");
  }

  // Store offline action
  async storeOfflineAction(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    priority: number = 1,
  ): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const action: OfflineAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.config.stores.actions],
        "readwrite",
      );
      const store = transaction.objectStore(this.config.stores.actions);
      const request = store.add(action);

      request.onsuccess = () => {
        console.log("Offline action stored:", action.id);
        this.trackOfflineEvent("action_stored", { url, method });
        resolve(action.id);
      };

      request.onerror = () => {
        console.error("Failed to store offline action:", request.error);
        reject(request.error);
      };
    });
  }

  // Get pending offline actions
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.config.stores.actions],
        "readonly",
      );
      const store = transaction.objectStore(this.config.stores.actions);
      const index = store.index("synced");
      const request = index.getAll(false);

      request.onsuccess = () => {
        const actions = request.result.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        resolve(actions);
      };

      request.onerror = () => {
        console.error("Failed to get pending actions:", request.error);
        reject(request.error);
      };
    });
  }

  // Mark action as synced
  async markActionSynced(
    actionId: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.config.stores.actions],
        "readwrite",
      );
      const store = transaction.objectStore(this.config.stores.actions);
      const request = store.get(actionId);

      request.onsuccess = () => {
        const action = request.result;
        if (action) {
          action.synced = success;
          action.lastRetry = new Date().toISOString();
          if (!success) {
            action.retryCount = (action.retryCount || 0) + 1;
            action.error = error;
          }

          const updateRequest = store.put(action);
          updateRequest.onsuccess = () => {
            console.log(
              `Action ${actionId} marked as ${success ? "synced" : "failed"}`,
            );
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error("Action not found"));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cache data
  async cacheData(
    endpoint: string,
    data: any,
    ttl: number = 3600000, // 1 hour default
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const cachedData: CachedData = {
      id: `cache_${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`,
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl).toISOString(),
      version: 1,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.config.stores.cache],
        "readwrite",
      );
      const store = transaction.objectStore(this.config.stores.cache);

      // First, remove old cache for this endpoint
      const index = store.index("endpoint");
      const deleteRequest = index.openCursor(IDBKeyRange.only(endpoint));

      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Add new cache entry
          const addRequest = store.add(cachedData);
          addRequest.onsuccess = () => {
            console.log("Data cached for endpoint:", endpoint);
            resolve();
          };
          addRequest.onerror = () => reject(addRequest.error);
        }
      };

      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  // Get cached data
  async getCachedData(endpoint: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.config.stores.cache],
        "readonly",
      );
      const store = transaction.objectStore(this.config.stores.cache);
      const index = store.index("endpoint");
      const request = index.get(endpoint);

      request.onsuccess = () => {
        const cached = request.result;
        if (cached) {
          // Check if cache is still valid
          const now = new Date();
          const expiresAt = new Date(cached.expiresAt);

          if (now < expiresAt) {
            console.log("Cache hit for endpoint:", endpoint);
            resolve(cached.data);
          } else {
            console.log("Cache expired for endpoint:", endpoint);
            // Clean up expired cache
            this.cleanExpiredCache();
            resolve(null);
          }
        } else {
          console.log("Cache miss for endpoint:", endpoint);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("Failed to get cached data:", request.error);
        reject(request.error);
      };
    });
  }

  // Clean expired cache entries
  async cleanExpiredCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(
      [this.config.stores.cache],
      "readwrite",
    );
    const store = transaction.objectStore(this.config.stores.cache);
    const index = store.index("expiresAt");
    const now = new Date().toISOString();

    const request = index.openCursor(IDBKeyRange.upperBound(now));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  // Sync pending actions
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) {
      console.log("Sync already in progress");
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingActions = await this.getPendingActions();
      console.log(`Starting sync of ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        // Skip actions that have failed too many times
        if (action.retryCount >= 3) {
          console.log(`Skipping action ${action.id} - too many retries`);
          continue;
        }

        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });

          if (response.ok) {
            await this.markActionSynced(action.id, true);
            successCount++;
            console.log(`Successfully synced action: ${action.id}`);
          } else {
            await this.markActionSynced(
              action.id,
              false,
              `HTTP ${response.status}`,
            );
            failedCount++;
            console.log(
              `Failed to sync action ${action.id}: HTTP ${response.status}`,
            );
          }
        } catch (error) {
          await this.markActionSynced(
            action.id,
            false,
            error instanceof Error ? error.message : "Unknown error",
          );
          failedCount++;
          console.log(`Failed to sync action ${action.id}:`, error);
        }

        // Add delay between requests to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.trackOfflineEvent("sync_completed", {
        success: successCount,
        failed: failedCount,
      });
      console.log(
        `Sync completed: ${successCount} success, ${failedCount} failed`,
      );
    } catch (error) {
      console.error("Sync process failed:", error);
      this.trackOfflineEvent("sync_error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      this.syncInProgress = false;
    }

    return { success: successCount, failed: failedCount };
  }

  // Track offline events for analytics
  async trackOfflineEvent(type: string, data: any): Promise<void> {
    if (!this.db) return;

    const event = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      const transaction = this.db.transaction(
        [this.config.stores.analytics],
        "readwrite",
      );
      const store = transaction.objectStore(this.config.stores.analytics);
      await store.add(event);
    } catch (error) {
      console.error("Failed to track offline event:", error);
    }
  }

  // Get offline analytics
  async getOfflineAnalytics(type?: string): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.config.stores.analytics],
        "readonly",
      );
      const store = transaction.objectStore(this.config.stores.analytics);

      let request;
      if (type) {
        const index = store.index("type");
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const storeNames = Object.values(this.config.stores);
    const transaction = this.db.transaction(storeNames, "readwrite");

    const promises = storeNames.map((storeName) => {
      return new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log("All offline data cleared");
  }

  // Get storage stats
  async getStorageStats(): Promise<{
    pendingActions: number;
    cachedItems: number;
    analyticsEvents: number;
    totalSize: number;
  }> {
    if (!this.db) throw new Error("Database not initialized");

    const [pendingActions, cachedItems, analyticsEvents] = await Promise.all([
      this.getPendingActions(),
      new Promise<CachedData[]>((resolve, reject) => {
        const transaction = this.db!.transaction(
          [this.config.stores.cache],
          "readonly",
        );
        const store = transaction.objectStore(this.config.stores.cache);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      this.getOfflineAnalytics(),
    ]);

    // Estimate total size (rough calculation)
    const totalSize =
      pendingActions.length * 1000 + // ~1KB per action
      cachedItems.length * 5000 + // ~5KB per cached item
      analyticsEvents.length * 500; // ~500B per analytics event

    return {
      pendingActions: pendingActions.length,
      cachedItems: cachedItems.length,
      analyticsEvents: analyticsEvents.length,
      totalSize,
    };
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log("IndexedDB connection closed");
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();

// Helper functions for easier usage
export const initOfflineStorage = () => offlineStorage.init();
export const storeOfflineAction = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
) => offlineStorage.storeOfflineAction(url, method, headers, body);
export const cacheData = (endpoint: string, data: any, ttl?: number) =>
  offlineStorage.cacheData(endpoint, data, ttl);
export const getCachedData = (endpoint: string) =>
  offlineStorage.getCachedData(endpoint);
export const syncPendingActions = () => offlineStorage.syncPendingActions();
export const getStorageStats = () => offlineStorage.getStorageStats();
export const trackOfflineEvent = (type: string, data: any) =>
  offlineStorage.trackOfflineEvent(type, data);
