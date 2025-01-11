/**
 * Global window interface extensions.
 * Features:
 * - Auth window reference
 * - Type definitions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

declare global {
  interface Window {
    authWindow?: Window | null;
  }
}

// This export is necessary to make this a module
export {};
