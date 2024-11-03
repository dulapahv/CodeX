export const CURSOR_STYLES = `
.cursor-widget {
  width: 2px;
  height: 18px;
  position: absolute;
}

.cursor-label {
  position: absolute;
  top: -18px;
  left: 4px;
  font-size: 12px;
  padding: 0 4px;
  border-radius: 3px;
  white-space: nowrap;
  color: white;
  z-index: 100;
}

@keyframes cursorFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}`;

export const CURSOR_CLEANUP_DELAY = 3000;
export const DEFAULT_THEME = "vs-dark";
