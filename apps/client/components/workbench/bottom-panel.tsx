/**
 * The panel below the editor, with the shared terminal and the problems the
 * editor finds in the code.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { ExecutionResult } from "@codex/types/terminal";
import {
  DownloadSimpleIcon,
  InfoIcon,
  TrashIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import type * as monacoEditor from "monaco-editor";
import { type Dispatch, memo, type SetStateAction } from "react";

import { Terminal } from "@/components/terminal";
import { handleDownloadLogs } from "@/components/terminal/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RoomFile } from "@/lib/realtime/room-files";

import { FileIcon } from "./file-icon";

import { PANEL_TAB_CLASS, PANEL_TAB_LIST_CLASS } from "./tab-styles";
import { isPanelView } from "./types";
import { MARKER_SEVERITY, type Problem, useProblems } from "./use-editor-state";
import { WorkbenchAction } from "./view-header";
import { useWorkbench } from "./workbench-provider";

type Marker = monacoEditor.editor.IMarker;

const SeverityIcon = ({ severity }: { severity: number }) => {
  if (severity === MARKER_SEVERITY.error) {
    return (
      <XCircleIcon
        aria-label="Error"
        className="size-4 shrink-0 text-red-500"
      />
    );
  }
  if (severity === MARKER_SEVERITY.warning) {
    return (
      <WarningIcon
        aria-label="Warning"
        className="size-4 shrink-0 text-yellow-500"
      />
    );
  }
  return (
    <InfoIcon aria-label="Info" className="size-4 shrink-0 text-sky-500" />
  );
};

const getCode = ({ code }: Marker) =>
  typeof code === "string" ? code : code?.value;

interface ProblemsViewProps {
  files: RoomFile[];
  onSelect: (problem: Problem) => void;
  problems: Problem[];
}

// Grouped under each file, in the same order as the Explorer
const ProblemsView = ({ files, onSelect, problems }: ProblemsViewProps) => {
  if (problems.length === 0) {
    return (
      <p className="text-wb-muted px-5 py-2 text-xs">
        No problems have been detected in the room's files.
      </p>
    );
  }

  const groups = files
    .map((file) => ({
      file,
      problems: problems.filter(({ fileId }) => fileId === file.id),
    }))
    .filter((group) => group.problems.length > 0);

  return (
    <ul className="h-full overflow-y-auto py-1 text-[13px]">
      {groups.map((group) => (
        <li key={group.file.id}>
          <div className="flex items-center gap-1.5 px-5 py-0.5">
            <FileIcon languageId={group.file.language} />
            <span>{group.file.name}</span>
            <span className="bg-wb-active flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]">
              {group.problems.length}
            </span>
          </div>
          <ul>
            {group.problems.map((problem) => {
              const { marker } = problem;
              const code = getCode(marker);
              return (
                <li
                  key={`${marker.owner}-${marker.startLineNumber}-${marker.startColumn}-${marker.message}`}
                >
                  <button
                    className="hover:bg-wb-hover focus-visible:bg-wb-active flex w-full items-start gap-2 py-0.5 pr-5 pl-10 text-left outline-none"
                    onClick={() => onSelect(problem)}
                    type="button"
                  >
                    <SeverityIcon severity={marker.severity} />
                    <span className="min-w-0 flex-1 whitespace-pre-wrap">
                      {marker.message}{" "}
                      <span className="text-wb-muted">
                        {marker.source ?? marker.owner}
                        {code && `(${code})`} [Ln {marker.startLineNumber}, Col{" "}
                        {marker.startColumn}]
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
};

const MemoizedTerminal = memo(Terminal);

interface BottomPanelProps {
  results: ExecutionResult[];
  setResults: Dispatch<SetStateAction<ExecutionResult[]>>;
}

export const BottomPanel = ({ results, setResults }: BottomPanelProps) => {
  const { files, layout, monaco, setPartOpen, showPanelView } = useWorkbench();
  const problems = useProblems(files.fileModels, monaco);

  const revealProblem = ({ fileId, marker }: Problem) =>
    files.revealInFile(fileId, {
      endColumn: marker.endColumn,
      endLineNumber: marker.endLineNumber,
      startColumn: marker.startColumn,
      startLineNumber: marker.startLineNumber,
    });

  return (
    <Tabs
      className="bg-wb-chrome text-wb-fg border-wb-border h-full gap-0 border-t"
      onValueChange={(value) => {
        if (isPanelView(value)) {
          showPanelView(value);
        }
      }}
      value={layout.panelView}
    >
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 pr-2 pl-5">
        <TabsList className={PANEL_TAB_LIST_CLASS} variant="line">
          <TabsTrigger className={PANEL_TAB_CLASS} value="terminal">
            Terminal
          </TabsTrigger>
          <TabsTrigger className={PANEL_TAB_CLASS} value="problems">
            Problems
            {problems.length > 0 && (
              <span className="bg-wb-active text-wb-fg flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tracking-normal">
                {problems.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-0.5">
          {layout.panelView === "terminal" && (
            <>
              <WorkbenchAction
                label="Download terminal logs"
                onClick={() => handleDownloadLogs(results)}
              >
                <DownloadSimpleIcon />
              </WorkbenchAction>
              <WorkbenchAction
                label="Clear terminal"
                onClick={() => setResults([])}
              >
                <TrashIcon />
              </WorkbenchAction>
            </>
          )}
          <WorkbenchAction
            label="Close Panel"
            onClick={() => setPartOpen("isPanelOpen", false)}
          >
            <XIcon />
          </WorkbenchAction>
        </div>
      </div>
      {/* Kept mounted so the terminal keeps its scroll position */}
      <TabsContent className="min-h-0" keepMounted value="terminal">
        <MemoizedTerminal results={results} />
      </TabsContent>
      <TabsContent className="min-h-0" value="problems">
        <ProblemsView
          files={files.files}
          onSelect={revealProblem}
          problems={problems}
        />
      </TabsContent>
    </Tabs>
  );
};
