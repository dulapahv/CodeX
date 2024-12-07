import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { Download, Trash2 } from 'lucide-react';

import type { ExecutionResult } from '@common/types/terminal';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Output } from './components/output';
import { WelcomeMsg } from './components/welcome-msg';
import { formatTimestamp } from './utils';

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

  const handleDownloadLogs = () => {
    const logs = results
      .map((result) => {
        const timestamp = formatTimestamp(
          new Date(result.timestamp ?? Date.now()),
        );
        const stdout = result.run.stdout
          ? `Output: ${result.run.stdout}\n`
          : '';
        const stderr = result.run.stderr ? `Error: ${result.run.stderr}\n` : '';
        const exitCode =
          result.run.code !== 0 ? `Exit Code: ${result.run.code}\n` : '';

        return `[${timestamp}]\n${stdout}${stderr}${exitCode}`;
      })
      .join('\n---\n\n');

    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const datePart = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    a.download = `kasca-terminal-${datePart}--${timePart}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearTerminal = () => {
    setResults([]);
  };

  return (
    <div className="relative h-full bg-[color:var(--panel-background)]">
      <div className="absolute right-1 top-2 z-10 flex items-center gap-1 rounded-md px-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownloadLogs}
                className="size-6"
                aria-label="Download terminal logs"
              >
                <Download className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download logs</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearTerminal}
                className="size-6"
                aria-label="Clear terminal"
              >
                <Trash2 className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear terminal</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div ref={terminalRef} className="h-full overflow-y-auto p-4">
        <div className="flex flex-col space-y-2 divide-y whitespace-pre-wrap font-mono text-sm *:border-muted-foreground/40 *:pt-2">
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
