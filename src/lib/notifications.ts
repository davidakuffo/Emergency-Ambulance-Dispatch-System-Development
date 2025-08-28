// Push Notification Service for Ghana Emergency Medical Services
// Handles notification permissions, subscription, and messaging

export interface NotificationData {
  type: 'ambulance_dispatched' | 'ambulance_arrived' | 'emergency_update' | 'system_alert';
  title?: string;
  body?: string;
  vehicleId?: string;
  message?: string;
  url?: string;
  requireInteraction?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: globalThis.PushSubscription | null = null;

  // VAPID public key (in production, this would be from environment variables)
  private readonly vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLEaQK07x8hiKSHjfcHqLmFxJQjuLiZdHSm1Tcm4aLEr4nuLuyKXiAo';

  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Ensure we have the latest registration
      this.registration = await navigator.serviceWorker.getRegistration('/') || null;

      if (!this.registration) {
        throw new Error('Failed to get service worker registration');
      }

      // Wait for service worker to become active
      await this.waitForServiceWorkerActivation();

      console.log('Service Worker is active and ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  private async waitForServiceWorkerActivation(): Promise<void> {
    if (!this.registration) {
      throw new Error('No service worker registration');
    }

    // If already active, return immediately
    if (this.registration.active) {
      return;
    }

    // Wait for activation with timeout
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Service Worker activation timeout'));
      }, 10000); // 10 second timeout

      const checkActivation = () => {
        if (this.registration!.active) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        // Check if there's a waiting service worker that needs to be activated
        if (this.registration!.waiting) {
          // Send message to skip waiting
          this.registration!.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Check if there's an installing service worker
        if (this.registration!.installing) {
          this.registration!.installing.addEventListener('statechange', () => {
            if (this.registration!.installing?.state === 'activated') {
              clearTimeout(timeout);
              resolve();
            }
          });
        } else {
          // Keep checking
          setTimeout(checkActivation, 100);
        }
      };

      checkActivation();
    });
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  async subscribeToPush(): Promise<globalThis.PushSubscription | null> {
    try {
      // Ensure service worker is initialized
      if (!this.registration) {
        console.log('Service Worker not initialized, initializing now...');
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('Failed to initialize service worker');
          return null;
        }
      }

      // Double-check we have an active service worker
      if (!this.registration || !this.registration.active) {
        console.log('Service Worker not active, waiting for activation...');
        await this.waitForServiceWorkerActivation();
      }

      // Final check
      if (!this.registration || !this.registration.active) {
        console.error('Service Worker still not active after waiting');
        return null;
      }

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('Already subscribed to push notifications');
        return this.subscription;
      }

      console.log('Subscribing to push notifications...');

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Successfully subscribed to push notifications');

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);

      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('not supported')) {
          console.error('Push notifications are not supported in this browser');
        } else if (error.message.includes('permission')) {
          console.error('Push notification permission was denied');
        } else if (error.message.includes('network')) {
          console.error('Network error while subscribing to push notifications');
        }
      }

      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true;
      }

      const success = await this.subscription.unsubscribe();

      if (success) {
        this.subscription = null;
        console.log('Unsubscribed from push notifications');

        // Notify server about unsubscription
        await this.removeSubscriptionFromServer();
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async showLocalNotification(data: NotificationData): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: data.body || 'Emergency service update',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `ghana-ems-${data.type}`,
      requireInteraction: data.requireInteraction || false,
      // Note: actions are not supported in all browsers, removing for compatibility
      data: {
        url: data.url || '/',
        type: data.type
      }
    };

    new Notification(data.title || 'Ghana EMS Update', options);
  }

  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification({
      type: 'system_alert',
      title: '🧪 Test Notification',
      body: 'Push notifications are working correctly!',
      requireInteraction: false
    });
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  isServiceWorkerReady(): boolean {
    return this.registration !== null && this.registration.active !== null;
  }

  async ensureServiceWorkerReady(): Promise<boolean> {
    if (this.isServiceWorkerReady()) {
      return true;
    }

    try {
      const initialized = await this.initialize();
      return initialized && this.isServiceWorkerReady();
    } catch (error) {
      console.error('Failed to ensure service worker is ready:', error);
      return false;
    }
  }

  private async sendSubscriptionToServer(subscription: globalThis.PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: this.arrayBufferToBase64(subscription.getKey('auth'))
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Utility functions for emergency notifications
export const sendAmbulanceDispatchedNotification = (vehicleId: string) => {
  notificationService.showLocalNotification({
    type: 'ambulance_dispatched',
    title: '🚨 Ambulance Dispatched',
    body: `Ambulance ${vehicleId} is on the way to your location`,
    requireInteraction: true,
    url: '/'
  });
};

export const sendAmbulanceArrivedNotification = (vehicleId: string) => {
  notificationService.showLocalNotification({
    type: 'ambulance_arrived',
    title: '✅ Ambulance Arrived',
    body: `Ambulance ${vehicleId} has arrived at your location`,
    requireInteraction: true,
    url: '/'
  });
};

export const sendEmergencyUpdateNotification = (message: string) => {
  notificationService.showLocalNotification({
    type: 'emergency_update',
    title: '📋 Emergency Update',
    body: message,
    requireInteraction: false,
    url: '/'
  });
};

// Initialize notification service when module loads
if (typeof window !== 'undefined') {
  // Wait for the page to load before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeNotificationService();
    });
  } else {
    // If document is already loaded, wait a bit for other scripts to load
    setTimeout(initializeNotificationService, 100);
  }
}

function initializeNotificationService() {
  notificationService.initialize().then((success) => {
    if (success) {
      console.log('Notification service initialized successfully');
    } else {
      console.warn('Failed to initialize notification service');
    }
  }).catch((error) => {
    console.error('Error initializing notification service:', error);
  });
}
