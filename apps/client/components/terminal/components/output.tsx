/**
 * One entry in the shared terminal. A run shows a muted header with the
 * language and who ran it, the program's output, then how it ended. Notices
 * such as a stopped run are a single muted line.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ExecutionResult } from "@codex/types/terminal";

import { cn } from "@/lib/utils";

import {
  describeExit,
  formatTimestamp,
  getRunFooter,
  getRunTitle,
  isRunError,
  isRunOutput,
} from "../utils";

const OUTPUT_CLASS = "break-all whitespace-pre-wrap";

interface OutputProps {
  result: ExecutionResult;
}

const Output = ({ result }: OutputProps) => {
  const timestamp = formatTimestamp(new Date(result.timestamp ?? Date.now()));
  const { stderr, stdout } = result.run;
  const isRun = isRunOutput(result);
  const hasOutput = Boolean(stdout || stderr);

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground flex gap-3 pr-16 text-xs">
        <time className="shrink-0 tabular-nums">{timestamp}</time>
        <span className="min-w-0 truncate">{getRunTitle(result)}</span>
      </div>

      {isRun && stdout && <div className={OUTPUT_CLASS}>{stdout}</div>}
      {(isRun || isRunError(result)) && stderr && (
        <div className={cn(OUTPUT_CLASS, "text-red-500")}>{stderr}</div>
      )}
      {isRun && !hasOutput && (
        <div className="text-muted-foreground italic">No output</div>
      )}
      {isRun && (
        <div
          className={cn(
            "text-xs",
            describeExit(result) ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {getRunFooter(result)}
        </div>
      )}
    </div>
  );
};

export { Output };
