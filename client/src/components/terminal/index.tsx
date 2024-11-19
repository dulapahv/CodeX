import React, { useEffect, useRef } from 'react';
import { GeistMono } from 'geist/font/mono';

import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

import type { ExecutionResult } from './types';

interface TerminalProps {
  results: ExecutionResult[];
}

const Terminal = ({ results }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

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
    });
  };

  const renderWelcome = () => (
    <div className="space-y-2 whitespace-pre-wrap font-mono text-sm">
      <div className="text-green-500">
        ✨ Welcome to {SITE_NAME}
        {'\n'}
        ================================
      </div>
      <div className="text-gray-400">
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

  const renderOutput = (result: ExecutionResult) => {
    const timestamp = result.timestamp || new Date();
    const hasError = result.run.stderr || result.run.code !== 0;

    return (
      <div
        key={timestamp.getTime()}
        className={cn(GeistMono.className, 'text-sm')}
      >
        <div className="flex">
          <span className="mr-4 text-gray-500">
            [{formatTimestamp(timestamp)}]
          </span>
          <div className="flex-1">
            {/* Show language and version info */}
            <div className="text-gray-400">
              Running {result.language} v{result.version}
            </div>

            {/* Show stdout if exists */}
            {result.run.stdout && (
              <div className="whitespace-pre-wrap break-all">
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={terminalRef}
      className="h-full overflow-y-auto bg-background p-4 text-foreground"
    >
      <div className="space-y-2">
        {results.length === 0
          ? renderWelcome()
          : results.map((result) => renderOutput(result))}
      </div>
    </div>
  );
};

export { Terminal };
