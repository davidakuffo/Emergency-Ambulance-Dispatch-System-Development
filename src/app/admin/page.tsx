"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ambulance, DispatchRecord } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
  const colors = {
    available: "bg-gradient-to-r from-green-500 to-green-600",
    en_route: "bg-gradient-to-r from-blue-500 to-blue-600",
    at_scene: "bg-gradient-to-r from-yellow-500 to-yellow-600",
    transporting: "bg-gradient-to-r from-orange-500 to-orange-600",
    out_of_service: "bg-gradient-to-r from-red-500 to-red-600"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colors[status as keyof typeof colors] || "bg-gray-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      onLogin(token);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fleet Management Access</h1>
          <p className="text-gray-600">Enter admin credentials to access fleet management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Token</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter admin token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Access Fleet Management"}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Demo Token: <code className="bg-gray-100 px-2 py-1 rounded">GHANA_EMS_ADMIN_2024_SECURE</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [showAddFleet, setShowAddFleet] = useState(false);

  // Secret admin token (in production, this would be environment variable)
  const ADMIN_TOKEN = "GHANA_EMS_ADMIN_2024_SECURE";

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = () => {
      const savedAuth = localStorage.getItem("admin_authenticated");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Load data and set up real-time updates only when authenticated
    if (isAuthenticated === true) {
      loadData();

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
          } else if (msg.type === "dispatch_created" || msg.type === "dispatch_updated") {
            setDispatches(prev => {
              const idx = prev.findIndex(d => d.id === msg.dispatch.id);
              if (idx >= 0) { const copy = [...prev]; copy[idx] = msg.dispatch; return copy; }
              return [...prev, msg.dispatch];
            });
          }
        } catch {}
      };
      return () => es.close();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    fetch("/api/ambulances").then(r => r.json()).then(setAmbulances);
    fetch("/api/dispatch").then(r => r.json()).then(setDispatches);
  };

  const handleLogin = (token: string) => {
    if (token === ADMIN_TOKEN) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
    } else {
      alert("Invalid admin token. Access denied.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    router.push("/");
  };

  const stats = {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === "available").length,
    active: ambulances.filter(a => ["en_route", "at_scene", "transporting"].includes(a.status)).length,
    outOfService: ambulances.filter(a => a.status === "out_of_service").length
  };

  const recentDispatches = dispatches
    .sort((a, b) => b.dispatchTime - a.dispatchTime)
    .slice(0, 10);

  async function updateAmbulanceStatus(ambulanceId: number, newStatus: string) {
    const ambulance = ambulances.find(a => a.id === ambulanceId);
    if (!ambulance) return;

    const res = await fetch("/api/ambulances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ambulance, status: newStatus })
    });

    if (!res.ok) alert("Failed to update ambulance status");
  }

  async function addNewAmbulance(ambulanceData: any) {
    const res = await fetch("/api/ambulances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ambulanceData)
    });

    if (res.ok) {
      setShowAddFleet(false);
      loadData();
    } else {
      alert("Failed to add new ambulance");
    }
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Fleet Management
              </h1>
            </div>
            <p className="text-gray-600">Secure ambulance fleet administration and monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowAddFleet(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              + Add New Fleet
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Fleet Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fleet</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Service</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfService}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Overview</h2>
            <div className="space-y-3 max-h-96 overflow-auto">
              {ambulances.map(ambulance => (
                <div 
                  key={ambulance.id} 
                  className={`bg-gray-50 rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                    selectedAmbulance?.id === ambulance.id ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAmbulance(ambulance)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{ambulance.vehicleId}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={ambulance.status} />
                        <span className="text-xs text-gray-500">{ambulance.equipmentLevel} • Crew {ambulance.crewSize}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Last updated: {new Date(ambulance.lastUpdated).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Lat: {ambulance.location.lat.toFixed(4)}</div>
                      <div>Lng: {ambulance.location.lng.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedAmbulance ? `Manage ${selectedAmbulance.vehicleId}` : 'Select an Ambulance'}
            </h2>
            
            {selectedAmbulance ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Current Status</h3>
                  <StatusBadge status={selectedAmbulance.status} />
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["available", "en_route", "at_scene", "transporting", "out_of_service"].map(status => (
                      <button
                        key={status}
                        type="button"
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedAmbulance.status === status
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                        onClick={() => updateAmbulanceStatus(selectedAmbulance.id, status)}
                        disabled={selectedAmbulance.status === status}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Vehicle Details</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Equipment Level: {selectedAmbulance.equipmentLevel}</div>
                    <div>Crew Size: {selectedAmbulance.crewSize}</div>
                    <div>Location: {selectedAmbulance.location.lat.toFixed(5)}, {selectedAmbulance.location.lng.toFixed(5)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                </div>
                <p>Select an ambulance from the list to manage its status and view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Dispatches</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Dispatch ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Call ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Ambulance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Dispatch Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {recentDispatches.map(dispatch => {
                  const ambulance = ambulances.find(a => a.id === dispatch.ambulanceId);
                  return (
                    <tr key={dispatch.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">#{dispatch.id}</td>
                      <td className="py-3 px-4">#{dispatch.callId}</td>
                      <td className="py-3 px-4">{ambulance?.vehicleId || 'Unknown'}</td>
                      <td className="py-3 px-4">{new Date(dispatch.dispatchTime).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {typeof dispatch.responseTimeSeconds === 'number' 
                          ? `${(dispatch.responseTimeSeconds / 60).toFixed(1)}m`
                          : 'Pending'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Fleet Modal */}
      {showAddFleet && (
        <AddFleetModal
          onClose={() => setShowAddFleet(false)}
          onAdd={addNewAmbulance}
        />
      )}
    </div>
  );
}

function AddFleetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => void }) {
  const [formData, setFormData] = useState({
    vehicleId: "",
    equipmentLevel: "basic" as const,
    crewSize: 2,
    location: { lat: 5.6037, lng: -0.1870 }, // Default to Accra
    status: "available" as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId.trim()) {
      alert("Vehicle ID is required");
      return;
    }
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Ambulance</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., GH-AMB-106"
              value={formData.vehicleId}
              onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
            />
          </div>

          <div>
            <label htmlFor="equipmentLevel" className="block text-sm font-medium text-gray-700 mb-1">Equipment Level</label>
            <select
              id="equipmentLevel"
              aria-label="Equipment Level"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.equipmentLevel}
              onChange={(e) => setFormData({...formData, equipmentLevel: e.target.value as any})}
            >
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="crewSize" className="block text-sm font-medium text-gray-700 mb-1">Crew Size</label>
            <input
              id="crewSize"
              type="number"
              min="1"
              max="6"
              aria-label="Crew Size"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.crewSize}
              onChange={(e) => setFormData({...formData, crewSize: parseInt(e.target.value)})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                id="latitude"
                type="number"
                step="0.00001"
                aria-label="Latitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.location.lat}
                onChange={(e) => setFormData({...formData, location: {...formData.location, lat: parseFloat(e.target.value)}})}
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                id="longitude"
                type="number"
                step="0.00001"
                aria-label="Longitude"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.location.lng}
                onChange={(e) => setFormData({...formData, location: {...formData.location, lng: parseFloat(e.target.value)}})}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700"
            >
              Add Ambulance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
