import { subscribeToLiveEvents } from "@/lib/live-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("event: ready\ndata: connected\n\n"));

      const unsubscribe = subscribeToLiveEvents((event) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: keep-alive\n\n"));
      }, 20000);

      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      return;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
