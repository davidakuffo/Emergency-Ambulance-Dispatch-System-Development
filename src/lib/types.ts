export type Coordinate = {
  lat: number;
  lng: number;
};

export type AmbulanceStatus =
  | "available"
  | "en_route"
  | "at_scene"
  | "transporting"
  | "out_of_service";

export type EquipmentLevel = "basic" | "advanced" | "critical";

export interface Ambulance {
  id: number;
  vehicleId: string;
  status: AmbulanceStatus;
  location: Coordinate;
  equipmentLevel: EquipmentLevel;
  crewSize: number;
  lastUpdated: number; // epoch ms
}

export type CallStatus = "pending" | "assigned" | "en_route" | "completed" | "cancelled";

export type SeverityLevel = 1 | 2 | 3 | 4; // 1 = highest

export interface EmergencyCall {
  id: number;
  callerPhone?: string;
  location: Coordinate;
  address?: string;
  severityLevel: SeverityLevel;
  callTime: number; // epoch ms
  status: CallStatus;
  assignedAmbulanceId?: number;
}

export type DispatchStatus = "dispatched" | "arrived" | "completed";

export interface DispatchRecord {
  id: number;
  callId: number;
  ambulanceId: number;
  dispatchTime: number;
  arrivalTime?: number;
  completionTime?: number;
  distanceTraveledKm?: number;
  responseTimeSeconds?: number;
  status?: DispatchStatus;
}

export type EventType =
  | { type: "ambulance_updated"; ambulance: Ambulance }
  | { type: "ambulance_created"; ambulance: Ambulance }
  | { type: "call_created"; call: EmergencyCall }
  | { type: "call_updated"; call: EmergencyCall }
  | { type: "dispatch_created"; dispatch: DispatchRecord }
  | { type: "dispatch_updated"; dispatch: DispatchRecord }
  | { type: "tick"; now: number };

