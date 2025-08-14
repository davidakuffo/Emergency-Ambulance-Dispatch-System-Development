import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Mock hospital data for Ghana
const hospitals = [
  {
    id: 1,
    name: "Korle Bu Teaching Hospital",
    location: { lat: 5.5447, lng: -0.2315 },
    capacity: 2000,
    currentOccupancy: 1650,
    emergencyBeds: 50,
    availableEmergencyBeds: 12,
    specialties: ["Cardiology", "Neurology", "Trauma", "ICU"],
    status: "operational",
    contactNumber: "+233-30-2665401"
  },
  {
    id: 2,
    name: "37 Military Hospital",
    location: { lat: 5.5731, lng: -0.1864 },
    capacity: 400,
    currentOccupancy: 320,
    emergencyBeds: 25,
    availableEmergencyBeds: 8,
    specialties: ["Emergency Medicine", "Surgery", "Orthopedics"],
    status: "operational",
    contactNumber: "+233-30-2776111"
  },
  {
    id: 3,
    name: "Ridge Hospital",
    location: { lat: 5.5731, lng: -0.1969 },
    capacity: 200,
    currentOccupancy: 180,
    emergencyBeds: 15,
    availableEmergencyBeds: 3,
    specialties: ["General Medicine", "Pediatrics", "Maternity"],
    status: "operational",
    contactNumber: "+233-30-2225441"
  },
  {
    id: 4,
    name: "Tema General Hospital",
    location: { lat: 5.6698, lng: -0.0166 },
    capacity: 300,
    currentOccupancy: 240,
    emergencyBeds: 20,
    availableEmergencyBeds: 7,
    specialties: ["Emergency Medicine", "Surgery", "Internal Medicine"],
    status: "operational",
    contactNumber: "+233-30-3202441"
  },
  {
    id: 5,
    name: "La General Hospital",
    location: { lat: 5.5731, lng: -0.1664 },
    capacity: 150,
    currentOccupancy: 135,
    emergencyBeds: 12,
    availableEmergencyBeds: 2,
    specialties: ["General Medicine", "Emergency Care"],
    status: "operational",
    contactNumber: "+233-30-2777441"
  }
];

export async function GET() {
  return Response.json(hospitals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { hospitalId, bedUpdate } = body;
  
  // Mock updating hospital bed availability
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (hospital && bedUpdate) {
    hospital.availableEmergencyBeds = Math.max(0, hospital.availableEmergencyBeds + bedUpdate);
  }
  
  return Response.json({ success: true, hospital });
}
