/**
 * Status bar component that displays editor information.
 * Features:
 * - Current language display
 * - Cursor position tracking
 * - Selection feedback
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo } from 'react';

import { Monaco } from '@monaco-editor/react';
import { Languages } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { cn } from '@/lib/utils';

import { LanguageSelection } from './components/language-select';

type StatusBarCursorPosition = {
  readonly line: number;
  readonly column: number;
  readonly selected?: number;
};

interface StatusBarProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  readonly cursorPosition: StatusBarCursorPosition;
  className?: string;
}

const MemoizedLanguageLabel = memo(function MemoizedLanguagesIcon() {
  return (
    <span className="flex items-center gap-x-1">
      <Languages className="size-4" aria-hidden="true" />
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
  if (!monaco || !editor) return null;

  return (
    <section
      className={cn(
        `animate-fade-in fixed inset-x-0 bottom-0 h-6
        bg-[color:var(--toolbar-bg-primary)] py-1`,
        className,
      )}
      role="status"
      aria-label="Editor status bar"
    >
      <div
        className={`flex items-center justify-end gap-x-2 px-2 text-xs
          text-[color:var(--status-bar-text)]`}
      >
        <div className="flex items-center">
          <MemoizedLanguageLabel />
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

StatusBar.displayName = 'StatusBar';

export { StatusBar, type StatusBarCursorPosition };
