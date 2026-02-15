import { useState, useEffect, useCallback, useRef } from "react";
import {
  offlineStorage,
  initOfflineStorage,
  storeOfflineAction,
  cacheData,
  getCachedData,
  syncPendingActions,
  getStorageStats,
  trackOfflineEvent,
} from "@/lib/offline-storage";
import { useToast } from "@/hooks/use-toast";

interface OfflineState {
  isOnline: boolean;
  isOfflineReady: boolean;
  pendingActions: number;
  lastSync: string | null;
  syncInProgress: boolean;
  storageStats: {
    pendingActions: number;
    cachedItems: number;
    analyticsEvents: number;
    totalSize: number;
  } | null;
}

interface OfflineHookReturn {
  // State
  isOnline: boolean;
  isOfflineReady: boolean;
  pendingActions: number;
  lastSync: string | null;
  syncInProgress: boolean;
  storageStats: OfflineState["storageStats"];

  // Actions
  fetchWithCache: (url: string, options?: RequestInit) => Promise<Response>;
  forceSync: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  refreshStorageStats: () => Promise<void>;

  // Utilities
  isDataFresh: (timestamp: string, maxAge?: number) => boolean;
  getOfflineMessage: () => string;
}

export const useOffline = (): OfflineHookReturn => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOfflineReady: false,
    pendingActions: 0,
    lastSync: null,
    syncInProgress: false,
    storageStats: null,
  });

  const { toast } = useToast();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize offline storage
  useEffect(() => {
    const initOffline = async () => {
      try {
        await initOfflineStorage();
        setState((prev) => ({ ...prev, isOfflineReady: true }));

        // Register service worker
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register(
            "/workers/offline-sync.js",
          );
          console.log("Service Worker registered:", registration);

          // Listen for service worker messages
          navigator.serviceWorker.addEventListener(
            "message",
            handleServiceWorkerMessage,
          );
        }

        // Update storage stats
        await refreshStorageStats();

        console.log("Offline functionality initialized");
      } catch (error) {
        console.error("Failed to initialize offline functionality:", error);
        toast({
          title: "تحذير",
          description: "فشل في تهيئة الوضع غير المتصل",
          variant: "destructive",
        });
      }
    };

    initOffline();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [toast]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setState((prev) => ({ ...prev, isOnline: true }));

      toast({
        title: "متصل!",
        description: "تم استعادة الاتصال بالإنترنت",
      });

      // Start sync after a delay to ensure stable connection
      syncTimeoutRef.current = setTimeout(async () => {
        await forceSync();
      }, 2000);

      trackOfflineEvent("connection_restored", {
        timestamp: new Date().toISOString(),
      });
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));

      toast({
        title: "غير متصل",
        description: "سيتم حفظ التغييرات ومزامنتها عند الاتصال",
        variant: "destructive",
      });

      trackOfflineEvent("connection_lost", {
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle service worker messages
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
      case "OFFLINE_ACTION_STORED":
        setState((prev) => ({
          ...prev,
          pendingActions: prev.pendingActions + 1,
        }));
        break;

      case "SYNC_COMPLETE":
        setState((prev) => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncInProgress: false,
        }));
        toast({
          title: "تمت المزامنة!",
          description: "تم مزامنة جميع البيانات المحفوظة",
        });
        refreshStorageStats();
        break;

      case "SYNC_FAILED":
        setState((prev) => ({ ...prev, syncInProgress: false }));
        toast({
          title: "فشلت المزامنة",
          description: "سنعيد المحاولة تلقائياً",
          variant: "destructive",
        });
        break;

      default:
        console.log("Unknown service worker message:", type);
    }
  };

  // Fetch with cache support
  const fetchWithCache = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const cacheKey = `${options.method || "GET"}_${url}`;

      try {
        // Try network first if online
        if (state.isOnline) {
          const response = await fetch(url, options);

          if (response.ok) {
            // Cache successful GET responses
            if (!options.method || options.method === "GET") {
              const responseData = await response.clone().json();
              await cacheData(cacheKey, responseData, 300000); // 5 minutes TTL
            }
            return response;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        throw new Error("Offline");
      } catch (error) {
        console.log("Network request failed, checking cache:", url);

        // For GET requests, try cache
        if (!options.method || options.method === "GET") {
          const cachedData = await getCachedData(cacheKey);
          if (cachedData) {
            console.log("Serving from cache:", url);
            return new Response(JSON.stringify(cachedData), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // For POST/PUT requests or when no cache, store for later sync
        if (options.method === "POST" || options.method === "PUT") {
          const headers = Object.fromEntries(
            Object.entries(options.headers || {}).map(([key, value]) => [
              key,
              String(value),
            ]),
          );

          await storeOfflineAction(
            url,
            options.method || "POST",
            headers,
            options.body,
          );

          setState((prev) => ({
            ...prev,
            pendingActions: prev.pendingActions + 1,
          }));

          // Return success response for offline actions
          return new Response(
            JSON.stringify({
              success: true,
              offline: true,
              message: "تم حفظ الطلب للمزامنة عند الاتصال",
            }),
            {
              status: 202,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // No cache available, return error
        throw new Error("No cached data available and offline");
      }
    },
    [state.isOnline],
  );

  // Force sync pending actions
  const forceSync = useCallback(async (): Promise<void> => {
    if (!state.isOnline || state.syncInProgress) {
      return;
    }

    setState((prev) => ({ ...prev, syncInProgress: true }));

    try {
      const result = await syncPendingActions();

      setState((prev) => ({
        ...prev,
        pendingActions: Math.max(0, prev.pendingActions - result.success),
        lastSync: new Date().toISOString(),
        syncInProgress: false,
      }));

      if (result.success > 0) {
        toast({
          title: "تمت المزامنة!",
          description: `تم مزامنة ${result.success} عملية بنجاح`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: "مزامنة جزئية",
          description: `نجحت ${result.success} وفشلت ${result.failed} عمليات`,
          variant: "destructive",
        });
      }

      await refreshStorageStats();
    } catch (error) {
      setState((prev) => ({ ...prev, syncInProgress: false }));
      console.error("Sync failed:", error);

      toast({
        title: "فشلت المزامنة",
        description: "حدث خطأ أثناء المزامنة",
        variant: "destructive",
      });
    }
  }, [state.isOnline, state.syncInProgress, toast]);

  // Clear all offline data
  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      await offlineStorage.clearAllData();
      setState((prev) => ({
        ...prev,
        pendingActions: 0,
        storageStats: null,
      }));

      toast({
        title: "تم الحذف",
        description: "تم حذف جميع البيانات المحفوظة محلياً",
      });

      trackOfflineEvent("offline_data_cleared", {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to clear offline data:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف البيانات المحفوظة",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Refresh storage statistics
  const refreshStorageStats = useCallback(async (): Promise<void> => {
    try {
      const stats = await getStorageStats();
      setState((prev) => ({
        ...prev,
        storageStats: stats,
        pendingActions: stats.pendingActions,
      }));
    } catch (error) {
      console.error("Failed to get storage stats:", error);
    }
  }, []);

  // Check if data is fresh
  const isDataFresh = useCallback(
    (
      timestamp: string,
      maxAge: number = 300000, // 5 minutes default
    ): boolean => {
      const dataTime = new Date(timestamp).getTime();
      const now = Date.now();
      return now - dataTime < maxAge;
    },
    [],
  );

  // Get appropriate offline message
  const getOfflineMessage = useCallback((): string => {
    if (state.isOnline) {
      return state.pendingActions > 0
        ? `${state.pendingActions} عملية في انتظار المزامنة`
        : "متصل ومحدث";
    }
    return "غير متصل - البيانات محفوظة محلياً";
  }, [state.isOnline, state.pendingActions]);

  return {
    // State
    isOnline: state.isOnline,
    isOfflineReady: state.isOfflineReady,
    pendingActions: state.pendingActions,
    lastSync: state.lastSync,
    syncInProgress: state.syncInProgress,
    storageStats: state.storageStats,

    // Actions
    fetchWithCache,
    forceSync,
    clearOfflineData,
    refreshStorageStats,

    // Utilities
    isDataFresh,
    getOfflineMessage,
  };
};

// Helper hook for components that need simple offline status
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
};

// Hook for caching specific API endpoints
export const useApiCache = (endpoint: string, options?: RequestInit) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithCache, isOnline } = useOffline();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithCache(endpoint, options);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchWithCache, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    if (isOnline) {
      fetchData();
    }
  }, [fetchData, isOnline]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale: !isOnline && data !== null,
  };
};
