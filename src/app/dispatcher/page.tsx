"use client";
import { useEffect, useMemo, useState } from "react";
import MapView from "@/components/MapView";
import { Ambulance, DispatchRecord, EmergencyCall } from "@/lib/types";

function SeverityBadge({ level }: { level: number }) {
  const colors = {
    1: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    2: "bg-gradient-to-r from-orange-500 to-orange-600 text-white", 
    3: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    4: "bg-gradient-to-r from-green-500 to-green-600 text-white"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level as keyof typeof colors]}`}>
      P{level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: "bg-gradient-to-r from-gray-500 to-gray-600",
    assigned: "bg-gradient-to-r from-blue-500 to-blue-600", 
    en_route: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    completed: "bg-gradient-to-r from-green-500 to-green-600",
    cancelled: "bg-gradient-to-r from-red-500 to-red-600"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colors[status as keyof typeof colors] || "bg-gray-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function DispatcherDashboard() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [calls, setCalls] = useState<EmergencyCall[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [draftLoc, setDraftLoc] = useState<{lat:number; lng:number} | null>(null);

  useEffect(() => {
    fetch("/api/ambulances").then(r => r.json()).then(setAmbulances);
    fetch("/api/calls").then(r => r.json()).then(setCalls);
    fetch("/api/dispatch").then(r => r.json()).then(setDispatches);
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
        } else if (msg.type === "dispatch_created" || msg.type === "dispatch_updated") {
          setDispatches(prev => {
            const idx = prev.findIndex(d => d.id === msg.dispatch.id);
            if (idx >= 0) { const copy = [...prev]; copy[idx] = msg.dispatch; return copy; }
            return [...prev, msg.dispatch];
          });
        } else if (msg.type === "tick") {
          setNowMs(msg.now);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  async function quickDispatch(callId: number) {
    const res = await fetch("/api/dispatch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callId }) });
    if (!res.ok) alert("Dispatch failed");
  }

  // KPIs
  const totalAmb = ambulances.length;
  const available = ambulances.filter(a => a.status === "available").length;
  const activeCalls = calls.filter(c => ["pending","assigned","en_route"].includes(c.status)).length;
  const completedWithRt = dispatches.filter(d => typeof d.responseTimeSeconds === "number");
  const avgResponse = completedWithRt.length
    ? (completedWithRt.reduce((s,d) => s + (d.responseTimeSeconds || 0), 0) / completedWithRt.length)
    : undefined;

  // Alerts: delayed priority-1 responses (dispatched but not arrived for >8 min)
  const delayedP1 = calls.filter(c => c.severityLevel === 1 && (c.status === "assigned" || c.status === "en_route")).filter(c => {
    const d = dispatches.find(x => x.callId === c.id);
    if (!d) return false;
    const elapsedMs = nowMs - d.dispatchTime;
    return elapsedMs > 8 * 60 * 1000 && !d.arrivalTime;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Emergency Dispatch Center
            </h1>
            <p className="text-gray-600 mt-1">Real-time ambulance coordination for Ghana</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>

        {/* Alerts */}
        {delayedP1.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <div className="font-semibold text-red-800">Critical Alert: Delayed Priority-1 Responses</div>
                <div className="text-sm text-red-700">{delayedP1.length} call(s) exceed 8-minute target response time.</div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Available</p>
                <p className="text-2xl font-bold text-gray-900">{available}/{totalAmb}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Calls</p>
                <p className="text-2xl font-bold text-gray-900">{activeCalls}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{avgResponse ? `${(avgResponse/60).toFixed(1)}m` : "--"}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Call Card */}
        <CreateCallCard draftLoc={draftLoc} onMapClick={(loc) => setDraftLoc(loc)} onCreated={(call) => { setCalls(prev => [...prev, call]); setDraftLoc(null); }} />

        {/* Map */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Map View</h2>
          <MapView ambulances={ambulances} calls={calls} draftLocation={draftLoc || undefined} onMapClick={(loc)=> setDraftLoc(loc)} />
        </div>

        {/* Data Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Emergency Calls</h2>
            <div className="space-y-3 max-h-96 overflow-auto">
              {calls.map((c) => {
                const d = dispatches.find(x => x.callId === c.id);
                return (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">Call #{c.id}</span>
                          <SeverityBadge level={c.severityLevel} />
                          <StatusBadge status={c.status} />
                        </div>
                        {c.address && <p className="text-sm text-gray-600 mb-2">{c.address}</p>}
                        {d && (
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Dispatched: {new Date(d.dispatchTime).toLocaleTimeString()}</div>
                            {d.arrivalTime && <div>Arrived: {new Date(d.arrivalTime).toLocaleTimeString()}</div>}
                            {d.completionTime && <div>Completed: {new Date(d.completionTime).toLocaleTimeString()}</div>}
                            {typeof d.responseTimeSeconds === "number" && <div>Response: {(d.responseTimeSeconds/60).toFixed(1)}m</div>}
                          </div>
                        )}
                      </div>
                      {c.status === "pending" && (
                        <button 
                          type="button" 
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                          onClick={() => quickDispatch(c.id)}
                        >
                          Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status</h2>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-auto">
              {ambulances.map(a => (
                <div key={a.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{a.vehicleId}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-gray-500">{a.equipmentLevel} • Crew {a.crewSize}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(a.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateCallCard({ draftLoc, onMapClick, onCreated }: { draftLoc?: {lat:number; lng:number} | null; onMapClick: (loc: {lat:number;lng:number})=>void; onCreated: (c: EmergencyCall)=>void }) {
  const [sev, setSev] = useState<number>(2);
  const [addr, setAddr] = useState<string>("");

  async function submit() {
    if (!draftLoc) return alert("Select a location on the map");
    const res = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: draftLoc, severityLevel: sev, address: addr }) });
    if (!res.ok) return alert("Failed to create call");
    const c = await res.json();
    onCreated(c);
    setAddr("");
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Emergency Call</h2>
      <p className="text-sm text-gray-600 mb-4">Click on the map to select the emergency location</p>
      <div className="flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="severity">Priority Level</label>
          <select id="severity" aria-label="Call Severity" className="block border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={sev} onChange={(e)=> setSev(parseInt(e.target.value))}>
            <option value={1}>Priority 1 - Critical</option>
            <option value={2}>Priority 2 - Urgent</option>
            <option value={3}>Priority 3 - Standard</option>
            <option value={4}>Priority 4 - Non-urgent</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Description</label>
          <input 
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={addr} 
            onChange={(e)=> setAddr(e.target.value)} 
            placeholder="e.g., Osu, Accra" 
          />
        </div>
        <div>
          <button 
            type="button" 
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm disabled:opacity-50"
            onClick={submit}
            disabled={!draftLoc}
          >
            Create Call
          </button>
        </div>
      </div>
      {draftLoc && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>Selected Location:</strong> {draftLoc.lat.toFixed(5)}, {draftLoc.lng.toFixed(5)}
          </div>
        </div>
      )}
    </div>
  );
}
