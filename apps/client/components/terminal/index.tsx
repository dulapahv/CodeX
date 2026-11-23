/**
 * Shared terminal component for displaying code execution results.
 * Features:
 * - Output history display
 * - Auto-scroll behavior
 * - Who is running code right now
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ExecutionResult } from "@codex/types/terminal";

import { useEffect, useRef } from "react";

import { EmptyState } from "./components/empty-state";
import { Output } from "./components/output";
import { RunningStatus, useRunningNames } from "./components/running-status";

interface TerminalProps {
  results: ExecutionResult[];
}

const Terminal = ({ results }: TerminalProps) => {
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
    <div className="h-full overflow-y-auto px-5 pb-3" ref={terminalRef}>
      <div className="*:border-wb-border flex flex-col divide-y font-mono text-sm whitespace-pre-wrap *:py-2">
        {results.length === 0 && !isRunning && <EmptyState />}
        {results.map((result, index) => (
          <Output key={index} result={result} />
        ))}
        {isRunning && <RunningStatus names={runningNames} />}
      </div>
    </div>
  );
};

export { Terminal };
