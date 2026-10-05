/**
 * Latest webcam error, shown inline above the webcam controls.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useSyncExternalStore } from "react";

let currentError: string | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const reportWebcamError = (message: string) => {
  currentError = message;
  notify();
};

export const clearWebcamError = () => {
  if (currentError !== null) {
    currentError = null;
    notify();
  }
};

export const useWebcamError = () =>
  useSyncExternalStore(
    subscribe,
    () => currentError,
    () => null
  );
