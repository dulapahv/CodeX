'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { Monaco } from '@monaco-editor/react';
import { LoaderCircle, Play } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { cn } from '@/lib/utils';
import type { ExecutionResult } from '@/components/terminal/types';
import { Button } from '@/components/ui/button';

interface RunButtonProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  output: Dispatch<SetStateAction<ExecutionResult[]>>;
  className?: string;
}

export const RunButton = ({
  monaco,
  editor,
  output,
  className,
}: RunButtonProps) => {
  const [isRunning, setIsRunning] = useState(false);

  const executeCode = async () => {
    if (!monaco || !editor) return;

    try {
      setIsRunning(true);
      const code = editor.getValue();

      if (!code.trim()) {
        console.warn('No code to execute');
        return;
      }

      const model = editor.getModel();
      const currentLanguageId = model?.getLanguageId();
      const language = monaco.languages
        .getLanguages()
        .find((lang) => lang.id === currentLanguageId);

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: language?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ExecutionResult = await response.json();

      // Use functional update to ensure we're working with the latest state
      output((currentOutput) => {
        const resultWithTimestamp = {
          ...result,
          timestamp: new Date(),
        };
        return [...currentOutput, resultWithTimestamp];
      });
    } catch (error) {
      console.error('Failed to execute code:', error);

      output((currentOutput) => [
        ...currentOutput,
        {
          language: 'error',
          version: '1.0.0',
          run: {
            stdout: '',
            stderr:
              error instanceof Error
                ? error.message
                : 'An error occurred during execution',
            code: 1,
            signal: null,
            output:
              error instanceof Error
                ? error.message
                : 'An error occurred during execution',
          },
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      onClick={executeCode}
      className={cn(
        'h-7 animate-fade-in-top rounded-sm px-2 py-0 disabled:!opacity-50',
        className,
      )}
      style={{
        backgroundColor: 'var(--toolbar-accent)',
        color: 'var(--toolbar-text-accent)',
      }}
      disabled={isRunning || !editor}
      aria-busy={isRunning}
      aria-label={isRunning ? 'Running code' : 'Run code'}
    >
      {isRunning ? (
        <>
          <LoaderCircle
            className="mr-1 size-4 animate-spin"
            aria-hidden="true"
          />
          Running...
        </>
      ) : (
        <>
          <Play className="mr-1 size-4 fill-green-600" aria-hidden="true" />
          Run Code
        </>
      )}
    </Button>
  );
};
