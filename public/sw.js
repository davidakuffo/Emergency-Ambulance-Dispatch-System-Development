// Service Worker for Ghana Emergency Medical Services
// Handles push notifications, caching, and offline functionality

const CACHE_NAME = 'ghana-ems-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/dispatcher',
  '/admin',
  '/analytics',
  '/mobile',
  '/government',
  '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Ghana EMS Update',
    body: 'You have a new emergency service update',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'ghana-ems-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  // Customize notification based on type
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'ambulance_dispatched':
        notificationData.title = '🚨 Ambulance Dispatched';
        notificationData.body = `Ambulance ${notificationData.vehicleId || ''} is on the way to your location`;
        notificationData.tag = 'ambulance-dispatch';
        break;
      
      case 'ambulance_arrived':
        notificationData.title = '✅ Ambulance Arrived';
        notificationData.body = `Ambulance ${notificationData.vehicleId || ''} has arrived at your location`;
        notificationData.tag = 'ambulance-arrival';
        break;
      
      case 'emergency_update':
        notificationData.title = '📋 Emergency Update';
        notificationData.body = notificationData.message || 'Your emergency request has been updated';
        notificationData.tag = 'emergency-update';
        break;
      
      case 'system_alert':
        notificationData.title = '⚠️ System Alert';
        notificationData.body = notificationData.message || 'Important system notification';
        notificationData.tag = 'system-alert';
        break;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Handle action clicks
  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline emergency requests
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'emergency-request-sync') {
    event.waitUntil(syncEmergencyRequests());
  }
});

// Sync emergency requests when back online
async function syncEmergencyRequests() {
  try {
    // Get pending emergency requests from IndexedDB
    const pendingRequests = await getPendingEmergencyRequests();
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });

        if (response.ok) {
          // Remove from pending requests
          await removePendingEmergencyRequest(request.id);
          
          // Show success notification
          self.registration.showNotification('✅ Emergency Request Sent', {
            body: 'Your emergency request has been successfully submitted',
            icon: '/icon-192x192.png',
            tag: 'sync-success'
          });
        }
      } catch (error) {
        console.error('Failed to sync emergency request:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getPendingEmergencyRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GhanaEMS', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingRequests'], 'readonly');
      const store = transaction.objectStore('pendingRequests');
      const cursorRequest = store.openCursor();
      const results = [];

      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const record = cursor.value;
          // Only include unsynced requests
          if (!record.synced) {
            results.push(record);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      cursorRequest.onerror = () => reject(cursorRequest.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingRequests')) {
        const store = db.createObjectStore('pendingRequests', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

async function removePendingEmergencyRequest(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GhanaEMS', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingRequests'], 'readwrite');
      const store = transaction.objectStore('pendingRequests');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
