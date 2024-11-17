export interface ToolbarActions {
  /** Open from local device */
  openLocal: () => void;
  /** Open from GitHub */
  openGitHub: () => void;
  /** Save to local device */
  saveLocal: () => void;
  /** Open GitHub save dialog */
  saveGitHub: () => void;
  /** Open leave room dialog */
  leaveRoom: () => void;
  /** Open settings panel */
  settings: () => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Cut selection */
  cut: () => void;
  /** Copy selection */
  copy: () => void;
  /** Paste from clipboard */
  paste: () => void;
  /** Open find dialog */
  find: () => void;
  /** Open find and replace dialog */
  replace: () => void;
  /** Select all content */
  selectAll: () => void;
  /** Copy current line up */
  copyLineUp: () => void;
  /** Copy current line down */
  copyLineDown: () => void;
  /** Move current line up */
  moveLineUp: () => void;
  /** Move current line down */
  moveLineDown: () => void;
  /** Duplicate current selection */
  duplicateSelection: () => void;
  /** Add cursor above current position */
  addCursorAbove: () => void;
  /** Add cursor below current position */
  addCursorBelow: () => void;
  /** Open command palette */
  commandPalette: () => void;
  /** Toggle minimap visibility */
  minimap: () => void;
  /** Toggle word wrap */
  wordWrap: () => void;
  /** Manual */
  manual: () => void;
  /** About */
  about: () => void;
}
