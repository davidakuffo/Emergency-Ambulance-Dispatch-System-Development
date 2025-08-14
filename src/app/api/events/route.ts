import { NextRequest } from "next/server";
import { subscribe } from "@/lib/events";
import { startSimulator } from "@/lib/sim";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  startSimulator();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let isClosed = false;

      const send = (data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          isClosed = true;
          console.log("SSE controller closed, stopping events");
        }
      };

      const unsub = subscribe((e) => send(e));

      // keep-alive
      const keepAlive = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch (error) {
          isClosed = true;
          clearInterval(keepAlive);
          unsub();
        }
      }, 15000);

      try {
        controller.enqueue(encoder.encode(`retry: 5000\n\n`));
      } catch (error) {
        isClosed = true;
      }

      return () => {
        isClosed = true;
        clearInterval(keepAlive);
        unsub();
      };
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

