/**
 * Realtime Worker for CodeX: creates rooms, checks they exist, answers the
 * latency probe, and routes room WebSockets to their Durable Object.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { getServerByName, routePartykitRequest } from "partyserver";

import { corsHeaders, isAllowedOrigin } from "./cors";
import { generateRoomID } from "./utils/generate-room-id";
import { normalizeRoomId } from "./utils/normalize-room-id";

// biome-ignore lint/performance/noBarrelFile: Wrangler needs the Durable Object class exported from the entry module
export { Room } from "./room";

const ROOM_PATH = /^\/rooms\/([^/]+)$/;
const MAX_CREATE_ATTEMPTS = 5;

const json = (body: unknown, origin: string | null, status = 200) =>
  Response.json(body, { status, headers: corsHeaders(origin) });

const roomStub = (env: Env, roomId: string) =>
  getServerByName(env.Room, roomId);

const createRoom = async (env: Env, origin: string | null) => {
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
    const roomId = generateRoomID();
    const room = await roomStub(env, roomId);
    if (await room.create()) {
      return json({ roomId }, origin, 201);
    }
  }
  return json({ error: "Couldn't create a room. Try again." }, origin, 503);
};

const checkRoom = async (env: Env, rawId: string, origin: string | null) => {
  const roomId = normalizeRoomId(decodeURIComponent(rawId));
  const exists =
    roomId !== null && (await (await roomStub(env, roomId)).exists());
  return exists
    ? json({ roomId }, origin)
    : json({ error: "Room not found" }, origin, 404);
};

// Measures the client's round trip to Cloudflare for the latency page
const echoSocket = () => {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();
  server.addEventListener("message", (event) => server.send(event.data));
  return new Response(null, { status: 101, webSocket: client });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Readiness checks such as start-server-and-test probe with HEAD
    if (
      url.pathname === "/" &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      return new Response(
        "Hello from codex-server! Go to https://codex.dulapahv.dev/ to start coding.",
        { headers: { ...corsHeaders(origin), "Content-Type": "text/plain" } }
      );
    }

    if (url.pathname === "/rooms" && request.method === "POST") {
      return createRoom(env, origin);
    }

    const roomPath = ROOM_PATH.exec(url.pathname);
    if (roomPath && request.method === "GET") {
      return checkRoom(env, roomPath[1], origin);
    }

    if (url.pathname === "/ping") {
      return isAllowedOrigin(origin)
        ? echoSocket()
        : new Response("Forbidden", { status: 403 });
    }

    const response = await routePartykitRequest(request, env, {
      // Rooms are only reachable over WebSocket
      onBeforeRequest: () => new Response("Not found", { status: 404 }),
      onBeforeConnect: (_request, lobby) => {
        const isRoom =
          lobby.className === "Room" &&
          normalizeRoomId(lobby.name) === lobby.name;
        if (!isAllowedOrigin(origin)) {
          return new Response("Forbidden", { status: 403 });
        }
        if (!isRoom) {
          return new Response("Not found", { status: 404 });
        }
      },
    });
    return response ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
