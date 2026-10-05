/**
 * Current user's ID, re-rendering when a rejoin assigns a new one.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useSyncExternalStore } from "react";

import { storage } from "@/lib/services/storage";

export const useCurrentUserId = () =>
  useSyncExternalStore(
    storage.subscribe,
    () => storage.getUserId(),
    () => null
  );
