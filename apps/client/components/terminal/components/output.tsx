/**
 * Terminal output component that displays execution results.
 * Features:
 * - Timestamped output
 * - Color-coded messages
 * - Execution time and memory display
 * - Error output handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ExecutionResult } from "@codex/types/terminal";

import { cn } from "@/lib/utils";

import {
  describeExit,
  formatExecutionDetails,
  formatTimestamp,
  getMessageColor,
} from "../utils";

interface OutputProps {
  result: ExecutionResult;
}

const Output = ({ result }: OutputProps) => {
  const timestamp = new Date(result.timestamp ?? Date.now());
  const messageColor = getMessageColor(result.type);
  const language = String(result.language);
  const exit = describeExit(result);

  return (
    <div>
      <div className="flex">
        <span className="text-muted-foreground mr-4">
          [{formatTimestamp(timestamp)}]
        </span>
        <div className="flex-1">
          {result.type === "output" && (
            <div className="text-muted-foreground">
              {`${language.charAt(0).toUpperCase()}${language.slice(1)} v${result.version} (${formatExecutionDetails(result)})`}
            </div>
          )}

          {result.run.stdout && (
            <div className={cn("break-all whitespace-pre-wrap", messageColor)}>
              {result.run.stdout}
            </div>
          )}

          {result.run.stderr && (
            <div className="break-all whitespace-pre-wrap text-red-500">
              Error: {result.run.stderr}
            </div>
          )}

          {exit && <div className="text-red-500">{exit}</div>}
        </div>
      </div>
    </div>
  );
};

export { Output };
