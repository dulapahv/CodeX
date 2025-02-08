/**
 * Run button component for code execution control.
 * Features:
 * - Code execution triggering
 * - Execution cancellation
 * - Args/stdin input handling
 * - Status indication
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { Monaco } from '@monaco-editor/react';
import { OctagonX, Play } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { CodeServiceMsg } from '@codex/types/message';
import type { ExecutionResult } from '@codex/types/terminal';

import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { AboutPopover } from './components/about-popover';
import { ArgsInputPopover } from './components/args-stdin-popover';
import { cancelExecution, executeCode } from './utils';

interface RunButtonProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
  className?: string;
}

const RunButton = ({
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
    socket.on(CodeServiceMsg.EXEC, (isExecuting: boolean) =>
      setIsRunning(isExecuting),
    );

    return () => {
      socket.off(CodeServiceMsg.EXEC);
    };
  }, [socket]);

  return (
    <div className="flex items-center gap-1">
      <div className="animate-fade-in-top">
        <Button
          onClick={
            isRunning
              ? () =>
                  cancelExecution(abortControllerRef, setIsRunning, setOutput)
              : () =>
                  executeCode(
                    monaco,
                    editor,
                    setOutput,
                    setIsRunning,
                    abortControllerRef,
                    args,
                    stdin,
                  )
          }
          className={cn(
            `h-7 rounded-r-none bg-[color:var(--toolbar-accent)] px-2 py-0
            text-[color:var(--panel-text-accent)] transition-opacity
            hover:bg-[color:var(--toolbar-accent)] hover:!opacity-80 disabled:!opacity-50`,
            isRunning && 'bg-red-600 hover:bg-red-700',
            className,
          )}
          disabled={!editor}
          aria-busy={isRunning}
          aria-label={isRunning ? 'Cancel execution' : 'Run code'}
        >
          {isRunning ? (
            <>
              <OctagonX className="mr-0 size-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden sm:flex">Cancel</span>
            </>
          ) : (
            <>
              <Play
                className="mr-0 size-4 fill-green-600 sm:mr-1"
                aria-hidden="true"
              />
              <span className="hidden sm:flex">Run Code</span>
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

export { RunButton };
