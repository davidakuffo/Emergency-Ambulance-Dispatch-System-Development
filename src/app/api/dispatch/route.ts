
import { NextRequest } from "next/server";
import { db, seedIfEmpty, updateCall, createDispatch } from "@/lib/store";
import { publish } from "@/lib/events";
import { selectBestAmbulance } from "@/lib/dispatch";
import { DispatchRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  seedIfEmpty();
  const json = await req.json();
  const parsed = DispatchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid dispatch payload", issues: parsed.error.format() }, { status: 400 });
  }
  const call = db.calls.find(c => c.id === parsed.data.callId);
  if (!call) return Response.json({ error: "Call not found" }, { status: 404 });
  const amb = selectBestAmbulance(db.ambulances, call);
  if (!amb) return Response.json({ error: "No ambulance available" }, { status: 409 });
  updateCall(call.id, { status: "assigned", assignedAmbulanceId: amb.id });
  const dispatch = createDispatch({ callId: call.id, ambulanceId: amb.id });
  publish({ type: "call_updated", call: db.calls.find(c => c.id === call.id)! });
  publish({ type: "dispatch_created", dispatch });
  return Response.json({ dispatch, ambulance: amb });
}

export async function GET() {
  seedIfEmpty();
  return Response.json(db.dispatches);
}

