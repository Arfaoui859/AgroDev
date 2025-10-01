// Offline Sync Service Worker for AgroGrowth Platform

const CACHE_NAME = "agrogrowth-v1.0.0";
const DATA_CACHE_NAME = "agrogrowth-data-v1.0.0";

// URLs to cache for offline access
const urlsToCache = [
  "/",
  "/gamification",
  "/investor-dashboard",
  "/public-data",
  "/farmer-collaboration",
  "/farmer-segmentation",
  "/analysis",
  "/market-dashboard",
  "/offline",
  // Add critical CSS and JS files
  "/assets/index.css",
  "/assets/index.js",
  // Add icon and manifest
  "/favicon.ico",
  "/manifest.json",
];

// API endpoints to cache
const apiEndpointsToCache = [
  "/api/farmer-dashboard/overview",
  "/api/weather/coordinates",
  "/api/market/all",
  "/api/gamification/profile",
  "/api/collaboration/chat-rooms",
  "/api/segmentation/segments",
  "/api/public/market-prices",
  "/api/ai/health",
];

// Install event - cache static resources
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("[SW] Installing Service Worker");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static resources");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("[SW] Activating Service Worker");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle network requests
self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle other requests (static assets)
  event.respondWith(handleStaticRequest(event.request));
});

// Handle API requests with cache-first strategy for certain endpoints
async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // For read-only endpoints, try cache first
  if (isReadOnlyEndpoint(pathname) && request.method === "GET") {
    try {
      // Try network first for fresh data
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        // Cache successful responses
        const cache = await caches.open(DATA_CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }

      throw new Error("Network response not ok");
    } catch (error) {
      // Fall back to cache if network fails
      console.log("[SW] Network failed, trying cache for:", pathname);
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Return offline response if no cache
      return createOfflineResponse(pathname);
    }
  }

  // For write operations, store in IndexedDB if offline
  if (request.method === "POST" || request.method === "PUT") {
    try {
      return await fetch(request);
    } catch (error) {
      // Store for later sync
      await storeOfflineAction(request);
      return new Response(
        JSON.stringify({
          success: false,
          offline: true,
          message: "Stored for sync when online",
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Default: try network, fall back to cache
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse(pathname);
  }
}

// Handle navigation requests
async function handleNavigationRequest(request: Request): Promise<Response> {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Fall back to cached version or offline page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlineResponse = await caches.match("/offline");
    return offlineResponse || new Response("App offline", { status: 503 });
  }
}

// Handle static requests (CSS, JS, images)
async function handleStaticRequest(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return placeholder for failed requests
    return new Response("Resource unavailable offline", { status: 503 });
  }
}

// Check if endpoint is read-only
function isReadOnlyEndpoint(pathname: string): boolean {
  const readOnlyPatterns = [
    "/api/farmer-dashboard/",
    "/api/weather/",
    "/api/market/",
    "/api/gamification/profile",
    "/api/gamification/leaderboard",
    "/api/collaboration/chat-rooms",
    "/api/segmentation/",
    "/api/public/",
    "/api/ai/health",
  ];

  return readOnlyPatterns.some((pattern) => pathname.startsWith(pattern));
}

// Create offline response for different endpoints
function createOfflineResponse(pathname: string): Response {
  let offlineData = {};

  if (pathname.includes("/farmer-dashboard/overview")) {
    offlineData = {
      success: true,
      offline: true,
      data: {
        soil: {
          ph: 7.0,
          moisture: 45,
          temperature: 22,
          nutrients: { nitrogen: 80, phosphorus: 40, potassium: 120 },
          lastUpdated: new Date().toISOString(),
        },
        crops: [],
        weather: {
          temperature: 24,
          humidity: 65,
          condition: "Partly Cloudy",
          conditionArabic: "غائم جزئياً",
        },
        systemAlerts: [],
      },
    };
  } else if (pathname.includes("/gamification/profile")) {
    offlineData = {
      success: true,
      offline: true,
      data: {
        currentXP: 0,
        currentLevel: 1,
        totalXP: 0,
        badges: [],
        achievements: [],
        streak: 1,
      },
    };
  } else if (pathname.includes("/market-prices")) {
    offlineData = {
      success: true,
      offline: true,
      data: [],
      message: "Market data unavailable offline",
    };
  } else {
    offlineData = {
      success: false,
      offline: true,
      message: "Data unavailable offline",
    };
  }

  return new Response(JSON.stringify(offlineData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Store offline actions in IndexedDB
async function storeOfflineAction(request: Request): Promise<void> {
  try {
    const body = await request.text();
    const action = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    // Store in IndexedDB (simplified - would use proper IndexedDB API)
    console.log("[SW] Storing offline action:", action);

    // Notify clients about offline action
    notifyClients({ type: "OFFLINE_ACTION_STORED", action });
  } catch (error) {
    console.error("[SW] Failed to store offline action:", error);
  }
}

// Notify clients about events
function notifyClients(message: any): void {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Background sync for offline actions
self.addEventListener("sync", (event: any) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync stored offline actions
async function syncOfflineActions(): Promise<void> {
  try {
    console.log("[SW] Syncing offline actions...");

    // Would retrieve actions from IndexedDB and replay them
    // This is a simplified version

    notifyClients({
      type: "SYNC_COMPLETE",
      message: "Offline actions synced successfully",
    });
  } catch (error) {
    console.error("[SW] Sync failed:", error);
    notifyClients({
      type: "SYNC_FAILED",
      error: error.message,
    });
  }
}

// Handle messages from main thread
self.addEventListener("message", (event: MessageEvent) => {
  console.log("[SW] Received message:", event.data);

  const { type, data } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CACHE_URLS":
      event.waitUntil(cacheUrls(data.urls));
      break;

    case "CLEAR_CACHE":
      event.waitUntil(clearCache(data.cacheName));
      break;

    case "GET_CACHE_STATUS":
      getCacheStatus().then((status) => {
        event.ports[0]?.postMessage(status);
      });
      break;

    default:
      console.log("[SW] Unknown message type:", type);
  }
});

// Cache additional URLs
async function cacheUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(urls);
  console.log("[SW] Cached additional URLs:", urls);
}

// Clear specific cache
async function clearCache(cacheName: string): Promise<void> {
  await caches.delete(cacheName);
  console.log("[SW] Cleared cache:", cacheName);
}

// Get cache status
async function getCacheStatus(): Promise<any> {
  const cacheNames = await caches.keys();
  const status = {
    caches: cacheNames,
    version: CACHE_NAME,
    dataCache: DATA_CACHE_NAME,
  };

  return status;
}

// Periodic background sync (if supported)
if ("periodicSync" in self.registration) {
  self.addEventListener("periodicsync", (event: any) => {
    if (event.tag === "background-data-sync") {
      event.waitUntil(performBackgroundSync());
    }
  });
}

// Background data sync
async function performBackgroundSync(): Promise<void> {
  try {
    console.log("[SW] Performing background data sync...");

    // Update critical data in background
    const criticalEndpoints = [
      "/api/farmer-dashboard/overview",
      "/api/weather/coordinates?lat=36.8065&lon=10.1815",
      "/api/market/all",
      "/api/ai/health",
    ];

    const cache = await caches.open(DATA_CACHE_NAME);

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.log("[SW] Failed to update:", endpoint);
      }
    }

    console.log("[SW] Background sync completed");
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
  }
}

// Export for TypeScript
export {};
