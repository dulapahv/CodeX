/**
 * Room page component that provides collaborative coding environment.
 * Features:
 * - Real-time code synchronization
 * - Multi-cursor support
 * - VS Code-style title bar, activity bar, side bar, panel and status bar
 * - Room-based collaboration
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { ExecutionResult } from "@codex/types/terminal";
import type { User } from "@codex/types/user";
import type { Monaco } from "@monaco-editor/react";
import { XIcon } from "@phosphor-icons/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useParams, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";

import { CodeEditor } from "@/components/code-editor";
import { CodeEditorSkeleton } from "@/components/code-editor/components/editor-skeleton";
import { Notepad } from "@/components/notepad";
import { EditorSkeleton } from "@/components/notepad/components/editor-skeleton";
import { PreviewTabs } from "@/components/preview-tabs";
import { RemotePointers } from "@/components/remote-pointers";
import { StatusBar } from "@/components/status-bar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WebcamStream } from "@/components/webcam-stream";
import { CallProvider } from "@/components/webcam-stream/call-provider";
import { ActivityBar } from "@/components/workbench/activity-bar";
import { BottomPanel } from "@/components/workbench/bottom-panel";
import { EditorEmptyState } from "@/components/workbench/editor-empty-state";
import { EditorTitle } from "@/components/workbench/editor-title";
import { FileDropZone } from "@/components/workbench/file-drop-zone";
import { layoutStorage } from "@/components/workbench/layout-storage";
import { LivePreviewPane } from "@/components/workbench/live-preview-pane";
import { SideBar } from "@/components/workbench/side-bar";
import { TitleBar } from "@/components/workbench/title-bar";
import {
  ViewHeader,
  WorkbenchAction,
} from "@/components/workbench/view-header";
import {
  type LayoutToggle,
  useWorkbench,
  WorkbenchProvider,
} from "@/components/workbench/workbench-provider";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ROOM_ENDED_KEY } from "@/lib/constants";
import { initEditorTheme } from "@/lib/init-editor-theme";
import {
  connectToRoom,
  type RoomConnection,
} from "@/lib/realtime/room-connection";
import {
  RoomProvider,
  useRoomMessage,
  useRoomUsers,
} from "@/lib/realtime/room-context";
import { hostKeys, seats } from "@/lib/realtime/room-tokens";
import { storage } from "@/lib/services/storage";
import { cn } from "@/lib/utils";

const DASH_PATTERN = /-/gu;

// VS Code's smallest sizes. The side parts keep their width in pixels as the
// window resizes, so only the editor grows and shrinks with it.
const SIDE_BAR_MIN_WIDTH = 170;
const PANEL_MIN_HEIGHT = 100;

const HANDLE_CLASS =
  "bg-wb-border after:z-10 after:transition-colors hover:after:bg-wb-accent data-[separator=active]:after:bg-wb-accent data-[separator=hover]:after:bg-wb-accent";

const MemoizedNotepad = memo(function MemoizedNotepadComponent() {
  return <Notepad />;
});

const MemoizedWebcamStream = memo(function MemoizedWebcamStreamComponent({
  users,
}: {
  users: User[];
}) {
  return <WebcamStream users={users} />;
});

// Opens and closes a panel with its part of the layout, and keeps the layout
// in step when someone drags the panel shut or open
const useLayoutPanel = (part: LayoutToggle) => {
  const { layout, setPartOpen } = useWorkbench();
  const panelRef = usePanelRef();
  const isShown = layout[part];

  useEffect(() => {
    if (isShown) {
      panelRef.current?.expand();
    } else {
      panelRef.current?.collapse();
    }
  }, [isShown, panelRef]);

  const onResize = useCallback(
    ({ asPercentage }: { asPercentage: number }) =>
      setPartOpen(part, asPercentage > 0),
    [part, setPartOpen]
  );

  return { isShown, onResize, panelRef };
};

export default function Room() {
  const params = useParams();
  const roomId = String(params.roomId);
  const router = useRouter();
  const [connection, setConnection] = useState<RoomConnection | null>(null);

  useEffect(() => {
    const name = storage.getUsername();
    if (!name) {
      router.replace(`/?room=${roomId}`);
      return;
    }

    const id = roomId.replace(DASH_PATTERN, "").toUpperCase();
    const room = connectToRoom(id, name);
    storage.setUserId(String(room.clientId));
    setConnection(room);

    const stopListening = room.onEnd((reason) => {
      // The seat still holds after a lock or another tab taking over
      if (reason === "removed") {
        seats.forget(id);
      } else if (reason === "not-found" || reason === "terminated") {
        seats.forget(id);
        hostKeys.forget(id);
      }
      storage.clear();
      sessionStorage.setItem(ROOM_ENDED_KEY, reason);
      router.replace("/");
    });

    return () => {
      stopListening();
      room.destroy();
      setConnection(null);
    };
  }, [roomId, router]);

  return (
    <RoomProvider connection={connection}>
      <RoomWorkspace isConnected={connection !== null} roomId={roomId} />
    </RoomProvider>
  );
}

const RoomWorkspace = ({
  isConnected,
  roomId,
}: {
  isConnected: boolean;
  roomId: string;
}) => {
  useThemeColor();

  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [editor, setEditor] =
    useState<MonacoEditor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    initEditorTheme();
  }, []);

  return (
    <WorkbenchProvider editor={editor} monaco={monaco} roomId={roomId}>
      <Workbench
        isConnected={isConnected}
        onEditorMount={setEditor}
        onMonacoMount={setMonaco}
      />
    </WorkbenchProvider>
  );
};

interface WorkbenchProps {
  isConnected: boolean;
  onEditorMount: (editor: MonacoEditor.IStandaloneCodeEditor) => void;
  onMonacoMount: (monaco: Monaco) => void;
}

const Workbench = ({
  isConnected,
  onEditorMount,
  onMonacoMount,
}: WorkbenchProps) => {
  const { files, setPartOpen } = useWorkbench();
  const users = useRoomUsers();
  const [output, setOutput] = useState<ExecutionResult[]>([]);

  const mainSizes = useDefaultLayout({
    id: "codex-room-main",
    storage: layoutStorage,
  });
  const centerSizes = useDefaultLayout({
    id: "codex-room-center",
    storage: layoutStorage,
  });
  const editorSizes = useDefaultLayout({
    id: "codex-room-editor",
    storage: layoutStorage,
  });

  const sideBar = useLayoutPanel("isSideBarOpen");
  const preview = useLayoutPanel("isPreviewOpen");
  const panel = useLayoutPanel("isPanelOpen");
  const call = useLayoutPanel("isCallOpen");

  // History arrives on every (re)connect; only the first one seeds the
  // terminal, so output cleared locally stays cleared
  const hasHistoryRef = useRef(false);
  useRoomMessage("terminal-history", ({ results }) => {
    if (!hasHistoryRef.current) {
      hasHistoryRef.current = true;
      setOutput(results);
    }
  });
  useRoomMessage("terminal", ({ result }) => {
    setOutput((previous) => [...previous, result]);
  });

  const handleShareStarted = useCallback(
    () => setPartOpen("isPreviewOpen", true),
    [setPartOpen]
  );

  return (
    <main
      aria-label="Code Editor Workspace"
      className="bg-wb-chrome text-wb-fg flex h-full min-w-[821px] flex-col"
    >
      {isConnected && <RemotePointers />}
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        <CallProvider>
          <ResizablePanelGroup
            className="min-w-0 flex-1"
            defaultLayout={mainSizes.defaultLayout}
            onLayoutChanged={mainSizes.onLayoutChanged}
            orientation="horizontal"
          >
            <ResizablePanel
              collapsible
              defaultSize="20%"
              groupResizeBehavior="preserve-pixel-size"
              id="side-bar"
              minSize={SIDE_BAR_MIN_WIDTH}
              onResize={sideBar.onResize}
              panelRef={sideBar.panelRef}
            >
              <SideBar
                notepad={isConnected ? <MemoizedNotepad /> : <EditorSkeleton />}
              />
            </ResizablePanel>
            <ResizableHandle
              aria-label="Resize Handle"
              className={cn(HANDLE_CLASS, !sideBar.isShown && "hidden")}
            />

            <ResizablePanel defaultSize="65%" id="center" minSize="10%">
              <ResizablePanelGroup
                defaultLayout={centerSizes.defaultLayout}
                onLayoutChanged={centerSizes.onLayoutChanged}
                orientation="vertical"
              >
                <ResizablePanel
                  aria-label="Code Editor"
                  defaultSize="75%"
                  id="editor-area"
                  minSize="10%"
                  role="region"
                >
                  <ResizablePanelGroup
                    defaultLayout={editorSizes.defaultLayout}
                    onLayoutChanged={editorSizes.onLayoutChanged}
                    orientation="horizontal"
                  >
                    <ResizablePanel defaultSize="60%" id="editor" minSize="10%">
                      <div className="bg-wb-editor flex h-full flex-col">
                        <EditorTitle setOutput={setOutput} />
                        <FileDropZone
                          className="min-h-0 flex-1"
                          label="Drop files to add them to the room"
                        >
                          {isConnected && (
                            // Hidden until the room's files load, so nothing
                            // typed lands in the editor's empty starting file
                            <div
                              className={cn(
                                "size-full",
                                !files.fileModels && "invisible"
                              )}
                            >
                              <CodeEditor
                                editorRef={onEditorMount}
                                monacoRef={onMonacoMount}
                              />
                            </div>
                          )}
                          {!files.fileModels && (
                            <div className="absolute inset-0">
                              <CodeEditorSkeleton />
                            </div>
                          )}
                          {files.fileModels && !files.activeFile && (
                            <EditorEmptyState />
                          )}
                        </FileDropZone>
                      </div>
                    </ResizablePanel>
                    <ResizableHandle
                      aria-label="Resize Handle"
                      className={cn(HANDLE_CLASS, !preview.isShown && "hidden")}
                    />
                    <ResizablePanel
                      collapsible
                      defaultSize="40%"
                      id="preview"
                      minSize="10%"
                      onResize={preview.onResize}
                      panelRef={preview.panelRef}
                    >
                      <PreviewTabs onShareStarted={handleShareStarted}>
                        <LivePreviewPane />
                      </PreviewTabs>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
                <ResizableHandle
                  aria-label="Resize Handle"
                  className={cn(HANDLE_CLASS, !panel.isShown && "hidden")}
                />
                <ResizablePanel
                  aria-label="Terminal"
                  collapsible
                  defaultSize="25%"
                  groupResizeBehavior="preserve-pixel-size"
                  id="panel"
                  minSize={PANEL_MIN_HEIGHT}
                  onResize={panel.onResize}
                  panelRef={panel.panelRef}
                  role="region"
                >
                  <BottomPanel results={output} setResults={setOutput} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle
              aria-label="Resize Handle"
              className={cn(HANDLE_CLASS, !call.isShown && "hidden")}
            />
            <ResizablePanel
              aria-label="Webcam Stream"
              collapsible
              defaultSize="15%"
              groupResizeBehavior="preserve-pixel-size"
              id="call"
              minSize={SIDE_BAR_MIN_WIDTH}
              onResize={call.onResize}
              panelRef={call.panelRef}
              role="region"
            >
              <div className="bg-wb-chrome flex h-full flex-col">
                <ViewHeader title="Video Call">
                  <WorkbenchAction
                    label="Close Video Call"
                    onClick={() => setPartOpen("isCallOpen", false)}
                  >
                    <XIcon />
                  </WorkbenchAction>
                </ViewHeader>
                <div className="min-h-0 flex-1">
                  {isConnected && <MemoizedWebcamStream users={users} />}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CallProvider>
      </div>
      <StatusBar />
    </main>
  );
};
