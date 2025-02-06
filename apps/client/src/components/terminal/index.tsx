/**
 * Shared terminal component for displaying code execution results.
 * Features:
 * - Output history display
 * - Auto-scroll behavior
 * - Download/clear logs
 * - Welcome message
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

import { Download, Trash2 } from 'lucide-react';

import type { ExecutionResult } from '@codex/types/terminal';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Output } from './components/output';
import { WelcomeMsg } from './components/welcome-msg';
import { handleDownloadLogs } from './utils';

interface TerminalProps {
  results: ExecutionResult[];
  setResults: Dispatch<SetStateAction<ExecutionResult[]>>;
}

const Terminal = ({ results, setResults }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [results]);

  return (
    <div className="relative h-full bg-[color:var(--panel-background)]">
      <div className="absolute right-1 top-2 z-10 flex items-center gap-1 rounded-md px-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownloadLogs(results)}
                className="size-6"
                aria-label="Download terminal logs"
              >
                <Download className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download output</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setResults([])}
                className="size-6"
                aria-label="Clear terminal"
              >
                <Trash2 className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear output</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div ref={terminalRef} className="h-full overflow-y-auto p-4">
        <div
          className="*:border-muted-foreground/40 flex flex-col space-y-2 divide-y
            whitespace-pre-wrap font-mono text-sm *:pt-2"
        >
          <WelcomeMsg />
          {results.map((result, index) => (
            <Output key={index} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
};

export { Terminal };
