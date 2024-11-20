import React, { useEffect, useRef } from 'react';
import { GeistMono } from 'geist/font/mono';

import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

import { ExecutionResultType, type ExecutionResult } from './types';

interface TerminalProps {
  results: ExecutionResult[];
}

const Terminal = ({ results }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay scroll to ensure content is rendered
    const timer = setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = 0;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new content is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [results]);

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

  const renderWelcome = () => (
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
  );

  const getMessageColor = (type?: ExecutionResultType) => {
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
  };

  const renderOutput = (result: ExecutionResult) => {
    const timestamp = result.timestamp || new Date();
    // const hasError = result.run.stderr || result.run.code !== 0;
    const messageColor = getMessageColor(result.type);

    return (
      <div key={timestamp.getTime()} className="mb-2 border-b">
        <div className="flex">
          <span className="mr-4 text-muted-foreground">
            [{formatTimestamp(timestamp)}]
          </span>
          <div className="flex-1">
            {/* Show language and version info */}
            {result.type === 'output' && (
              <div className="text-muted-foreground">
                Running {result.language} v{result.version}
              </div>
            )}

            {/* Show stdout if exists */}
            {result.run.stdout && (
              <div
                className={cn('whitespace-pre-wrap break-all', messageColor)}
              >
                {result.run.stdout}
              </div>
            )}

            {/* Show stderr if exists */}
            {result.run.stderr && (
              <div className="whitespace-pre-wrap break-all text-red-500">
                Error: {result.run.stderr}
              </div>
            )}

            {/* Show exit code if not 0 */}
            {result.run.code !== 0 && (
              <div className="text-red-500">
                Process exited with code {result.run.code}
              </div>
            )}

            {/* Show execution time if available */}
            {'executionTime' in result && result.type !== 'info' && (
              <div className="mt-1 text-xs text-muted-foreground">
                Execution time: {formatExecutionTime(result.executionTime ?? 0)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
        {results.map((result) => renderOutput(result))}
      </div>
    </div>
  );
};

export { Terminal };
