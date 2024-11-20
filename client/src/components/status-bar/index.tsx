/**
 * Status bar component that displays cursor position and language selection.
 * Shows line number, column number, and optional selection count.
 *
 * @example
 * ```tsx
 * <StatusBar
 *   monaco={monaco}
 *   editor={editor}
 *   cursorPosition={{ line: 1, column: 1, selected: 10 }}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.monaco - Monaco instance
 * @param props.editor - Monaco editor instance
 * @param props.cursorPosition - Current cursor position details
 * @param props.cursorPosition.line - Current line number
 * @param props.cursorPosition.column - Current column number
 * @param props.cursorPosition.selected - Number of selected characters (optional)
 * @param props.className - Additional CSS class names
 *
 * @returns Status bar showing cursor position and language picker
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo, useEffect, useState } from 'react';
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
  const [editorTheme, setEditorTheme] = useState<string | null>(() => {
    return localStorage.getItem('editorTheme');
  });

  useEffect(() => {
    const updateTheme = (theme?: string | null) => {
      const newTheme = theme ?? localStorage.getItem('editorTheme');
      setEditorTheme(newTheme);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'editorTheme') {
        updateTheme(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
  }, []);

  if (!monaco || !editor) return null;

  return (
    <section
      className={cn(
        'fixed inset-x-0 bottom-0 h-6 animate-fade-in bg-[color:var(--toolbar-bg-primary)] py-1',
        className,
      )}
      role="status"
      aria-label="Editor status bar"
    >
      <div
        className={cn(
          'flex items-center justify-end gap-x-2 px-2 text-xs',
          editorTheme === 'light' && 'text-white',
        )}
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
