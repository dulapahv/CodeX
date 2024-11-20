import type { ExecutionResult } from '@common/types/terminal';

import { cn } from '@/lib/utils';

import {
  formatExecutionTime,
  formatTimestamp,
  getHash,
  getMessageColor,
} from '../utils';

interface OutputProps {
  result: ExecutionResult;
}

const Output = ({ result }: OutputProps) => {
  const timestamp = new Date(result.timestamp ?? Date.now());
  const messageColor = getMessageColor(result.type);

  return (
    <div className="mb-2 border-b">
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

export { Output };
