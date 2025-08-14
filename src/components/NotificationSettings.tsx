"use client";
import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';
import { useTranslation } from '@/contexts/LanguageContext';

interface NotificationSettingsProps {
  className?: string;
  variant?: 'inline' | 'modal' | 'card';
  onClose?: () => void;
}

export default function NotificationSettings({ 
  className = '', 
  variant = 'card',
  onClose 
}: NotificationSettingsProps) {
  const t = useTranslation();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = () => {
    setIsSupported(notificationService.isSupported());
    setPermission(notificationService.getPermissionStatus());
    setIsSubscribed(notificationService.isSubscribed());
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setLoadingMessage('Requesting permission...');

    try {
      // Request permission first
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        console.log('Notification permission granted, preparing service worker...');
        setLoadingMessage('Preparing service worker...');

        // Ensure service worker is ready
        const isReady = await notificationService.ensureServiceWorkerReady();
        if (!isReady) {
          throw new Error('Service worker failed to activate');
        }

        setLoadingMessage('Subscribing to notifications...');

        // Subscribe to push notifications with retry logic
        let subscription = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!subscription && retryCount < maxRetries) {
          try {
            subscription = await notificationService.subscribeToPush();
            if (subscription) {
              break;
            }
          } catch (error) {
            console.warn(`Push subscription attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount < maxRetries) {
              setLoadingMessage(`Retrying... (${retryCount + 1}/${maxRetries})`);
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        setIsSubscribed(subscription !== null);

        if (subscription) {
          console.log('Push subscription successful');
          setLoadingMessage('Sending test notification...');

          // Show test notification
          try {
            await notificationService.sendTestNotification();
          } catch (error) {
            console.warn('Failed to send test notification:', error);
          }
        } else {
          console.error('Failed to subscribe to push notifications after all retries');
          alert('Failed to enable push notifications. Please try again or check your browser settings.');
        }
      } else {
        console.log('Notification permission not granted:', newPermission);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Failed to enable notifications. Please check your browser settings and try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const success = await notificationService.unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    await notificationService.sendTestNotification();
  };

  if (!isSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-yellow-800">Notifications Not Supported</p>
            <p className="text-sm text-yellow-700">Your browser doesn't support push notifications</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Emergency Notifications</h3>
          <p className="text-sm text-gray-600">Get real-time updates about your emergency requests</p>
        </div>
        {variant === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close notification settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-gray-900">Notification Status</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            permission === 'granted' && isSubscribed
              ? 'bg-green-100 text-green-800'
              : permission === 'denied'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {permission === 'granted' && isSubscribed ? 'Enabled' : 
             permission === 'denied' ? 'Blocked' : 'Disabled'}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              permission === 'granted' ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>Browser Permission: {permission}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isSubscribed ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>Push Subscription: {isSubscribed ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📱 Notification Benefits</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Real-time ambulance dispatch confirmations</li>
          <li>• Live updates on ambulance arrival times</li>
          <li>• Emergency status changes and updates</li>
          <li>• Critical system alerts and announcements</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {permission !== 'granted' || !isSubscribed ? (
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={isLoading || permission === 'denied'}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{loadingMessage || 'Enabling...'}</span>
              </div>
            ) : (
              '🔔 Enable Emergency Notifications'
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
            >
              🧪 Send Test Notification
            </button>
            <button
              type="button"
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Disabling...' : '🔕 Disable Notifications'}
            </button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Notifications Blocked:</strong> Please enable notifications in your browser settings to receive emergency updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full p-6 ${className}`}>
          {renderContent()}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={className}>
        {renderContent()}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {renderContent()}
    </div>
  );
}
