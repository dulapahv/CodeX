import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeistMono } from 'geist/font/mono';

import {
  ExecutionResultType,
  type ExecutionResult,
} from '@common/types/terminal';

import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TerminalProps {
  results: ExecutionResult[];
  onResultsChange?: (results: ExecutionResult[]) => void;
}

const Terminal = ({ results, onResultsChange }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [processedResults, setProcessedResults] = useState<ExecutionResult[]>(
    [],
  );

  // Keep track of processed result timestamps to prevent duplicates
  const processedTimestamps = useRef(new Set<string>());

  useEffect(() => {
    // Filter out duplicates based on timestamp
    const newResults = results.filter((result) => {
      const timestamp = new Date(result.timestamp ?? Date.now())
        .getTime()
        .toString();
      if (processedTimestamps.current.has(timestamp)) {
        return false;
      }
      processedTimestamps.current.add(timestamp);
      return true;
    });

    if (newResults.length > 0) {
      setProcessedResults((prev) => [...prev, ...newResults]);
    }
  }, [results]);

  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(processedResults);
    }
  }, [processedResults, onResultsChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [processedResults]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderWelcome = useCallback(
    () => (
      <div className="mb-4 space-y-2">
        <div className="text-green-500">
          ✨ Welcome to {SITE_NAME}
          {'\n'}
          ------------------------------------
        </div>
        <div>
          Ready to execute your code. Output will appear here.
          {'\n'}
          {'\n'}
          Type your code in the editor and click run to get started.
          {'\n'}
          To select language, click on the language dropdown in the bottom right
          corner.
        </div>
      </div>
    ),
    [],
  );

  const getMessageColor = useCallback((type?: ExecutionResultType) => {
    switch (type) {
      case ExecutionResultType.WARNING:
        return 'text-yellow-500';
      case ExecutionResultType.ERROR:
        return 'text-red-500';
      case ExecutionResultType.INFO:
        return 'text-blue-500';
      default:
        return '';
    }
  }, []);

  const renderOutput = useCallback(
    (result: ExecutionResult) => {
      const timestamp = new Date(result.timestamp ?? Date.now());
      const messageColor = getMessageColor(result.type);

      return (
        <div
          key={`${timestamp.getTime()}-${result.run.output}`}
          className="mb-2 border-b"
        >
          <div className="flex">
            <span className="mr-4 text-muted-foreground">
              [{formatTimestamp(timestamp)}]
            </span>
            <div className="flex-1">
              {result.type === 'output' && (
                <div className="text-muted-foreground">
                  Running {result.language} v{result.version}
                </div>
              )}

              {result.run.stdout && (
                <div
                  className={cn('whitespace-pre-wrap break-all', messageColor)}
                >
                  {result.run.stdout}
                </div>
              )}

              {result.run.stderr && (
                <div className="whitespace-pre-wrap break-all text-red-500">
                  Error: {result.run.stderr}
                </div>
              )}

              {result.run.code !== 0 && (
                <div className="text-red-500">
                  Process exited with code {result.run.code}
                </div>
              )}

              {'executionTime' in result && result.type !== 'info' && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Execution time:{' '}
                  {formatExecutionTime(result.executionTime ?? 0)}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
    [getMessageColor],
  );

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
        {renderWelcome()}
        {processedResults.map(renderOutput)}
      </div>
    </div>
  );
};

export { Terminal };
