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
import { Languages } from "lucide-react";
import type * as monaco from "monaco-editor";
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
  editor: monaco.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}

const MemoizedLanguageLabel = memo(function MemoizedLanguagesIcon() {
  return (
    <span className="flex items-center gap-x-1">
      <Languages aria-hidden="true" className="size-4" />
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

const StatusBar = memo(function StatusBar({
  monaco,
  editor,
  cursorPosition,
  className,
}: StatusBarProps) {
  if (!(monaco && editor)) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: status bar is both a section and live status region
    <section
      aria-label="Editor status bar"
      className={cn(
        "fixed inset-x-0 bottom-0 h-6 animate-fade-in bg-[color:var(--toolbar-bg-primary)] py-1",
        className
      )}
      role="status"
    >
      <div
        className={
          "flex items-center justify-end gap-x-2 px-2 text-[color:var(--status-bar-text)] text-xs"
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
