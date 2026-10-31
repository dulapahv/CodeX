/**
 * Custom hook that runs a chosen menu action once its menu has closed.
 * The menu keeps focus while open, so editor commands run from inside it
 * find no focused editor: quick inputs refuse to open, and suggestions or
 * the rename box close as soon as focus returns to the menubar.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useRef } from "react";

import type { ToolbarActions } from "../types";

export const useDeferredMenuAction = (actions: ToolbarActions) => {
  const pendingActionRef = useRef<keyof ToolbarActions | null>(null);

  const selectAction = (action: keyof ToolbarActions) => {
    pendingActionRef.current = action;
  };

  // Leave focus to the chosen action instead of returning it to the menubar
  const restoreFocus = () => pendingActionRef.current === null;

  const runPendingAction = (open: boolean) => {
    const action = pendingActionRef.current;
    if (open || action === null) {
      return;
    }
    pendingActionRef.current = null;
    actions[action]();
  };

  return { restoreFocus, runPendingAction, selectAction };
};
