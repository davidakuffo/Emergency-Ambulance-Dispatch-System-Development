import { publish } from "./events";
import { db, seedIfEmpty, updateCall, upsertAmbulance, now, createCall } from "./store";
import { SeverityLevel } from "./types";

let started = false;

export function startSimulator() {
  if (started) return;
  started = true;
  seedIfEmpty();
  // emit initial state
  for (const a of db.ambulances) publish({ type: "ambulance_created", ambulance: a });
  // periodic ambulance jitter movement
  setInterval(() => {
    for (const a of db.ambulances) {
      const jitter = () => (Math.random() - 0.5) * 0.003;
      const moved = upsertAmbulance({ ...a, location: { lat: a.location.lat + jitter(), lng: a.location.lng + jitter() } });
      publish({ type: "ambulance_updated", ambulance: moved });
    }
    publish({ type: "tick", now: now() });
    // auto-progress any assigned calls into en_route then completed for demo
    for (const call of db.calls) {
      if (call.status === "assigned") {
        call.status = "en_route";
        publish({ type: "call_updated", call });
      } else if (call.status === "en_route") {
        call.status = "completed";
        publish({ type: "call_updated", call });
        const d = db.dispatches.find(x => x.callId === call.id);
        if (d && !d.completionTime) {
          d.arrivalTime = d.arrivalTime ?? now();
          d.completionTime = now();
          d.responseTimeSeconds = Math.round((d.arrivalTime - d.dispatchTime) / 1000);
          d.status = "completed";
          publish({ type: "dispatch_updated", dispatch: d });
        }
      }
    }
  }, 4000);

  // generate sample calls occasionally
  setInterval(() => {
    const loc = randomNearby(db.ambulances[0]?.location || { lat: 5.6037, lng: -0.1870 }, 5);
    const sev = (Math.floor(Math.random() * 4) + 1) as SeverityLevel;
    const addresses = [
      "Osu, Accra", "Tema Station", "Kaneshie Market", "Legon University",
      "Kotoka Airport", "Madina", "Dansoman", "East Legon", "Spintex Road"
    ];
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const call = createCall({ location: loc, severityLevel: sev, address });
    publish({ type: "call_created", call });
  }, 12000);
}

function randomNearby(center: { lat: number; lng: number }, kmRadius: number) {
  const r = kmRadius / 111; // ~deg per km
  return { lat: center.lat + (Math.random() - 0.5) * 2 * r, lng: center.lng + (Math.random() - 0.5) * 2 * r };
}

