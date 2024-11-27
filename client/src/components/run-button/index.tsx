import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Monaco } from '@monaco-editor/react';
import { OctagonX, Play } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { CodeServiceMsg } from '@common/types/message';
import {
  ExecutionResultType,
  type ExecutionResult,
} from '@common/types/terminal';

import { getSocket } from '@/lib/socket';
import { cn, parseError } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { AboutPopover } from './components/about-popover';
import { ArgsInputPopover } from './components/args-stdin-popover';

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [args, setArgs] = useState<string[]>([]);
  const [stdin, setStdin] = useState('');

  useEffect(() => {
    socket.on(CodeServiceMsg.EXEC, (isExecuting: boolean) => {
      setIsRunning(isExecuting);
    });
    return () => {
      socket.off(CodeServiceMsg.EXEC);
    };
  }, [socket]);

  const cancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      const endTime = new Date();

      const res = {
        language: 'system',
        version: '1.0.0',
        run: {
          stdout: '🛑 Code execution cancelled',
          stderr: '',
          code: 0,
          signal: null,
          output: '',
        },
        timestamp: endTime,
        type: ExecutionResultType.WARNING,
      };

      setOutput((currentOutput) => [...currentOutput, res]);
      socket.emit(CodeServiceMsg.UPDATE_TERM, res);
      setIsRunning(false);
      socket.emit(CodeServiceMsg.EXEC, false);
    }
  };

  const executeCode = async () => {
    if (!monaco || !editor) return;

    const startTime = new Date();
    setIsRunning(true);
    socket.emit(CodeServiceMsg.EXEC, true);

    // Create new AbortController for this execution
    abortControllerRef.current = new AbortController();

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
          args: args,
          stdin: stdin,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}\nThis language may not be supported or the server is down.\nList of supported languages: https://github.com/engineer-man/piston?tab=readme-ov-file#Supported-Languages.`,
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
      setOutput((currentOutput) => [...currentOutput, resultWithTimestamp]);
      socket.emit(CodeServiceMsg.UPDATE_TERM, resultWithTimestamp);
    } catch (error) {
      // Don't show error message if the request was cancelled
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

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
      abortControllerRef.current = null;
      setIsRunning(false);
      socket.emit(CodeServiceMsg.EXEC, false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div>
        <Button
          onClick={isRunning ? cancelExecution : executeCode}
          className={cn(
            'h-7 animate-fade-in-top rounded-r-none bg-[color:var(--toolbar-accent)] px-2 py-0 text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)] hover:!opacity-80 disabled:!opacity-50',
            isRunning && 'bg-red-600 hover:bg-red-700',
            className,
          )}
          disabled={!editor}
          aria-busy={isRunning}
          aria-label={isRunning ? 'Cancel execution' : 'Run code'}
        >
          {isRunning ? (
            <>
              <OctagonX className="mr-1 size-4" aria-hidden="true" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Play className="mr-1 size-4 fill-green-600" aria-hidden="true" />
              <span>Run Code</span>
            </>
          )}
        </Button>

        <ArgsInputPopover
          onArgsChange={setArgs}
          onStdinChange={setStdin}
          disabled={isRunning || !editor}
        />
      </div>

      <AboutPopover />
    </div>
  );
};
