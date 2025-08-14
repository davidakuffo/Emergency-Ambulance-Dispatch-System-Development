"use client";
import { useEffect, useState } from "react";
import { Ambulance, EmergencyCall } from "@/lib/types";

export default function MobileInterface() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    fetch("/api/ambulances").then(r => r.json()).then(setAmbulances);
    fetch("/api/calls").then(r => r.json()).then(setCalls);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      );
    }

    const es = new EventSource("/api/events");
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "ambulance_updated" || msg.type === "ambulance_created") {
          setAmbulances(prev => {
            const idx = prev.findIndex(a => a.id === msg.ambulance.id);
            if (idx >= 0) { const copy = [...prev]; copy[idx] = msg.ambulance; return copy; }
            return [...prev, msg.ambulance];
          });
        } else if (msg.type === "call_created" || msg.type === "call_updated") {
          setCalls(prev => {
            const idx = prev.findIndex(c => c.id === msg.call.id);
            if (idx >= 0) { const copy = [...prev]; copy[idx] = msg.call; return copy; }
            return [...prev, msg.call];
          });
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  async function updateStatus(ambulanceId: number, newStatus: string) {
    const ambulance = ambulances.find(a => a.id === ambulanceId);
    if (!ambulance) return;
    
    const res = await fetch("/api/ambulances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ambulance, status: newStatus })
    });
    
    if (!res.ok) alert("Failed to update status");
  }

  const myAmbulance = ambulances.find(a => a.vehicleId === "GH-AMB-101"); // Demo: assume user is crew of AMB-101
  const assignedCalls = calls.filter(c => c.assignedAmbulanceId === myAmbulance?.id);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Ambulance Crew App</h1>
            <p className="text-blue-100 text-sm">
              {myAmbulance ? myAmbulance.vehicleId : "Not Assigned"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Status</div>
            <div className="font-semibold">
              {myAmbulance ? myAmbulance.status.replace("_", " ").toUpperCase() : "OFFLINE"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Status Update</h2>
          <div className="grid grid-cols-2 gap-2">
            {["available", "en_route", "at_scene", "transporting"].map(status => (
              <button
                key={status}
                type="button"
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  myAmbulance?.status === status
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => myAmbulance && updateStatus(myAmbulance.id, status)}
                disabled={!myAmbulance}
              >
                {status.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned Calls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Assigned Calls ({assignedCalls.length})</h2>
          {assignedCalls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
              <p>No assigned calls</p>
              <p className="text-sm">Waiting for dispatch...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedCalls.map(call => (
                <div key={call.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">Call #{call.id}</div>
                      <div className="text-sm text-gray-600">{call.address}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      call.severityLevel === 1 ? 'bg-red-100 text-red-700' :
                      call.severityLevel === 2 ? 'bg-orange-100 text-orange-700' :
                      call.severityLevel === 3 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Priority {call.severityLevel}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Called: {new Date(call.callTime).toLocaleString()}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium">
                      Navigate
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium">
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Emergency Actions</h2>
          <div className="space-y-2">
            <button className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium">
              🚨 Emergency Backup Request
            </button>
            <button className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium">
              🏥 Hospital Notification
            </button>
            <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium">
              📞 Dispatch Center
            </button>
          </div>
        </div>

        {/* Location Info */}
        {currentLocation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Current Location</h2>
            <div className="text-sm text-gray-600">
              <div>Lat: {currentLocation.lat.toFixed(5)}</div>
              <div>Lng: {currentLocation.lng.toFixed(5)}</div>
              <div className="mt-2 text-xs text-green-600">📍 GPS Active</div>
            </div>
          </div>
        )}

        {/* Fleet Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Fleet Status</h2>
          <div className="space-y-2">
            {ambulances.slice(0, 5).map(ambulance => (
              <div key={ambulance.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{ambulance.vehicleId}</div>
                  <div className="text-xs text-gray-500">{ambulance.equipmentLevel}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  ambulance.status === 'available' ? 'bg-green-100 text-green-700' :
                  ambulance.status === 'en_route' ? 'bg-blue-100 text-blue-700' :
                  ambulance.status === 'at_scene' ? 'bg-yellow-100 text-yellow-700' :
                  ambulance.status === 'transporting' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {ambulance.status.replace("_", " ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-4">
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-blue-500 rounded mb-1"></div>
            <span className="text-xs text-gray-600">Home</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-300 rounded mb-1"></div>
            <span className="text-xs text-gray-600">Calls</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-300 rounded mb-1"></div>
            <span className="text-xs text-gray-600">Map</span>
          </button>
          <button className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-300 rounded mb-1"></div>
            <span className="text-xs text-gray-600">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
