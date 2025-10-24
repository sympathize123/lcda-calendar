import type { NextRequest } from "next/server";
import { eventBus } from "@/server/events/event-bus";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      const listener = (payload: unknown) => {
        send(payload);
      };

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 20_000);

      eventBus.on("events:changed", listener);

      cleanup = () => {
        clearInterval(keepAlive);
        eventBus.off("events:changed", listener);
      };

      request.signal.addEventListener("abort", () => {
        cleanup?.();
        controller.close();
      });

      controller.enqueue(
        encoder.encode(
          `event: ready\ndata: ${JSON.stringify({ type: "ready" })}\n\n`,
        ),
      );
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  });
}
