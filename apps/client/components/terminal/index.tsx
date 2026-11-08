/**
 * Shared terminal component for displaying code execution results.
 * Features:
 * - Output history display
 * - Auto-scroll behavior
 * - Download/clear logs
 * - Who is running code right now
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ExecutionResult } from "@codex/types/terminal";

import { DownloadSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { EmptyState } from "./components/empty-state";
import { Output } from "./components/output";
import { RunningStatus, useRunningNames } from "./components/running-status";
import { handleDownloadLogs } from "./utils";

interface TerminalProps {
  results: ExecutionResult[];
  setResults: Dispatch<SetStateAction<ExecutionResult[]>>;
}

const Terminal = ({ results, setResults }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const runningNames = useRunningNames();
  const isRunning = runningNames.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [results, isRunning]);

  return (
    <div className="relative h-full bg-[color:var(--panel-background)]">
      <div className="absolute top-2 right-1 z-10 flex items-center gap-1 px-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Download terminal logs"
                  className="size-6"
                  onClick={() => handleDownloadLogs(results)}
                  size="icon"
                  variant="ghost"
                >
                  <DownloadSimpleIcon className="size-3" />
                </Button>
              }
            />
            <TooltipContent>
              <p>Download output</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Clear terminal"
                  className="size-6"
                  onClick={() => setResults([])}
                  size="icon"
                  variant="ghost"
                >
                  <TrashIcon className="size-3" />
                </Button>
              }
            />
            <TooltipContent>
              <p>Clear output</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="h-full overflow-y-auto p-4" ref={terminalRef}>
        <div className="*:border-muted-foreground/40 flex flex-col divide-y font-mono text-sm whitespace-pre-wrap *:py-2">
          {results.length === 0 && !isRunning && <EmptyState />}
          {results.map((result, index) => (
            <Output key={index} result={result} />
          ))}
          {isRunning && <RunningStatus names={runningNames} />}
        </div>
      </div>
    </div>
  );
};

export { Terminal };
