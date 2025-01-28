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
  modKey: string;
  actions: ToolbarActions;
  notepad: boolean;
  terminal: boolean;
  webcam: boolean;
  livePreview: boolean;
}

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
  /** Toggle line comment */
  toggleLineComment: () => void;
  /** Toggle block comment */
  toggleBlockComment: () => void;
  /** Transform to uppercase */
  uppercase: () => void;
  /** Transform to lowercase */
  lowercase: () => void;
  /** Transform to title case */
  titleCase: () => void;
  /** Sort lines ascending */
  sortLinesAscending: () => void;
  /** Sort lines descending */
  sortLinesDescending: () => void;
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
  /** Expand selection to brackets */
  selectToBracket: () => void;
  /** Select all occurrences of current selection */
  selectHighlights: () => void;
  /** Expand smart selection */
  expandSelection: () => void;
  /** Shrink smart selection */
  shrinkSelection: () => void;
  /** Open command palette */
  commandPalette: () => void;
  /** Font zoom in */
  zoomIn: () => void;
  /** Font zoom out */
  zoomOut: () => void;
  /** Fold all */
  foldAll: () => void;
  /** Toggle fold */
  toggleFold: () => void;
  /** Unfold all */
  unfoldAll: () => void;
  /** Toggle notepad panel */
  toggleNotepadPanel: () => void;
  /** Toggle terminal panel */
  toggleTerminalPanel: () => void;
  /** Toggle webcam stream panel */
  toggleWebcamPanel: () => void;
  /** Toggle Sandpack panel */
  toggleSandpackPanel: () => void;
  /** Manual */
  manual: () => void;
  /** About */
  about: () => void;
}
