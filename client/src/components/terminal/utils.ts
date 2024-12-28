import { ExecutionResultType } from '@common/types/terminal';

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
