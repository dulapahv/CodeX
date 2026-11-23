/**
 * The participant this user is following, if any.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useSyncExternalStore } from "react";

import { storage } from "@/lib/services/storage";

export const useFollowUserId = () =>
  useSyncExternalStore(
    storage.subscribe,
    () => storage.getFollowUserId(),
    () => null
  );
