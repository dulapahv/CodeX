/**
 * Terminal output component that displays execution results.
 * Features:
 * - Timestamped output
 * - Color-coded messages
 * - Execution time display
 * - Error output handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ExecutionResult } from '@codex/types/terminal';

import { cn } from '@/lib/utils';

import {
  formatExecutionTime,
  formatTimestamp,
  getMessageColor,
} from '../utils';

interface OutputProps {
  result: ExecutionResult;
}

const Output = ({ result }: OutputProps) => {
  const timestamp = new Date(result.timestamp ?? Date.now());
  const messageColor = getMessageColor(result.type);

  return (
    <div>
      <div className="flex">
        <span className="text-muted-foreground mr-4">
          [{formatTimestamp(timestamp)}]
        </span>
        <div className="flex-1">
          {result.type === 'output' && (
            <div className="text-muted-foreground">
              {`${String(result.language).charAt(0).toUpperCase() + String(result.language).slice(1)} v${result.version} (${'executionTime' in result && formatExecutionTime(result.executionTime ?? 0)})`}
            </div>
          )}

          {result.run.stdout && (
            <div className={cn('whitespace-pre-wrap break-all', messageColor)}>
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
        </div>
      </div>
    </div>
  );
};

export { Output };
