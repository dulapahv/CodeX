/**
 * Utility functions for formatting terminal output.
 * Features:
 * - Execution time formatting
 * - Timestamp formatting
 * - Message type coloring
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  ExecutionResultType,
  type ExecutionResult,
} from '@codex/types/terminal';

export const formatExecutionTime = (ms: number) => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

export const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

export const getMessageColor = (type?: ExecutionResultType) => {
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

const formatLogEntry = (result: ExecutionResult): string => {
  const timestamp = formatTimestamp(result.timestamp ?? new Date());

  // Add execution details if available
  const executionDetails =
    result.language && result.version && result.executionTime
      ? ` - ${result.language} v${result.version} (${result.executionTime}ms)`
      : '';

  // For error messages
  if (result.run.stderr) {
    return `[${timestamp}]${executionDetails}\n${result.run.stdout || 'Error:'} ${result.run.stderr}${
      result.run.code ? `\nProcess exited with code ${result.run.code}` : ''
    }`;
  }

  // For regular output
  const message = result.run.stdout ? result.run.stdout.trimEnd() : 'No output';

  return `[${timestamp}]${executionDetails}\n${message}`;
};

export const handleDownloadLogs = (results: ExecutionResult[]) => {
  const logs = results.map(formatLogEntry).join('\n\n');

  const blob = new Blob([logs], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const now = new Date();
  const datePart = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const timePart = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  a.download = `codex-terminal-${datePart}--${timePart}.txt`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
