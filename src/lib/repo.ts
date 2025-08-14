import { query, isDbEnabled } from "./db";
import { Ambulance, EmergencyCall, DispatchRecord } from "./types";

export const repo = {
  // Ambulances
  async listAmbulances(): Promise<Ambulance[]> {
    if (!isDbEnabled) throw new Error("DB disabled");
    const { rows } = await query<any>(
      "SELECT id, vehicle_id as \"vehicleId\", status, equipment_level as \"equipmentLevel\", crew_size as \"crewSize\", EXTRACT(EPOCH FROM last_updated)*1000 as \"lastUpdated\", ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM ambulances"
    );
    return rows.map((r) => ({ id: r.id, vehicleId: r.vehicleId, status: r.status, location: { lat: r.lat, lng: r.lng }, equipmentLevel: r.equipmentLevel, crewSize: r.crewSize, lastUpdated: r.lastUpdated }));
  },
  // Emergency Calls
  async listCalls(): Promise<EmergencyCall[]> {
    if (!isDbEnabled) throw new Error("DB disabled");
    const { rows } = await query<any>(
      "SELECT id, caller_phone as \"callerPhone\", address, severity_level as \"severityLevel\", EXTRACT(EPOCH FROM call_time)*1000 as \"callTime\", status, assigned_ambulance_id as \"assignedAmbulanceId\", ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng FROM emergency_calls"
    );
    return rows.map((r) => ({ id: r.id, callerPhone: r.callerPhone, address: r.address, severityLevel: r.severityLevel, callTime: r.callTime, status: r.status, assignedAmbulanceId: r.assignedAmbulanceId, location: { lat: r.lat, lng: r.lng } }));
  },
  // Dispatches
  async listDispatches(): Promise<DispatchRecord[]> {
    if (!isDbEnabled) throw new Error("DB disabled");
    const { rows } = await query<any>(
      "SELECT id, call_id as \"callId\", ambulance_id as \"ambulanceId\", EXTRACT(EPOCH FROM dispatch_time)*1000 as \"dispatchTime\", EXTRACT(EPOCH FROM arrival_time)*1000 as \"arrivalTime\", EXTRACT(EPOCH FROM completion_time)*1000 as \"completionTime\", distance_traveled as \"distanceTraveledKm\", response_time_seconds as \"responseTimeSeconds\" FROM dispatches"
    );
    return rows;
  },
};

