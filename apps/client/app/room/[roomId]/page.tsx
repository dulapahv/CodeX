/**
 * Room page component that provides collaborative coding environment.
 * Features:
 * - Real-time code synchronization
 * - Multi-cursor support
 * - Resizable panels for editor, terminal, preview
 * - Room-based collaboration
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { ExecutionResult } from "@codex/types/terminal";
import type { User } from "@codex/types/user";
import type { Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useParams, useRouter } from "next/navigation";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePanelRef } from "react-resizable-panels";
import { useDebounce } from "use-debounce";

import { CodeEditor } from "@/components/code-editor";
import { CodeEditorSkeleton } from "@/components/code-editor/components/editor-skeleton";
import { FollowUser } from "@/components/follow-user";
import { LeaveButton } from "@/components/leave-button";
import { LivePreview } from "@/components/live-preview";
import { Notepad } from "@/components/notepad";
import { EditorSkeleton } from "@/components/notepad/components/editor-skeleton";
import { RemotePointers } from "@/components/remote-pointers";
import { RunButton } from "@/components/run-button";
import { SettingsButton } from "@/components/settings-button";
import { ShareButton } from "@/components/share-button";
import {
  StatusBar,
  type StatusBarCursorPosition,
} from "@/components/status-bar";
import { Terminal } from "@/components/terminal";
import { Toolbar } from "@/components/toolbar";
import { ToolbarSkeleton } from "@/components/toolbar/components/toolbar-skeleton";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { UserList } from "@/components/user-list";
import { WebcamStream } from "@/components/webcam-stream";
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
import { storage } from "@/lib/services/storage";
import { cn } from "@/lib/utils";

const DASH_PATTERN = /-/g;

const MemoizedToolbar = memo(function MemoizedToolbar({
  monaco,
  editor,
  roomId,
  users,
  setOutput,
  showNotepad,
  showTerminal,
  showWebcam,
  showLivePreview,
  setShowNotepad,
  setShowTerminal,
  setShowWebcam,
  setShowLivePreview,
}: {
  monaco: Monaco;
  editor: MonacoEditor.IStandaloneCodeEditor;
  roomId: string;
  users: User[];
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
  showNotepad: boolean;
  showTerminal: boolean;
  showWebcam: boolean;
  showLivePreview: boolean;
  setShowNotepad: Dispatch<SetStateAction<boolean>>;
  setShowTerminal: Dispatch<SetStateAction<boolean>>;
  setShowWebcam: Dispatch<SetStateAction<boolean>>;
  setShowLivePreview: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div className="fixed flex w-full items-center justify-between gap-x-2 bg-[color:var(--toolbar-bg-secondary)] p-1">
      {/* biome-ignore lint/a11y/useSemanticElements: grouping toolbar controls without form semantics */}
      <div
        aria-label="Editor Toolbar"
        className="animate-fade-in-top"
        role="group"
      >
        <Toolbar
          editor={editor}
          monaco={monaco}
          setShowLivePreview={setShowLivePreview}
          setShowNotepad={setShowNotepad}
          setShowTerminal={setShowTerminal}
          setShowWebcam={setShowWebcam}
          showLivePreview={showLivePreview}
          showNotepad={showNotepad}
          showTerminal={showTerminal}
          showWebcam={showWebcam}
        />
      </div>
      <RunButton editor={editor} monaco={monaco} setOutput={setOutput} />
      <nav aria-label="Collaboration Tools">
        <div className="flex items-center gap-x-1 sm:gap-x-2">
          <UserList users={users} />
          <ShareButton roomId={roomId} />
          <FollowUser users={users} />
          <SettingsButton editor={editor} monaco={monaco} />
          <LeaveButton />
        </div>
      </nav>
    </div>
  );
});

const MemoizedNotepad = memo(function MemoizedNotepad() {
  return <Notepad />;
});

const MemoizedTerminal = memo(function MemoizedTerminal({
  results,
  setResults,
}: {
  results: ExecutionResult[];
  setResults: Dispatch<SetStateAction<ExecutionResult[]>>;
}) {
  return <Terminal results={results} setResults={setResults} />;
});

const MemoizedWebcamStream = memo(function MemoizedWebcamStream({
  users,
}: {
  users: User[];
}) {
  return <WebcamStream users={users} />;
});

const MemoizedLivePreview = memo(function MemoizedLivePreview({
  value,
}: {
  value: string;
}) {
  return <LivePreview value={value} />;
});

const MemoizedStatusBar = memo(function MemoizedStatusBar({
  monaco,
  editor,
  cursorPosition,
}: {
  monaco: Monaco;
  editor: MonacoEditor.IStandaloneCodeEditor;
  cursorPosition: StatusBarCursorPosition;
}) {
  return (
    <StatusBar
      cursorPosition={cursorPosition}
      editor={editor}
      monaco={monaco}
    />
  );
});

const useTogglePanel = (isShown: boolean) => {
  const panelRef = usePanelRef();

  useEffect(() => {
    if (isShown) {
      panelRef.current?.expand();
    } else {
      panelRef.current?.collapse();
    }
  }, [isShown, panelRef]);

  return panelRef;
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

    const room = connectToRoom(
      roomId.replace(DASH_PATTERN, "").toUpperCase(),
      name
    );
    storage.setUserId(String(room.clientId));
    setConnection(room);

    const stopListening = room.onEnd((reason) => {
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

  const [showNotepad, setShowNotepad] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [debouncedCode] = useDebounce(code, 300);
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [editor, setEditor] =
    useState<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const [cursorPosition, setCursorPosition] = useState<StatusBarCursorPosition>(
    {
      line: 1,
      column: 1,
      selected: 0,
    }
  );

  const users = useRoomUsers();
  const [output, setOutput] = useState<ExecutionResult[]>([]);
  const notepadPanelRef = useTogglePanel(showNotepad);
  const livePreviewPanelRef = useTogglePanel(showLivePreview);
  const terminalPanelRef = useTogglePanel(showTerminal);
  const webcamPanelRef = useTogglePanel(showWebcam);

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

  useEffect(() => {
    initEditorTheme();
  }, []);

  const handleMonacoSetup = useCallback((monacoInstance: Monaco) => {
    setMonaco(monacoInstance);
  }, []);

  const handleEditorSetup = useCallback(
    (editorInstance: MonacoEditor.IStandaloneCodeEditor) => {
      setEditor(editorInstance);
    },
    []
  );

  return (
    <main
      aria-label="Code Editor Workspace"
      className="flex h-full min-w-[821px] flex-col"
    >
      {isConnected && <RemotePointers />}
      <div
        aria-label="Editor Controls"
        className="h-9 flex-shrink-0"
        role="toolbar"
      >
        {monaco && editor ? (
          <MemoizedToolbar
            editor={editor}
            monaco={monaco}
            roomId={roomId || ""}
            setOutput={setOutput}
            setShowLivePreview={setShowLivePreview}
            setShowNotepad={setShowNotepad}
            setShowTerminal={setShowTerminal}
            setShowWebcam={setShowWebcam}
            showLivePreview={showLivePreview}
            showNotepad={showNotepad}
            showTerminal={showTerminal}
            showWebcam={showWebcam}
            users={users}
          />
        ) : (
          <ToolbarSkeleton />
        )}
      </div>
      <ResizablePanelGroup
        className="!h-[calc(100%-54px)]"
        orientation="horizontal"
      >
        <ResizablePanel
          aria-label="Notepad"
          className="animate-fade-in-left border-muted-foreground border-t bg-[color:var(--panel-background)] [&>div]:h-full"
          collapsible
          defaultSize="20%"
          minSize="10%"
          panelRef={notepadPanelRef}
          role="region"
        >
          {isConnected ? <MemoizedNotepad /> : <EditorSkeleton />}
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize Handle"
          className={cn("bg-muted-foreground", !showNotepad && "hidden")}
        />

        <ResizablePanel defaultSize="65%" minSize="10%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel
              aria-label="Code Editor"
              className="z-[1] animate-fade-in"
              defaultSize="75%"
              minSize="10%"
              role="region"
            >
              <ResizablePanelGroup
                className="border-muted-foreground border-t"
                orientation="horizontal"
              >
                <ResizablePanel defaultSize="60%" minSize="10%">
                  {isConnected ? (
                    <CodeEditor
                      cursorPosition={setCursorPosition}
                      editorRef={handleEditorSetup}
                      monacoRef={handleMonacoSetup}
                      setCode={setCode}
                    />
                  ) : (
                    <CodeEditorSkeleton />
                  )}
                </ResizablePanel>
                <ResizableHandle
                  aria-label="Resize Handle"
                  className={cn(
                    "bg-muted-foreground",
                    !showLivePreview && "hidden"
                  )}
                />
                <ResizablePanel
                  className={cn("animate-fade-in-right")}
                  collapsible
                  defaultSize="40%"
                  minSize="10%"
                  panelRef={livePreviewPanelRef}
                >
                  <MemoizedLivePreview value={debouncedCode ?? ""} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle
              aria-label="Resize Handle"
              className={cn("bg-muted-foreground", !showTerminal && "hidden")}
            />
            <ResizablePanel
              aria-label="Terminal"
              className={cn("animate-fade-in-bottom")}
              collapsible
              defaultSize="25%"
              minSize="10%"
              panelRef={terminalPanelRef}
              role="region"
            >
              <MemoizedTerminal results={output} setResults={setOutput} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize Handle"
          className={cn("bg-muted-foreground", !showWebcam && "hidden")}
        />
        <ResizablePanel
          aria-label="Webcam Stream"
          className="animate-fade-in-right border-muted-foreground border-t"
          collapsible
          defaultSize="15%"
          minSize="10%"
          panelRef={webcamPanelRef}
          role="region"
        >
          {isConnected && <MemoizedWebcamStream users={users} />}
        </ResizablePanel>
      </ResizablePanelGroup>
      {monaco && editor ? (
        <MemoizedStatusBar
          cursorPosition={cursorPosition}
          editor={editor}
          monaco={monaco}
        />
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 h-6 bg-[color:var(--toolbar-bg-primary)]"
        />
      )}
    </main>
  );
};
