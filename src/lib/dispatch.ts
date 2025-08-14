import { Ambulance, EmergencyCall, SeverityLevel } from "./types";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceScore(km: number) {
  // 0-1, 1 is best (closest). 0 at 30km+ for MVP
  const capped = Math.min(30, Math.max(0, km));
  return 1 - capped / 30;
}

function mockTrafficMinutes(km: number) {
  // naive: base speed 40km/h with congestion factor 1.0-1.5
  const baseMinutes = (km / 40) * 60;
  const factor = 1.0 + Math.min(0.5, km / 60);
  return baseMinutes * factor;
}

function trafficScore(minutes: number) {
  // 1 is best, 0 at 45+ minutes
  const capped = Math.min(45, Math.max(0, minutes));
  return 1 - capped / 45;
}

function capabilityScore(amb: Ambulance, severity: SeverityLevel) {
  const levelWeight = { basic: 1, advanced: 2, critical: 3 } as const;
  const need = { 1: 3, 2: 2, 3: 1, 4: 1 } as const;
  const diff = levelWeight[amb.equipmentLevel] - need[severity];
  // scale 0..1; exact match or higher is 1, one level below is 0.5, worse is 0
  if (diff >= 0) return 1;
  if (diff === -1) return 0.5;
  return 0;
}

function availabilityScore(amb: Ambulance) {
  const s = amb.status;
  if (s === "available") return 1;
  if (s === "en_route" || s === "at_scene") return 0.3;
  if (s === "transporting") return 0.1;
  return 0; // out_of_service
}

export function calculateDispatchScore(amb: Ambulance, emergencyLocation: { lat: number; lng: number }, severity: SeverityLevel) {
  const km = haversineKm(amb.location, emergencyLocation);
  const distance = distanceScore(km);
  const tmin = mockTrafficMinutes(km);
  const traffic = trafficScore(tmin);
  const capability = capabilityScore(amb, severity);
  const availability = availabilityScore(amb);
  const total = distance * 0.4 + traffic * 0.25 + capability * 0.2 + availability * 0.15;
  return { total, km, tmin, distance, traffic, capability, availability };
}

export function selectBestAmbulance(ambulances: Ambulance[], call: EmergencyCall) {
  const candidates = ambulances.filter(a => a.status !== "out_of_service");
  let best: { amb: Ambulance; score: number } | undefined;
  for (const amb of candidates) {
    const s = calculateDispatchScore(amb, call.location, call.severityLevel);
    if (!best || s.total > best.score) best = { amb, score: s.total };
  }
  return best?.amb;
}

