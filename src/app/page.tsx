"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import NotificationSettings from "@/components/NotificationSettings";
import OfflineIndicator, { PWAInstallPrompt } from "@/components/OfflineIndicator";
import DebugPanel from "@/components/DebugPanel";
import AmbulanceTracking from "@/components/AmbulanceTracking";
import { sendAmbulanceDispatchedNotification } from "@/lib/notifications";
import { offlineStorage } from "@/lib/offline-storage";

export default function Home() {
  const t = useTranslation();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyType, setEmergencyType] = useState("");
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useEffect(() => {
    // Automatically request location on page load for faster emergency response
    if (navigator.geolocation) {
      setIsRequestingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsRequestingLocation(false);
        },
        (error) => {
          console.log("Location access denied or unavailable");
          setIsRequestingLocation(false);
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
      {/* Emergency Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t.appName}</h1>
                <p className="text-sm text-gray-600">{t.availability}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowNotificationSettings(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-150"
                aria-label="Notification settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2zM4 7h12V5H4v2z" />
                </svg>
              </button>
              <LanguageSelector variant="header" />
              <div className="text-right">
                <div className="text-sm text-gray-500">{t.emergencyHotline}</div>
                <div className="text-lg font-bold text-red-600">193</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Emergency Request Section */}
      <div className="container mx-auto px-4 py-8">
        {!showEmergencyForm ? (
          <div className="max-w-2xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.needHelp}</h2>
              <p className="text-xl text-gray-600 mb-8">
                {t.helpDescription}
              </p>
            </div>

            {/* Primary Emergency Button */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowEmergencyForm(true)}
                className="w-full max-w-md mx-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-2xl font-bold py-6 px-8 rounded-2xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
              >
                {t.requestAmbulance}
              </button>
              <p className="text-sm text-gray-500 mt-3">
                {t.clickForHelp}
              </p>
            </div>

            {/* Location Status */}
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-blue-800">{t.locationServices}</span>
              </div>
              {isRequestingLocation ? (
                <p className="text-sm text-blue-700">{t.gettingLocation}</p>
              ) : currentLocation ? (
                <p className="text-sm text-blue-700">{t.locationDetected}</p>
              ) : (
                <p className="text-sm text-blue-700">{t.locationHelp}</p>
              )}
            </div>

            {/* Quick Emergency Types */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.commonEmergencies}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: "❤️", label: t.heartAttack, type: "cardiac" },
                  { icon: "🫁", label: t.breathing, type: "respiratory" },
                  { icon: "🚗", label: t.accident, type: "trauma" },
                  { icon: "🤕", label: t.injury, type: "injury" }
                ].map((emergency) => (
                  <button
                    type="button"
                    key={emergency.type}
                    onClick={() => {
                      setEmergencyType(emergency.type);
                      setShowEmergencyForm(true);
                    }}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 text-center"
                  >
                    <div className="text-2xl mb-2">{emergency.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{emergency.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Help Information */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">{t.whatToExpect}</h3>
              <div className="text-sm text-green-700 space-y-2">
                <p>{t.expectStep1}</p>
                <p>{t.expectStep2}</p>
                <p>{t.expectStep3}</p>
                <p>{t.expectStep4}</p>
              </div>
            </div>
          </div>
        ) : (
          <EmergencyRequestForm
            emergencyType={emergencyType}
            currentLocation={currentLocation}
            onBack={() => setShowEmergencyForm(false)}
          />
        )}

      </div>

      {/* Footer with Staff Access */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                {t.copyright}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <LanguageSelector variant="footer" />
              <a href="/dispatcher" className="text-sm text-gray-500 hover:text-gray-700">{t.staffLogin}</a>
              <a href="/admin" className="text-sm text-gray-500 hover:text-gray-700">{t.adminPortal}</a>
              <a href="/analytics" className="text-sm text-gray-500 hover:text-gray-700">{t.analytics}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings
          variant="modal"
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
    </div>
  );
}

function EmergencyRequestForm({
  emergencyType,
  currentLocation,
  onBack
}: {
  emergencyType: string;
  currentLocation: { lat: number; lng: number } | null;
  onBack: () => void;
}) {
  const t = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    emergencyType: emergencyType,
    location: currentLocation,
    manualAddress: "",
    contactName: "",
    contactPhone: "",
    description: "",
    severity: 2 as 1 | 2 | 3 | 4
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Create emergency call
    const callData = {
      location: formData.location || { lat: 5.6037, lng: -0.1870 }, // Default to Accra
      severityLevel: formData.severity,
      address: formData.manualAddress || "Emergency location",
      callerPhone: formData.contactPhone,
      emergencyType: formData.emergencyType,
      contactName: formData.contactName,
      description: formData.description
    };

    try {
      // Check if online
      if (navigator.onLine) {
        // Try to submit online
        const response = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(callData)
        });

        if (response.ok) {
          setRequestSubmitted(true);

          // Send notification about ambulance dispatch
          const responseData = await response.json();
          if (responseData.ambulanceId) {
            // Simulate ambulance dispatch notification after a short delay
            setTimeout(() => {
              sendAmbulanceDispatchedNotification(responseData.vehicleId || `AMB-${responseData.ambulanceId}`);
            }, 2000);
          }
        } else {
          throw new Error("Server error");
        }
      } else {
        throw new Error("Offline");
      }
    } catch (error) {
      // If online submission fails or we're offline, save for later
      try {
        await offlineStorage.saveEmergencyRequest(callData);
        setRequestSubmitted(true);

        // Show offline notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Emergency Request Saved', {
            body: 'Your request has been saved and will be sent when you\'re back online.',
            icon: '/icon-192x192.png'
          });
        }
      } catch (offlineError) {
        console.error("Failed to save offline request:", offlineError);
        alert("Failed to submit emergency request. Please call 193 directly.");
      }
    }

    setIsSubmitting(false);
  };

  if (requestSubmitted) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">{t.requestSubmitted}</h2>
            <p className="text-green-700 text-sm">
              {navigator.onLine ? t.requestReceived : "Your emergency request has been saved offline and will be sent when you're back online."}
            </p>
          </div>
        </div>

        {/* Ambulance Tracking */}
        <AmbulanceTracking />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Go back to emergency request options"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">{t.emergencyRequest}</h2>
          <div className="text-sm text-gray-500">{t.step} {step}/3</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-500">{t.emergencyType}</span>
            <span className="text-xs text-gray-500">{t.location}</span>
            <span className="text-xs text-gray-500">{t.contactInfo}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-red-500 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
                }`}
            ></div>
          </div>
        </div>

        {/* Step 1: Emergency Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="emergencyType" className="block text-sm font-medium text-gray-700 mb-2">{t.emergencyType}</label>
              <select
                id="emergencyType"
                aria-label="Select emergency type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={formData.emergencyType}
                onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
              >
                <option value="">{t.selectEmergencyType}</option>
                <option value="cardiac">{t.cardiacEmergency}</option>
                <option value="respiratory">{t.breathingProblems}</option>
                <option value="trauma">{t.accidentTrauma}</option>
                <option value="injury">{t.injuryWound}</option>
                <option value="stroke">{t.stroke}</option>
                <option value="other">{t.otherEmergency}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.severityLevel}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { level: 1, label: t.critical, color: "bg-red-500" },
                  { level: 2, label: t.urgent, color: "bg-orange-500" },
                  { level: 3, label: t.standard, color: "bg-yellow-500" },
                  { level: 4, label: t.nonUrgent, color: "bg-green-500" }
                ].map((severity) => (
                  <button
                    key={severity.level}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: severity.level as 1 | 2 | 3 | 4 })}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${formData.severity === severity.level
                        ? `${severity.color} text-white border-transparent`
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <div className="font-medium">{severity.label}</div>
                    <div className="text-xs">{t.priority} {severity.level}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.emergencyType}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.continueToLocation}
            </button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.yourLocation}</label>
              {currentLocation ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{t.locationDetectedAuto}</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">{t.locationNotDetected}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.addressLandmark} {!currentLocation && <span className="text-red-500">{t.required}</span>}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder={t.enterAddress}
                value={formData.manualAddress}
                onChange={(e) => setFormData({ ...formData, manualAddress: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!currentLocation && !formData.manualAddress.trim()}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.continue}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.yourName}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={t.enterName}
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.phoneNumber} <span className="text-red-500">{t.required}</span></label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={t.enterPhone}
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.additionalInfo}</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder={t.describeEmergency}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!formData.contactPhone.trim() || isSubmitting}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t.requesting : t.requestAmbulance}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
