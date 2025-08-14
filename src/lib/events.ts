import { EventType } from "./types";

// Simple in-process pub-sub for SSE
const listeners = new Set<(e: EventType) => void>();

export function subscribe(cb: (e: EventType) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function publish(e: EventType) {
  for (const cb of listeners) cb(e);
}

