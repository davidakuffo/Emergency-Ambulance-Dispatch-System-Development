"use client";
import { useEffect, useMemo, useState } from "react";
import MapView from "@/components/MapView";
import { Ambulance, DispatchRecord, EmergencyCall } from "@/lib/types";

function CreateCallCard({ draftLoc, onMapClick, onCreated }: { draftLoc?: {lat:number; lng:number} | null; onMapClick: (loc: {lat:number;lng:number})=>void; onCreated: (c: EmergencyCall)=>void }) {
  const [sev, setSev] = useState<number>(2);
  const [addr, setAddr] = useState<string>("");

  async function submit() {
    if (!draftLoc) return alert("Select a location on the map");
    const res = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: draftLoc, severityLevel: sev, address: addr }) });
    if (!res.ok) return alert("Failed to create call");
    const c = await res.json();
    onCreated(c);
  }

  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-2">Create Call</h2>
      <div className="text-xs text-gray-500 mb-2">Click on the map to pick a location</div>
      <div className="flex items-end gap-4">
        <div>
          <label className="text-xs text-gray-600" htmlFor="severity">Severity</label>
          <select id="severity" aria-label="Call Severity" className="block border rounded px-2 py-1 text-sm" value={sev} onChange={(e)=> setSev(parseInt(e.target.value))}>
            <option value={1}>Priority 1</option>
            <option value={2}>Priority 2</option>
            <option value={3}>Priority 3</option>
            <option value={4}>Priority 4</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-600">Address (optional)</label>
          <input className="block w-full border rounded px-2 py-1 text-sm" value={addr} onChange={(e)=> setAddr(e.target.value)} placeholder="Description" />
        </div>
        <div>
          <button type="button" className="px-3 py-1.5 text-sm bg-green-600 text-white rounded" onClick={submit}>Create</button>
        </div>
      </div>
      {draftLoc && (
        <div className="text-xs text-gray-600 mt-2">Selected: {draftLoc.lat.toFixed(5)}, {draftLoc.lng.toFixed(5)}</div>
      )}
    </div>
  );
}

function SeverityBadge({ level }: { level: number }) {
  const color = level === 1 ? "bg-red-600" : level === 2 ? "bg-orange-500" : level === 3 ? "bg-yellow-500" : "bg-green-600";
  return <span className={`inline-block text-white text-[10px] px-2 py-0.5 rounded ${color}`}>P{level}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "pending" ? "bg-gray-500" : status === "assigned" ? "bg-blue-600" : status === "en_route" ? "bg-indigo-600" : status === "completed" ? "bg-green-600" : "bg-gray-700";
  return <span className={`inline-block text-white text-[10px] px-2 py-0.5 rounded ${color}`}>{status.replace("_", " ")}</span>;
}

export default function Dashboard() {
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">AADS Dispatcher Dashboard</h1>

      {delayedP1.length > 0 && (
        <div className="border border-red-300 bg-red-50 text-red-800 rounded p-3">
          <div className="font-medium">Alert: Delayed Priority-1 Responses</div>
          <div className="text-sm">{delayedP1.length} call(s) exceed 8-minute target.</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Fleet Available</div>
          <div className="text-2xl font-semibold">{available}/{totalAmb}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Active Calls</div>
          <div className="text-2xl font-semibold">{activeCalls}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Avg Response</div>
          <div className="text-2xl font-semibold">{avgResponse ? `${(avgResponse/60).toFixed(1)}m` : "--"}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-xs text-gray-500">Dispatch Accuracy</div>
          <div className="text-2xl font-semibold">--</div>
        </div>
      </div>

      <CreateCallCard draftLoc={draftLoc} onMapClick={(loc) => setDraftLoc(loc)} onCreated={(call) => { setCalls(prev => [...prev, call]); setDraftLoc(null); }} />

      <MapView ambulances={ambulances} calls={calls} draftLocation={draftLoc || undefined} onMapClick={(loc)=> setDraftLoc(loc)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">Active Calls</h2>
          <ul className="space-y-2 max-h-64 overflow-auto">
            {calls.map((c) => {
              const d = dispatches.find(x => x.callId === c.id);
              return (
                <li key={c.id} className="flex items-center justify-between text-sm border rounded p-2">
                  <div>
                    <div className="font-medium flex items-center gap-2">Call #{c.id} <SeverityBadge level={c.severityLevel} /></div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">Status: <StatusBadge status={c.status} /></div>
                    {d && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        <span>Dispatched: {new Date(d.dispatchTime).toLocaleTimeString()}</span>
                        {d.arrivalTime && <span> • Arrived: {new Date(d.arrivalTime).toLocaleTimeString()}</span>}
                        {d.completionTime && <span> • Completed: {new Date(d.completionTime).toLocaleTimeString()}</span>}
                        {typeof d.responseTimeSeconds === "number" && <span> • Resp: {(d.responseTimeSeconds/60).toFixed(1)}m</span>}
                      </div>
                    )}
                  </div>
                  {c.status === "pending" && (
                    <button type="button" className="px-2 py-1 text-xs bg-blue-600 text-white rounded" onClick={() => quickDispatch(c.id)}>Dispatch</button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">Fleet Status</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ambulances.map(a => (
              <div key={a.id} className="border rounded p-2">
                <div className="font-medium">{a.vehicleId}</div>
                <div className="text-xs">{a.status}</div>
                <div className="text-xs">{a.equipmentLevel} • Crew {a.crewSize}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

