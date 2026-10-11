/**
 * Run button component for code execution control.
 * Features:
 * - Code execution triggering
 * - Execution cancellation
 * - Args/stdin input handling
 * - Status indication
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ExecutionResult } from "@codex/types/terminal";
import type { Monaco } from "@monaco-editor/react";
import { OctagonX, Play } from "lucide-react";
import type * as monaco from "monaco-editor";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePresenceSelector, useRoom } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { AboutPopover } from "./components/about-popover";
import { ArgsInputPopover } from "./components/args-stdin-popover";
import { cancelExecution, executeCode, type RunReporter } from "./utils";

interface RunButtonProps {
  className?: string;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
}

const RunButton = ({
  monaco,
  editor,
  setOutput,
  className,
}: RunButtonProps) => {
  const room = useRoom();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLocalRunning, setIsLocalRunning] = useState(false);
  const [args, setArgs] = useState<string[]>([]);
  const [stdin, setStdin] = useState("");

  // Only the person running can cancel; everyone else waits for them
  const isOtherRunning = usePresenceSelector(
    (states) =>
      [...states].some(
        ([clientId, state]) => clientId !== room.clientId && state.running
      ),
    Object.is
  );
  const isRunning = isLocalRunning || isOtherRunning;

  const reporter: RunReporter = {
    report: (result) => {
      setOutput((previous) => [...previous, result]);
      room.send({ type: "terminal", result });
    },
    setRunning: (running) => {
      setIsLocalRunning(running);
      room.setPresence({ running });
    },
  };

  return (
    <div className="flex items-center gap-1">
      <div className="animate-fade-in-top">
        <Button
          aria-busy={isRunning}
          aria-label={(() => {
            if (isLocalRunning) {
              return "Cancel execution";
            }
            return isOtherRunning ? "Code is running" : "Run code";
          })()}
          className={cn(
            "hover:!opacity-80 disabled:!opacity-50 h-7 bg-[color:var(--toolbar-accent)] bg-clip-border px-2 py-0 text-[color:var(--panel-text-accent)] transition-opacity hover:bg-[color:var(--toolbar-accent)]",
            isRunning && "bg-red-600 hover:bg-red-700",
            className
          )}
          disabled={!editor || (isOtherRunning && !isLocalRunning)}
          onClick={
            isLocalRunning
              ? () => cancelExecution(abortControllerRef, reporter)
              : () =>
                  executeCode(
                    monaco,
                    editor,
                    reporter,
                    abortControllerRef,
                    args,
                    stdin
                  )
          }
        >
          {isRunning ? (
            <>
              <OctagonX aria-hidden="true" className="size-4" />
              <span className="hidden sm:flex">Cancel</span>
            </>
          ) : (
            <>
              <Play aria-hidden="true" className="size-4 fill-green-600" />
              <span className="hidden sm:flex">Run Code</span>
            </>
          )}
        </Button>

        <ArgsInputPopover
          disabled={isRunning || !editor}
          onArgsChange={setArgs}
          onStdinChange={setStdin}
        />
      </div>

      <AboutPopover />
    </div>
  );
};

export { RunButton };
