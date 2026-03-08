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

import type { ExecutionResult } from "@codex/types/terminal";

import { Download, Trash2 } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Output } from "./components/output";
import { WelcomeMsg } from "./components/welcome-msg";
import { handleDownloadLogs } from "./utils";

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
  }, []);

  return (
    <div className="relative h-full bg-[color:var(--panel-background)]">
      <div className="absolute top-2 right-1 z-10 flex items-center gap-1 rounded-md px-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Download terminal logs"
                className="size-6"
                onClick={() => handleDownloadLogs(results)}
                size="icon"
                variant="ghost"
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
                aria-label="Clear terminal"
                className="size-6"
                onClick={() => setResults([])}
                size="icon"
                variant="ghost"
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
      <div className="h-full overflow-y-auto p-4" ref={terminalRef}>
        <div className="flex flex-col space-y-2 divide-y whitespace-pre-wrap font-mono text-sm *:border-muted-foreground/40 *:pt-2">
          <WelcomeMsg />
          {results.map((result, index) => (
            <Output
              // biome-ignore lint/suspicious/noArrayIndexKey: terminal results are append-only
              key={index}
              result={result}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { Terminal };
