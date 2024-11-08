import { memo } from "react";
import { Monaco } from "@monaco-editor/react";
import { Languages } from "lucide-react";
import * as monaco from "monaco-editor";

import { cn } from "@/lib/utils";

import { LanguageSelection } from "./language-selection";

interface CursorPosition {
  readonly line: number;
  readonly column: number;
  readonly selected?: number;
}

interface StatusBarProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  readonly cursorPosition: CursorPosition;
  className?: string;
}

function formatCursorPosition({
  line,
  column,
  selected,
}: CursorPosition): string {
  const basePosition = `Ln ${line}, Col ${column}`;
  return selected ? `${basePosition} (${selected} selected)` : basePosition;
}

export const StatusBar = memo(function StatusBar({
  monaco,
  editor,
  cursorPosition,
  className,
}: StatusBarProps) {
  if (!monaco || !editor) return null;

  return (
    <section
      className={cn(
        "absolute bottom-0 h-6 w-full animate-swing-in-top-fwd bg-[#2678ca] py-1",
        className,
      )}
      role="status"
      aria-label="Editor status bar"
    >
      <div className="flex items-center justify-end gap-x-2 px-2 text-xs text-primary-foreground">
        <div className="flex items-center gap-x-1">
          <span className="flex items-center gap-x-1">
            <Languages className="size-4" aria-hidden="true" />
            <span className="sr-only">Current language:</span>
            Language:
          </span>
          <LanguageSelection
            monaco={monaco}
            editor={editor}
            className="hover:bg-primary-foreground/10"
          />
        </div>
        <div
          className="flex items-center"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatCursorPosition(cursorPosition)}
        </div>
      </div>
    </section>
  );
});

StatusBar.displayName = "StatusBar";
