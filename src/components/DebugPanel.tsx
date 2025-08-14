"use client";
import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';
import { notificationService } from '@/lib/notifications';

interface DebugPanelProps {
  className?: string;
}

export default function DebugPanel({ className = '' }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('unknown');

  useEffect(() => {
    updateStatus();
    
    const interval = setInterval(updateStatus, 2000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateStatus = async () => {
    setIsOnline(navigator.onLine);
    
    try {
      const pending = await offlineStorage.getPendingRequests();
      setPendingRequests(pending.length);
    } catch (error) {
      console.error('Failed to get pending requests:', error);
    }
    
    setNotificationStatus(notificationService.getPermissionStatus());
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.active) {
          setServiceWorkerStatus('active');
        } else if (registration.waiting) {
          setServiceWorkerStatus('waiting');
        } else if (registration.installing) {
          setServiceWorkerStatus('installing');
        } else {
          setServiceWorkerStatus('registered');
        }
      } else {
        setServiceWorkerStatus('not registered');
      }
    }
  };

  const testOfflineRequest = async () => {
    try {
      const testData = {
        location: { lat: 5.6037, lng: -0.1870 },
        severityLevel: 2 as 1 | 2 | 3 | 4,
        address: "Test emergency request",
        callerPhone: "+233123456789",
        emergencyType: "test",
        contactName: "Test User",
        description: "This is a test emergency request"
      };
      
      await offlineStorage.saveEmergencyRequest(testData);
      alert('Test emergency request saved offline!');
      updateStatus();
    } catch (error) {
      alert('Failed to save test request: ' + error);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      alert('Failed to send test notification: ' + error);
    }
  };

  const testServiceWorkerActivation = async () => {
    try {
      const isReady = await notificationService.ensureServiceWorkerReady();
      alert(`Service Worker Ready: ${isReady}`);
      updateStatus();
    } catch (error) {
      alert('Service Worker test failed: ' + error);
    }
  };

  const syncNow = async () => {
    try {
      const result = await offlineStorage.syncPendingRequests();
      alert(`Sync complete: ${result.success} success, ${result.failed} failed`);
      updateStatus();
    } catch (error) {
      alert('Sync failed: ' + error);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-40 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors duration-200 ${className}`}
        aria-label="Open debug panel"
      >
        🔧
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Debug Panel</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Online:</span>
            <span className={`ml-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? '✓' : '✗'}
            </span>
          </div>
          <div>
            <span className="font-medium">Pending:</span>
            <span className="ml-2 text-blue-600">{pendingRequests}</span>
          </div>
        </div>
        
        <div>
          <span className="font-medium">Notifications:</span>
          <span className={`ml-2 ${
            notificationStatus === 'granted' ? 'text-green-600' : 
            notificationStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {notificationStatus}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Service Worker:</span>
          <span className={`ml-2 ${
            serviceWorkerStatus === 'active' ? 'text-green-600' :
            serviceWorkerStatus === 'waiting' || serviceWorkerStatus === 'installing' ? 'text-yellow-600' :
            serviceWorkerStatus === 'registered' ? 'text-blue-600' : 'text-red-600'
          }`}>
            {serviceWorkerStatus}
          </span>
        </div>
        
        <div className="border-t pt-3 space-y-2">
          <button
            type="button"
            onClick={testOfflineRequest}
            className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-150"
          >
            Test Offline Request
          </button>
          
          <button
            type="button"
            onClick={testNotification}
            className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors duration-150"
          >
            Test Notification
          </button>

          <button
            type="button"
            onClick={testServiceWorkerActivation}
            className="w-full px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors duration-150"
          >
            Test Service Worker
          </button>
          
          {pendingRequests > 0 && (
            <button
              type="button"
              onClick={syncNow}
              className="w-full px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors duration-150"
            >
              Sync Now ({pendingRequests})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
