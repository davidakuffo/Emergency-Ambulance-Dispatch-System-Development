import { NextRequest } from "next/server";
import { db, seedIfEmpty, upsertAmbulance } from "@/lib/store";
import { publish } from "@/lib/events";
import { AmbulanceUpsertSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  seedIfEmpty();
  return Response.json(db.ambulances);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = AmbulanceUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid ambulance payload", issues: parsed.error.issues }, { status: 400 });
  }
  const saved = upsertAmbulance(parsed.data);
  publish({ type: "ambulance_updated", ambulance: saved });
  return Response.json(saved);
}

