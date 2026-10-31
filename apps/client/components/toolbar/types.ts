/**
 * Type definitions for toolbar menu props and actions.
 * Includes:
 * - Base menu props interface
 * - Desktop/mobile specific props
 * - Menu action definitions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

/** Platforms whose Monaco keybindings differ, matching Monaco's own detection */
export type ShortcutPlatform = "linux" | "mac" | "windows";

export interface MenuProps {
  actions: ToolbarActions;
  livePreview: boolean;
  notepad: boolean;
  platform: ShortcutPlatform;
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
  /** Add a cursor at the end of each selected line */
  addCursorsToLineEnds: () => void;
  /** Add line comment */
  addLineComment: () => void;
  /** Add selection to next find match */
  addNextOccurrence: () => void;
  /** Change all occurrences of current word */
  changeAllOccurrences: () => void;
  /** Open command palette */
  commandPalette: () => void;
  /** Copy selection */
  copy: () => void;
  /** Copy current line down */
  copyLineDown: () => void;
  /** Copy current line up */
  copyLineUp: () => void;
  /** Undo last cursor change */
  cursorUndo: () => void;
  /** Cut selection */
  cut: () => void;
  /** Delete current line */
  deleteLine: () => void;
  /** Duplicate current selection */
  duplicateSelection: () => void;
  /** Expand selection to whole lines */
  expandLineSelection: () => void;
  /** Expand smart selection */
  expandSelection: () => void;
  /** Open find dialog */
  find: () => void;
  /** Find next match */
  findNext: () => void;
  /** Find previous match */
  findPrevious: () => void;
  /** Fold region at cursor */
  fold: () => void;
  /** Fold all */
  foldAll: () => void;
  /** Fold region at cursor and its children */
  foldRecursively: () => void;
  /** Format document */
  formatDocument: () => void;
  /** Format selection */
  formatSelection: () => void;
  /** Jump to matching bracket */
  goToBracket: () => void;
  /** Go to definition */
  goToDefinition: () => void;
  /** Go to line/column */
  goToLine: () => void;
  /** Go to references */
  goToReferences: () => void;
  /** Go to symbol */
  goToSymbol: () => void;
  /** Indent current line */
  indentLine: () => void;
  /** Insert line above */
  insertLineAbove: () => void;
  /** Insert line below */
  insertLineBelow: () => void;
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
  /** Go to next problem */
  nextProblem: () => void;
  /** Open from local device */
  openLocal: () => void;
  /** Open from a git provider */
  openRepository: () => void;
  /** Organize imports */
  organizeImports: () => void;
  /** Outdent current line */
  outdentLine: () => void;
  /** Paste from clipboard */
  paste: () => void;
  /** Peek definition */
  peekDefinition: () => void;
  /** Go to previous problem */
  previousProblem: () => void;
  /** Show quick fixes */
  quickFix: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Show refactorings */
  refactor: () => void;
  /** Remove surrounding brackets */
  removeBrackets: () => void;
  /** Remove line comment */
  removeLineComment: () => void;
  /** Rename symbol */
  renameSymbol: () => void;
  /** Open find and replace dialog */
  replace: () => void;
  /** Save to local device */
  saveLocal: () => void;
  /** Open the save-to-repository dialog */
  saveRepository: () => void;
  /** Select all content */
  selectAll: () => void;
  /** Select all occurrences of current selection */
  selectHighlights: () => void;
  /** Expand selection to brackets */
  selectToBracket: () => void;
  /** Open settings panel */
  settings: () => void;
  /** Show hover */
  showHover: () => void;
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
  /** Toggle whether Tab moves focus instead of indenting */
  toggleTabFocusMode: () => void;
  /** Toggle terminal panel */
  toggleTerminalPanel: () => void;
  /** Toggle webcam stream panel */
  toggleWebcamPanel: () => void;
  /** Trigger parameter hints */
  triggerParameterHints: () => void;
  /** Trigger suggestions */
  triggerSuggest: () => void;
  /** Trim trailing whitespace */
  trimTrailingWhitespace: () => void;
  /** Undo last action */
  undo: () => void;
  /** Unfold region at cursor */
  unfold: () => void;
  /** Unfold all */
  unfoldAll: () => void;
  /** Unfold region at cursor and its children */
  unfoldRecursively: () => void;
  /** Transform to uppercase */
  uppercase: () => void;
  /** Font zoom in */
  zoomIn: () => void;
  /** Font zoom out */
  zoomOut: () => void;
}
