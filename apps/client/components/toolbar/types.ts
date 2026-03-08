/**
 * Type definitions for toolbar menu props and actions.
 * Includes:
 * - Base menu props interface
 * - Desktop/mobile specific props
 * - Menu action definitions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export interface MenuProps {
  actions: ToolbarActions;
  livePreview: boolean;
  modKey: string;
  notepad: boolean;
  terminal: boolean;
  webcam: boolean;
}

export interface ToolbarActions {
  /** About */
  about: () => void;
  /** Add cursor above current position */
  addCursorAbove: () => void;
  /** Add cursor below current position */
  addCursorBelow: () => void;
  /** Open command palette */
  commandPalette: () => void;
  /** Copy selection */
  copy: () => void;
  /** Copy current line down */
  copyLineDown: () => void;
  /** Copy current line up */
  copyLineUp: () => void;
  /** Cut selection */
  cut: () => void;
  /** Duplicate current selection */
  duplicateSelection: () => void;
  /** Expand smart selection */
  expandSelection: () => void;
  /** Open find dialog */
  find: () => void;
  /** Fold all */
  foldAll: () => void;
  /** Open leave room dialog */
  leaveRoom: () => void;
  /** Transform to lowercase */
  lowercase: () => void;
  /** Manual */
  manual: () => void;
  /** Move current line down */
  moveLineDown: () => void;
  /** Move current line up */
  moveLineUp: () => void;
  /** Open from GitHub */
  openGitHub: () => void;
  /** Open from local device */
  openLocal: () => void;
  /** Paste from clipboard */
  paste: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Open find and replace dialog */
  replace: () => void;
  /** Open GitHub save dialog */
  saveGitHub: () => void;
  /** Save to local device */
  saveLocal: () => void;
  /** Select all content */
  selectAll: () => void;
  /** Select all occurrences of current selection */
  selectHighlights: () => void;
  /** Expand selection to brackets */
  selectToBracket: () => void;
  /** Open settings panel */
  settings: () => void;
  /** Shrink smart selection */
  shrinkSelection: () => void;
  /** Sort lines ascending */
  sortLinesAscending: () => void;
  /** Sort lines descending */
  sortLinesDescending: () => void;
  /** Transform to title case */
  titleCase: () => void;
  /** Toggle block comment */
  toggleBlockComment: () => void;
  /** Toggle fold */
  toggleFold: () => void;
  /** Toggle line comment */
  toggleLineComment: () => void;
  /** Toggle notepad panel */
  toggleNotepadPanel: () => void;
  /** Toggle Sandpack panel */
  toggleSandpackPanel: () => void;
  /** Toggle terminal panel */
  toggleTerminalPanel: () => void;
  /** Toggle webcam stream panel */
  toggleWebcamPanel: () => void;
  /** Undo last action */
  undo: () => void;
  /** Unfold all */
  unfoldAll: () => void;
  /** Transform to uppercase */
  uppercase: () => void;
  /** Font zoom in */
  zoomIn: () => void;
  /** Font zoom out */
  zoomOut: () => void;
}
