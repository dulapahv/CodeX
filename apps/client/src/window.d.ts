declare global {
  interface Window {
    authWindow?: Window | null;
  }
}

// This export is necessary to make this a module
export {};
