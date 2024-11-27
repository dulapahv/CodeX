import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Monaco } from '@monaco-editor/react';
import { Info, Play, StopCircle } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { CodeServiceMsg } from '@common/types/message';
import { ExecutionResultType, type ExecutionResult } from '@common/types/terminal';

import { getSocket } from '@/lib/socket';
import { cn, parseError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ExecutionArgs } from './components/input-args';

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
      <Button
        onClick={isRunning ? cancelExecution : executeCode}
        className={cn(
          'h-7 animate-fade-in-top rounded-sm bg-[color:var(--toolbar-accent)] px-2 py-0 text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)] hover:!opacity-80 disabled:!opacity-50',
          className,
        )}
        disabled={!editor}
        aria-busy={isRunning}
        aria-label={isRunning ? 'Cancel execution' : 'Run code'}
      >
        {isRunning ? (
          <>
            <StopCircle className="mr-1 size-4 text-red-500" aria-hidden="true" />
            <span>Cancel</span>
          </>
        ) : (
          <>
            <Play className="mr-1 size-4 fill-green-600" aria-hidden="true" />
            <span>Run Code</span>
          </>
        )}
      </Button>

      <ExecutionArgs onArgsChange={setArgs} disabled={isRunning || !editor} />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-sm p-0 hover:bg-transparent hover:opacity-80"
          >
            <Info className="size-4 text-[color:var(--panel-text)]" />
            <span className="sr-only">About code execution</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Code Execution</h4>
            <p className="text-sm text-muted-foreground">
              Powered by Piston, an open-source code execution engine. You can cancel execution 
              at any time by clicking the stop button.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the dropdown menu to add command-line arguments to your program.
            </p>
            <p className="text-sm text-muted-foreground">
              For a list of supported programming languages, visit the{' '}
              <a
                href="https://github.com/engineer-man/piston#Supported-Languages"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Piston documentation
              </a>
              .
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};