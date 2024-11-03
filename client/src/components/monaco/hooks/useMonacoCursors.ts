import type * as monaco from "monaco-editor";
import { useCallback, useRef } from "react";

import type { Monaco } from "@monaco-editor/react";
import { COLORS } from "@/lib/constants";
import { hashString } from "@/lib/utils";

import type { Cursor } from "../../../../../common/types/operation";
import { CURSOR_CLEANUP_DELAY } from "../constants";
import { CleanupTimeouts, CursorDecorations } from "../types";
import { createCursorStyle, createSafeClassName } from "../utils";

export const useMonacoCursors = () => {
  const cursorDecorationsRef = useRef<CursorDecorations>({});
  const cleanupTimeoutsRef = useRef<CleanupTimeouts>({});

  const handleCursorUpdate = useCallback(
    (
      name: string,
      cursor: Cursor,
      editor: monaco.editor.IStandaloneCodeEditor,
      monacoInstance: Monaco,
    ) => {
      if (!editor || !monacoInstance) return;

      console.log(cursor);

      cursorDecorationsRef.current[name]?.clear();

      const color = COLORS[hashString(name) % COLORS.length];
      const safeClassName = createSafeClassName(name);
      const isFirstLine = cursor.line === 1;

      try {
        const cursorDecoration = editor.createDecorationsCollection([
          {
            range: new monacoInstance.Range(
              cursor.line,
              cursor.column,
              cursor.line,
              cursor.column,
            ),
            options: {
              className: safeClassName,
              beforeContentClassName: "cursor-widget",
              isWholeLine: false,
              stickiness:
                monacoInstance.editor.TrackedRangeStickiness
                  .NeverGrowsWhenTypingAtEdges,
              inlineClassName: safeClassName,
              hoverMessage: { value: `${name}'s cursor` },
            },
          },
        ]);

        const styleId = `cursor-style-${safeClassName}`;
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = createCursorStyle(
          safeClassName,
          color,
          name,
          isFirstLine,
        );

        cursorDecorationsRef.current[name] = cursorDecoration;

        if (cleanupTimeoutsRef.current[name]) {
          clearTimeout(cleanupTimeoutsRef.current[name]);
        }

        cleanupTimeoutsRef.current[name] = setTimeout(() => {
          cursorDecoration.clear();
          delete cursorDecorationsRef.current[name];
          styleElement?.remove();
          delete cleanupTimeoutsRef.current[name];
        }, CURSOR_CLEANUP_DELAY);
      } catch (error) {
        console.error("Error updating cursor:", error);
      }
    },
    [],
  );

  return {
    handleCursorUpdate,
    cursorDecorationsRef,
    cleanupTimeoutsRef,
  };
};
