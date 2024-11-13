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

import { memo } from 'react';
import { Monaco } from '@monaco-editor/react';
import { Languages } from 'lucide-react';
import * as monaco from 'monaco-editor';

import { cn } from '@/lib/utils';

import type { StatusBarCursorPosition } from '../types';
import { LanguageSelection } from './language-selection';

interface StatusBarProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  readonly cursorPosition: StatusBarCursorPosition;
  className?: string;
}

function formatCursorPosition({
  line,
  column,
  selected,
}: StatusBarCursorPosition): string {
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
        'absolute bottom-0 h-6 w-full animate-swing-in-top-fwd bg-[#2678ca] py-1',
        className,
      )}
      role="status"
      aria-label="Editor status bar"
    >
      <div className="flex items-center justify-end gap-x-2 px-2 text-xs text-primary-foreground">
        <div className="flex items-center">
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

StatusBar.displayName = 'StatusBar';
