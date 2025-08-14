import { NextRequest } from "next/server";
import { db, seedIfEmpty, createCall } from "@/lib/store";
import { publish } from "@/lib/events";
import { EmergencyCallCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  seedIfEmpty();
  return Response.json(db.calls);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = EmergencyCallCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid call payload", issues: parsed.error.issues }, { status: 400 });
  }
  const call = createCall(parsed.data);
  publish({ type: "call_created", call });
  return Response.json(call);
}

