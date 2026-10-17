/**
 * Realtime Worker for CodeX: creates rooms, checks they exist, answers the
 * latency probe, routes room WebSockets to their Durable Object, and proxies
 * room members' calls to the Realtime SFU.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  MEDIA_TOKEN_HEADER,
  ROOM_ID_HEADER,
  SFU_PROXY_PATH,
} from "@codex/types/realtime";
import { getServerByName, routePartykitRequest } from "partyserver";
import { routePartyTracksRequest } from "partytracks/server";

import { corsHeaders, isAllowedOrigin } from "./cors";
import { generateRoomID } from "./utils/generate-room-id";
import { normalizeRoomId } from "./utils/normalize-room-id";

// biome-ignore lint/performance/noBarrelFile: Wrangler needs the Durable Object class exported from the entry module
export { Room } from "./room";

const ROOM_PATH = /^\/rooms\/([^/]+)$/;
const MAX_CREATE_ATTEMPTS = 5;
const TURN_CREDENTIAL_TTL_SECONDS = 86_400;

const json = (body: unknown, origin: string | null, status = 200) =>
  Response.json(body, { status, headers: corsHeaders(origin) });

const text = (body: string, origin: string | null, status: number) =>
  new Response(body, { status, headers: corsHeaders(origin) });

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

const isSfuProxyPath = (pathname: string) =>
  pathname === SFU_PROXY_PATH || pathname.startsWith(`${SFU_PROXY_PATH}/`);

// The token comes from the room's `media` message, so only someone currently
// connected to the room can use the SFU app
const isRoomMember = async (env: Env, request: Request) => {
  const roomId = normalizeRoomId(request.headers.get(ROOM_ID_HEADER) ?? "");
  const token = request.headers.get(MEDIA_TOKEN_HEADER);
  if (roomId === null || token === null) {
    return false;
  }
  return (await roomStub(env, roomId)).hasMediaToken(token);
};

const proxySfu = async (request: Request, env: Env, origin: string | null) => {
  if (!isAllowedOrigin(origin)) {
    return text("Forbidden", origin, 403);
  }
  if (!(await isRoomMember(env, request))) {
    return text("Unauthorized", origin, 401);
  }
  if (!(env.SFU_APP_ID && env.SFU_APP_TOKEN)) {
    return text("Video calls aren't set up on this server", origin, 503);
  }

  const headers = new Headers(request.headers);
  headers.delete(ROOM_ID_HEADER);
  headers.delete(MEDIA_TOKEN_HEADER);
  const response = await routePartyTracksRequest({
    appId: env.SFU_APP_ID,
    token: env.SFU_APP_TOKEN,
    prefix: SFU_PROXY_PATH,
    request: new Request(request, { headers }),
    // Its cookie lock can't work across origins, and room members can
    // already change everything in a room
    lockSessionToInitiator: false,
    turnServerAppId: env.TURN_KEY_ID || undefined,
    turnServerAppToken: env.TURN_KEY_API_TOKEN || undefined,
    turnServerCredentialTTL: TURN_CREDENTIAL_TTL_SECONDS,
  });

  const proxied = new Response(response.body, response);
  for (const [name, value] of new Headers(corsHeaders(origin))) {
    proxied.headers.set(name, value);
  }
  return proxied;
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

    if (isSfuProxyPath(url.pathname)) {
      return proxySfu(request, env, origin);
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
