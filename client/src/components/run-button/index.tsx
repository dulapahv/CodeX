'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Monaco } from '@monaco-editor/react';
import { LoaderCircle, Play } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { CodeServiceMsg } from '@common/types/message';
import {
  ExecutionResultType,
  type ExecutionResult,
} from '@common/types/terminal';

import { getSocket } from '@/lib/socket';
import { cn, parseError } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RunButtonProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
  className?: string;
}

export const RunButton = ({
  monaco,
  editor,
  setOutput,
  className,
}: RunButtonProps) => {
  const socket = getSocket();

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    socket.on(CodeServiceMsg.EXEC, (isExecuting: boolean) => {
      setIsRunning(isExecuting);
    });
    return () => {
      socket.off(CodeServiceMsg.EXEC);
    };
  }, [socket]);

  const executeCode = async () => {
    if (!monaco || !editor) return;

    const startTime = new Date();
    setIsRunning(true);
    socket.emit(CodeServiceMsg.EXEC, true);

    try {
      const code = editor.getValue();

      if (!code.trim()) {
        const res = {
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
        };
        setOutput((currentOutput) => [...currentOutput, res]);
        socket.emit(CodeServiceMsg.UPDATE_TERM, res);
        return;
      }

      const res = {
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
      };

      setOutput((currentOutput) => [...currentOutput, res]);
      socket.emit(CodeServiceMsg.UPDATE_TERM, res);

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
        throw new Error(
          `HTTP error! status: ${response.status}\nThis language might not be supported or the server is down.\nFor list of supported languages, please see https://github.com/engineer-man/piston?tab=readme-ov-file#Supported-Languages.`,
        );
      }

      const result: ExecutionResult = await response.json();
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      const resultWithTimestamp: ExecutionResult = {
        ...result,
        timestamp: endTime,
        executionTime,
        type: ExecutionResultType.OUTPUT,
      };
      setOutput((currentOutput) => {
        return [...currentOutput, resultWithTimestamp];
      });
      socket.emit(CodeServiceMsg.UPDATE_TERM, resultWithTimestamp);
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      const res = {
        language: 'error',
        version: '1.0.0',
        run: {
          stdout: '',
          stderr: parseError(error),
          code: 1,
          signal: null,
          output: parseError(error),
        },
        timestamp: endTime,
        executionTime,
        type: ExecutionResultType.ERROR,
      };
      setOutput((currentOutput) => [...currentOutput, res]);
      socket.emit(CodeServiceMsg.UPDATE_TERM, res);
    } finally {
      setIsRunning(false);
      socket.emit(CodeServiceMsg.EXEC, false);
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
