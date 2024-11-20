import { useEffect, useRef } from 'react';
import { GeistMono } from 'geist/font/mono';

import type { ExecutionResult } from '@common/types/terminal';

import { cn } from '@/lib/utils';

import { Output } from './components/output';
import { WelcomeMsg } from './components/welcome-msg';

interface TerminalProps {
  results: ExecutionResult[];
  onResultsChange?: (results: ExecutionResult[]) => void;
}

const Terminal = ({ results, onResultsChange }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(results);
    }
  }, [results, onResultsChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [results]);

  return (
    <div
      ref={terminalRef}
      className="h-full overflow-y-auto bg-[color:var(--panel-background)] p-4"
    >
      <div
        className={cn(
          GeistMono.className,
          'flex flex-col space-y-2 divide-y whitespace-pre-wrap text-sm *:border-muted-foreground/40 *:pt-2',
        )}
      >
        <WelcomeMsg />
        {results.map((result, index) => (
          <Output key={index} result={result} />
        ))}
      </div>
    </div>
  );
};

export { Terminal };
