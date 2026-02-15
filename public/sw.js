// AgroGrowth Service Worker
// Version 1.0.0

const CACHE_NAME = "agrogrowth-v1.0.0";
const OFFLINE_URL = "/offline.html";

// Assets to cache for offline functionality
const STATIC_CACHE_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  // Core CSS and JS will be cached automatically by Vite
];

// API endpoints to cache
const API_CACHE_URLS = [
  "/api/farm-management/overview",
  "/api/notifications",
  "/api/weather/coordinates",
];

// Dynamic cache patterns
const CACHE_PATTERNS = {
  API: /^\/api\//,
  IMAGES: /\.(jpg|jpeg|png|webp|svg)$/,
  STATIC: /\.(css|js|woff2?)$/,
  PAGES:
    /^\/(farmer-dashboard|enhanced-analysis|market-dashboard|disease-upload)/,
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log("✅ Service Worker installed successfully");
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("❌ Service Worker installation failed:", error);
      }),
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("✅ Service Worker activated");
        // Take control of all clients immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - network-first with fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Handle different types of requests
  if (CACHE_PATTERNS.API.test(url.pathname)) {
    // API requests - network first, cache fallback
    event.respondWith(networkFirstThenCache(request));
  } else if (CACHE_PATTERNS.IMAGES.test(url.pathname)) {
    // Images - cache first, network fallback
    event.respondWith(cacheFirstThenNetwork(request));
  } else if (CACHE_PATTERNS.STATIC.test(url.pathname)) {
    // Static assets - cache first
    event.respondWith(cacheFirstThenNetwork(request));
  } else if (CACHE_PATTERNS.PAGES.test(url.pathname)) {
    // Pages - network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    // Default strategy - network first
    event.respondWith(networkFirstThenCache(request));
  }
});

// Network first, then cache strategy
async function networkFirstThenCache(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("🌐 Network failed, checking cache for:", request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's an API request, return a fallback response
    if (CACHE_PATTERNS.API.test(new URL(request.url).pathname)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Network unavailable",
          offline: true,
          message: "البيانات غير متاحة حالياً - يرجى التحقق من الاتصال",
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        },
      );
    }

    throw error;
  }
}

// Cache first, then network strategy
async function cacheFirstThenNetwork(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {
        // Ignore network errors for background updates
      });

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("❌ Both cache and network failed for:", request.url);
    throw error;
  }
}

// Network first with offline page fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_URL);
    }

    throw error;
  }
}

// Background sync for form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("🔄 Background sync triggered");
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get pending requests from IndexedDB
    const pendingRequests = await getPendingRequests();

    for (const requestData of pendingRequests) {
      try {
        await fetch(requestData.url, requestData.options);
        // Remove from pending requests after successful sync
        await removePendingRequest(requestData.id);
        console.log("✅ Synced request:", requestData.url);
      } catch (error) {
        console.error("❌ Failed to sync request:", requestData.url, error);
      }
    }
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("📱 Push notification received");

  let notificationData = {
    title: "AgroGrowth",
    body: "لديك إشعار جديد",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "agrogrowth-notification",
    requireInteraction: false,
    actions: [
      {
        action: "open",
        title: "فتح التطبيق",
        icon: "/icons/action-open.png",
      },
      {
        action: "dismiss",
        title: "إغلاق",
        icon: "/icons/action-dismiss.png",
      },
    ],
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error("❌ Failed to parse push notification data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData,
    ),
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("📱 Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Open the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});

// Helper functions for IndexedDB operations
async function getPendingRequests() {
  // Implementation would depend on IndexedDB setup
  // For now, return empty array
  return [];
}

async function removePendingRequest(id) {
  // Implementation would depend on IndexedDB setup
  console.log("Removing pending request:", id);
}

// Share target handling (if supported)
self.addEventListener("share", (event) => {
  console.log("📤 Share target activated:", event);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/");
      }),
  );
});

console.log("🌱 AgroGrowth Service Worker loaded successfully");
