"use client";
import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Update pending requests count
    updatePendingCount();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const pending = await offlineStorage.getPendingRequests();
      setPendingRequests(pending.length);
    } catch (error) {
      console.error('Failed to get pending requests count:', error);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) return;

    try {
      const result = await offlineStorage.syncPendingRequests();
      console.log(`Manual sync: ${result.success} success, ${result.failed} failed`);
      updatePendingCount();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  if (isOnline && pendingRequests === 0) {
    return null; // Don't show indicator when online and no pending requests
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div 
        className={`rounded-lg shadow-lg border p-3 cursor-pointer transition-all duration-200 ${
          isOnline 
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
            : 'bg-red-50 border-red-200 hover:bg-red-100'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          } ${!isOnline ? 'animate-pulse' : ''}`}></div>

          {/* Status Text */}
          <div className="text-sm">
            <div className={`font-medium ${
              isOnline ? 'text-blue-800' : 'text-red-800'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            {pendingRequests > 0 && (
              <div className={`text-xs ${
                isOnline ? 'text-blue-600' : 'text-red-600'
              }`}>
                {pendingRequests} pending request{pendingRequests !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Expand Icon */}
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${
              showDetails ? 'rotate-180' : ''
            } ${isOnline ? 'text-blue-600' : 'text-red-600'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              {!isOnline && (
                <div className="text-xs text-red-700">
                  <p className="font-medium mb-1">You're currently offline</p>
                  <p>Emergency requests will be saved and sent when you're back online.</p>
                </div>
              )}

              {isOnline && pendingRequests > 0 && (
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Syncing pending requests</p>
                  <p>Your offline emergency requests are being sent to the server.</p>
                </div>
              )}

              {/* Sync Button */}
              {isOnline && pendingRequests > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncNow();
                  }}
                  className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-150"
                >
                  Sync Now
                </button>
              )}

              {/* Offline Features */}
              {!isOnline && (
                <div className="text-xs text-red-700 mt-2">
                  <p className="font-medium mb-1">Available offline:</p>
                  <ul className="space-y-1">
                    <li>• Submit emergency requests</li>
                    <li>• View cached information</li>
                    <li>• Access emergency contacts</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Install Ghana EMS</h4>
            <p className="text-sm text-gray-600 mb-3">
              Install our app for faster emergency access and offline capability.
            </p>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors duration-150"
              >
                Install
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors duration-150"
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close install prompt"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
