/**
 * What this browser keeps to get back into its rooms.
 * - Each tab's seat in a room, which keeps the tab's role through reloads
 *   and lets it back into a locked room. Another tab is someone new.
 * - The host's key for each room this browser created, which makes a tab
 *   the host again once no other tab is.
 * - A random ID for the browser, so a host can keep someone removed out.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  BROWSER_ID_PARAM,
  HOST_KEY_PARAM,
  ROOM_TOKEN_PARAM,
} from "@codex/types/realtime";

const SEATS_KEY = "codex-room-seats";
const HOST_KEYS_KEY = "codex-room-host-keys";
const BROWSER_ID_KEY = "codex-browser-id";
// Rooms are short-lived, so only the latest few are worth keeping
const MAX_ROOMS = 20;

type Tokens = Record<string, string>;

// Storage can be full or blocked, and then the tokens last this visit
const readTokens = (storage: Storage, key: string): Tokens => {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "");
    return typeof value === "object" && value !== null ? (value as Tokens) : {};
  } catch {
    return {};
  }
};

const writeTokens = (storage: Storage, key: string, tokens: Tokens) => {
  try {
    storage.setItem(key, JSON.stringify(tokens));
  } catch {
    // Kept for this visit only
  }
};

const tokenStore = (getStorage: () => Storage, key: string) => {
  const others = (roomId: string) =>
    Object.entries(readTokens(getStorage(), key)).filter(
      ([id]) => id !== roomId
    );
  return {
    forget: (roomId: string) =>
      writeTokens(getStorage(), key, Object.fromEntries(others(roomId))),
    get: (roomId: string): string | undefined =>
      readTokens(getStorage(), key)[roomId],
    save: (roomId: string, token: string) => {
      const kept = others(roomId).slice(-(MAX_ROOMS - 1));
      writeTokens(
        getStorage(),
        key,
        Object.fromEntries([...kept, [roomId, token]])
      );
    },
  };
};

export const seats = tokenStore(() => sessionStorage, SEATS_KEY);
export const hostKeys = tokenStore(() => localStorage, HOST_KEYS_KEY);

let fallbackBrowserId: string | undefined;

const getBrowserId = () => {
  try {
    const saved = localStorage.getItem(BROWSER_ID_KEY);
    if (saved) {
      return saved;
    }
    const created = crypto.randomUUID();
    localStorage.setItem(BROWSER_ID_KEY, created);
    return created;
  } catch {
    fallbackBrowserId ??= crypto.randomUUID();
    return fallbackBrowserId;
  }
};

// What this tab sends to join a room
export const getSeatClaim = (roomId: string) => ({
  [BROWSER_ID_PARAM]: getBrowserId(),
  [HOST_KEY_PARAM]: hostKeys.get(roomId),
  [ROOM_TOKEN_PARAM]: seats.get(roomId),
});
