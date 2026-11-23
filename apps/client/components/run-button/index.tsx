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
import { PlayIcon, StopCircleIcon } from "@phosphor-icons/react";
import type * as monacoEditor from "monaco-editor";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  usePresenceSelector,
  useRoom,
  useRoomAccess,
} from "@/lib/realtime/room-context";
import {
  getFileText,
  type RoomFile,
  readFiles,
} from "@/lib/realtime/room-files";
import { cn } from "@/lib/utils";

import { AboutPopover } from "./components/about-popover";
import { ArgsInputPopover } from "./components/args-stdin-popover";
import {
  cancelExecution,
  executeCode,
  type RunFiles,
  type RunReporter,
} from "./utils";

const VIEWER_RUN_LABEL = "Viewers can't run code";

interface RunButtonProps {
  className?: string;
  editor: monacoEditor.editor.IStandaloneCodeEditor | null;
  /** The file that runs, with the room's other files beside it */
  file: RoomFile;
  monaco: Monaco | null;
  /** Called as a run starts, to bring up the terminal */
  onRun?: () => void;
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
}

const RunButton = ({
  monaco,
  editor,
  file,
  onRun,
  setOutput,
  className,
}: RunButtonProps) => {
  const room = useRoom();
  // The room keeps a viewer's runs to themselves, so they can't run at all
  const { canEdit } = useRoomAccess();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLocalRunning, setIsLocalRunning] = useState(false);
  const [args, setArgs] = useState<string[]>([]);
  const [stdin, setStdin] = useState("");
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const update = () => setIsEditorEmpty(!editor.getValue().trim());
    update();
    const contentChange = editor.onDidChangeModelContent(update);
    const modelChange = editor.onDidChangeModel(update);
    return () => {
      contentChange.dispose();
      modelChange.dispose();
    };
  }, [editor]);

  const userName = usePresenceSelector(
    (states) => states.get(room.clientId)?.user?.name,
    Object.is
  );

  // Only the person running can cancel, everyone else waits for them
  const isOtherRunning = usePresenceSelector(
    (states) =>
      [...states].some(
        ([clientId, state]) => clientId !== room.clientId && state.running
      ),
    Object.is
  );
  const isRunning = isLocalRunning || isOtherRunning;

  // Read at the moment of running, so it's the code as it is now
  const getRunFiles = (): RunFiles => {
    const toRunFile = (roomFile: RoomFile) => ({
      content: getFileText(room.doc, roomFile.id)?.toString() ?? "",
      language: roomFile.language,
      name: roomFile.name,
    });
    return {
      entry: toRunFile(file),
      others: readFiles(room.doc)
        .filter(({ id }) => id !== file.id)
        .map(toRunFile),
    };
  };

  const reporter: RunReporter = {
    report: (result) => {
      const signed = { ...result, runBy: userName };
      setOutput((previous) => [...previous, signed]);
      room.send({ result: signed, type: "terminal" });
    },
    setRunning: (running) => {
      if (running) {
        onRun?.();
      }
      setIsLocalRunning(running);
      room.setPresence({ running });
    },
  };

  return (
    <div className="flex items-center gap-0.5">
      <div className="flex items-center">
        <Button
          aria-busy={isRunning}
          aria-label={(() => {
            if (isLocalRunning) {
              return "Cancel execution";
            }
            if (!canEdit) {
              return VIEWER_RUN_LABEL;
            }
            return isOtherRunning ? "Code is running" : "Run code";
          })()}
          className={cn(
            "text-wb-fg hover:bg-wb-hover hover:text-wb-fg h-6 gap-1 px-1.5 text-xs font-normal",
            isRunning && "text-red-500 hover:text-red-500",
            className
          )}
          disabled={
            !editor ||
            (!isLocalRunning && (isOtherRunning || isEditorEmpty || !canEdit))
          }
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
                    stdin,
                    getRunFiles()
                  )
          }
          title={canEdit ? undefined : VIEWER_RUN_LABEL}
          variant="ghost"
        >
          {isRunning ? (
            <>
              <StopCircleIcon aria-hidden="true" className="size-4" />
              Cancel
            </>
          ) : (
            <>
              <PlayIcon
                aria-hidden="true"
                className="size-4 text-green-500"
                weight="fill"
              />
              Run Code
            </>
          )}
        </Button>

        <ArgsInputPopover
          disabled={isRunning || !editor || !canEdit}
          onArgsChange={setArgs}
          onStdinChange={setStdin}
        />
      </div>

      <AboutPopover />
    </div>
  );
};

export { RunButton };
