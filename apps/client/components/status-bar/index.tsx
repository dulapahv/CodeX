/**
 * Status bar component that displays editor information.
 * Features:
 * - Current language display
 * - Cursor position tracking
 * - Selection feedback
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import { TranslateIcon } from "@phosphor-icons/react";
import type * as monacoEditor from "monaco-editor";
import { memo } from "react";

import { cn } from "@/lib/utils";

import { LanguageSelection } from "./components/language-select";

interface StatusBarCursorPosition {
  readonly column: number;
  readonly line: number;
  readonly selected?: number;
}

interface StatusBarProps {
  className?: string;
  readonly cursorPosition: StatusBarCursorPosition;
  editor: monacoEditor.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}

const MemoizedLanguageLabel = memo(function MemoizedLanguagesIcon() {
  return (
    <span className="flex items-center gap-x-1">
      <TranslateIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">Current language:</span>
      Language:
    </span>
  );
});

function formatCursorPosition({
  line,
  column,
  selected,
}: StatusBarCursorPosition): string {
  const basePosition = `Ln ${line}, Col ${column}`;
  return selected ? `${basePosition} (${selected} selected)` : basePosition;
}

const StatusBar = memo(function StatusBarComponent({
  monaco,
  editor,
  cursorPosition,
  className,
}: StatusBarProps) {
  if (!(monaco && editor)) {
    return null;
  }

  return (
    <section
      aria-label="Editor status bar"
      className={cn(
        "animate-fade-in fixed inset-x-0 bottom-0 h-6 bg-[color:var(--toolbar-bg-primary)] py-1",
        className
      )}
      role="status"
    >
      <div
        className={
          "flex items-center justify-end gap-x-2 px-2 text-xs text-[color:var(--status-bar-text)]"
        }
      >
        <div className="flex items-center">
          <MemoizedLanguageLabel />
          <LanguageSelection
            className="hover:bg-primary-foreground/10"
            editor={editor}
            monaco={monaco}
          />
        </div>
        <div
          aria-atomic="true"
          aria-live="polite"
          className="flex items-center"
        >
          {formatCursorPosition(cursorPosition)}
        </div>
      </div>
    </section>
  );
});

StatusBar.displayName = "StatusBar";

export { StatusBar, type StatusBarCursorPosition };
