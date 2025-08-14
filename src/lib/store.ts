import { Ambulance, DispatchRecord, EmergencyCall } from "./types";

// Simple in-memory store for MVP
export const db = {
  ambulances: [] as Ambulance[],
  calls: [] as EmergencyCall[],
  dispatches: [] as DispatchRecord[],
  ids: { ambulance: 1, call: 1, dispatch: 1 },
};

export const now = () => Date.now();

export function seedIfEmpty() {
  if (db.ambulances.length > 0) return;
  const base = { lat: 5.6037, lng: -0.1870 }; // Accra, Ghana
  const mkAmb = (i: number, dx: number, dy: number, level: Ambulance["equipmentLevel"], status: Ambulance["status"]): Ambulance => ({
    id: db.ids.ambulance++,
    vehicleId: `GH-AMB-${100 + i}`,
    status,
    location: { lat: base.lat + dx, lng: base.lng + dy },
    equipmentLevel: level,
    crewSize: 2 + (i % 2),
    lastUpdated: now(),
  });
  db.ambulances.push(
    mkAmb(1, 0.01, 0.01, "advanced", "available"),
    mkAmb(2, -0.015, 0.005, "basic", "available"),
    mkAmb(3, 0.02, -0.005, "critical", "transporting"),
    mkAmb(4, 0.005, -0.01, "advanced", "available"),
    mkAmb(5, -0.01, -0.005, "basic", "en_route")
  );
}

export function upsertAmbulance(a: Omit<Ambulance, "id" | "lastUpdated"> & Partial<Pick<Ambulance, "id">>): Ambulance {
  const idx = a.id ? db.ambulances.findIndex(x => x.id === a.id) : -1;
  const record: Ambulance = idx >= 0
    ? { ...db.ambulances[idx], ...a, lastUpdated: now() }
    : { id: db.ids.ambulance++, lastUpdated: now(), ...a } as Ambulance;
  if (idx >= 0) db.ambulances[idx] = record; else db.ambulances.push(record);
  return record;
}

export function createCall(c: Omit<EmergencyCall, "id" | "callTime" | "status"> & Partial<Pick<EmergencyCall, "status">>): EmergencyCall {
  const record: EmergencyCall = {
    id: db.ids.call++,
    callTime: now(),
    status: c.status ?? "pending",
    ...c,
  } as EmergencyCall;
  db.calls.push(record);
  return record;
}

export function updateCall(id: number, patch: Partial<EmergencyCall>): EmergencyCall | undefined {
  const idx = db.calls.findIndex(x => x.id === id);
  if (idx === -1) return undefined;
  db.calls[idx] = { ...db.calls[idx], ...patch };
  return db.calls[idx];
}

export function createDispatch(d: Omit<DispatchRecord, "id" | "dispatchTime">): DispatchRecord {
  const record: DispatchRecord = { id: db.ids.dispatch++, dispatchTime: now(), ...d };
  db.dispatches.push(record);
  return record;
}

