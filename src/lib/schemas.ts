import { z } from "zod";

export const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const AmbulanceStatusSchema = z.enum([
  "available",
  "en_route",
  "at_scene",
  "transporting",
  "out_of_service",
]);

export const EquipmentLevelSchema = z.enum(["basic", "advanced", "critical"]);

export const AmbulanceUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  vehicleId: z.string().min(1),
  status: AmbulanceStatusSchema,
  location: CoordinateSchema,
  equipmentLevel: EquipmentLevelSchema,
  crewSize: z.number().int().min(1).max(6),
});

export const SeverityLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const EmergencyCallCreateSchema = z.object({
  callerPhone: z.string().min(3).max(20).optional(),
  location: CoordinateSchema,
  address: z.string().optional(),
  severityLevel: SeverityLevelSchema,
  status: z.enum(["pending", "assigned", "en_route", "completed", "cancelled"]).optional(),
  assignedAmbulanceId: z.number().int().positive().optional(),
});

export const DispatchRequestSchema = z.object({
  callId: z.number().int().positive(),
});

export type AmbulanceUpsert = z.infer<typeof AmbulanceUpsertSchema>;
export type EmergencyCallCreate = z.infer<typeof EmergencyCallCreateSchema>;
export type DispatchRequest = z.infer<typeof DispatchRequestSchema>;

