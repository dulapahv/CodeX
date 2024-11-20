'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import { Monaco } from '@monaco-editor/react';
import { LoaderCircle, Play } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { cn, parseError } from '@/lib/utils';
import {
  ExecutionResultType,
  type ExecutionResult,
} from '@/components/terminal/types';
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

    const startTime = new Date();
    setIsRunning(true);

    try {
      const code = editor.getValue();

      // Log the initial "Running..." message
      output((currentOutput) => [
        ...currentOutput,
        {
          language: 'system',
          version: '1.0.0',
          run: {
            stdout: '🚀 Executing code...',
            stderr: '',
            code: 0,
            signal: null,
            output: '',
          },
          timestamp: startTime,
          type: ExecutionResultType.INFO,
        },
      ]);

      if (!code.trim()) {
        output((currentOutput) => [
          ...currentOutput,
          {
            language: 'system',
            version: '1.0.0',
            run: {
              stdout: '⚠️ No code to execute',
              stderr: '',
              code: 0,
              signal: null,
              output: '',
            },
            timestamp: new Date(),
            type: ExecutionResultType.WARNING,
          },
        ]);
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
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      output((currentOutput) => {
        const resultWithTimestamp: ExecutionResult = {
          ...result,
          timestamp: endTime,
          executionTime,
          type: ExecutionResultType.OUTPUT,
        };
        return [...currentOutput, resultWithTimestamp];
      });
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      output((currentOutput) => [
        ...currentOutput,
        {
          language: 'error',
          version: '1.0.0',
          run: {
            stdout: '',
            stderr: parseError(error),
            code: 1,
            signal: null,
            output:
              error instanceof Error
                ? error.message
                : 'An error occurred during execution',
          },
          timestamp: endTime,
          executionTime,
          type: ExecutionResultType.ERROR,
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
        'h-7 animate-fade-in-top rounded-sm bg-[color:var(--toolbar-accent)] px-2 py-0 text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)] hover:!opacity-80 disabled:!opacity-50',
        className,
      )}
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
