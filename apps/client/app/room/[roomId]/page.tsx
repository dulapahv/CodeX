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

import { CodeServiceMsg, RoomServiceMsg } from "@codex/types/message";
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
  useState,
} from "react";
import { usePanelRef } from "react-resizable-panels";
import { useDebounce } from "use-debounce";

import { CodeEditor } from "@/components/code-editor";
import { FollowUser } from "@/components/follow-user";
import { LeaveButton } from "@/components/leave-button";
import { LivePreview } from "@/components/live-preview";
import { Notepad } from "@/components/notepad";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import { UserList } from "@/components/user-list";
import { WebcamStream } from "@/components/webcam-stream";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ROOM_TERMINATED_KEY } from "@/lib/constants";
import { initEditorTheme } from "@/lib/init-editor-theme";
import { storage } from "@/lib/services/storage";
import { userMap } from "@/lib/services/user-map";
import { getSocket } from "@/lib/socket";
import { cn, leaveRoom } from "@/lib/utils";

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

const MemoizedNotepad = memo(function MemoizedNotepad({
  markdown,
}: {
  markdown: string;
}) {
  return <Notepad markdown={markdown} />;
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

const useTogglePanel = (isReady: boolean, isShown: boolean) => {
  const panelRef = usePanelRef();
  const visible = isReady && isShown;

  useEffect(() => {
    if (visible) {
      panelRef.current?.expand();
    } else {
      panelRef.current?.collapse();
    }
  }, [visible, panelRef]);

  return panelRef;
};

export default function Room() {
  const params = useParams();
  const roomId = String(params.roomId);
  const router = useRouter();
  const socket = getSocket();
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

  const [users, setUsers] = useState<User[]>([]);
  const [mdContent, setMdContent] = useState<string | null>(null);
  const [output, setOutput] = useState<ExecutionResult[]>([]);
  const isEditorReady = Boolean(monaco && editor);
  const notepadPanelRef = useTogglePanel(isEditorReady, showNotepad);
  const livePreviewPanelRef = useTogglePanel(isEditorReady, showLivePreview);
  const terminalPanelRef = useTogglePanel(isEditorReady, showTerminal);
  const webcamPanelRef = useTogglePanel(isEditorReady, showWebcam);

  const disconnect = useCallback(() => {
    leaveRoom();
    socket.disconnect();
  }, [socket]);

  // Memoized socket event handlers
  const handleUsersUpdate = useCallback((usersDict: Record<string, string>) => {
    userMap.clear();
    userMap.addBulk(usersDict);
    setUsers(userMap.getAll());
  }, []);

  const handleMarkdownReceive = useCallback((md: string) => {
    setMdContent(md);
  }, []);

  const handleTerminalReceive = useCallback((result: ExecutionResult) => {
    setOutput((prev) => [...prev, result]);
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      router.replace(`/?room=${roomId}`);
    }

    // The code editor runs its own CRDT handshake, so only users and notes
    // are fetched here.
    const syncRoom = () => {
      socket.emit(RoomServiceMsg.SYNC_USERS);
      socket.emit(RoomServiceMsg.SYNC_MD);
    };
    syncRoom();

    // The server drops a disconnected socket from its room, so join again.
    // Emits made on `reconnect` are flushed before any `connect` listener runs.
    const handleReconnect = () => {
      const username = storage.getUsername();
      if (username) {
        socket.emit(RoomServiceMsg.JOIN, roomId, username);
      }
    };

    const handleRejoin = (customId: string) => {
      storage.setUserId(customId);
      syncRoom();
      socket.emit(CodeServiceMsg.SYNC_LANG);
    };

    const handleTerminate = () => {
      storage.clear();
      sessionStorage.setItem(ROOM_TERMINATED_KEY, "1");
      router.replace("/");
    };

    socket.io.on("reconnect", handleReconnect);
    socket.on(RoomServiceMsg.JOIN, handleRejoin);
    socket.on(RoomServiceMsg.NOT_FOUND, handleTerminate);
    socket.on(RoomServiceMsg.SYNC_USERS, handleUsersUpdate);
    socket.on(RoomServiceMsg.UPDATE_MD, handleMarkdownReceive);
    socket.on(CodeServiceMsg.UPDATE_TERM, handleTerminalReceive);
    socket.on(RoomServiceMsg.TERMINATE, handleTerminate);

    window.addEventListener("popstate", disconnect);

    initEditorTheme();

    return () => {
      window.removeEventListener("popstate", disconnect);
      socket.io.off("reconnect", handleReconnect);
      socket.off(RoomServiceMsg.JOIN, handleRejoin);
      socket.off(RoomServiceMsg.NOT_FOUND, handleTerminate);
      socket.off(RoomServiceMsg.SYNC_USERS, handleUsersUpdate);
      socket.off(RoomServiceMsg.UPDATE_MD, handleMarkdownReceive);
      socket.off(CodeServiceMsg.UPDATE_TERM, handleTerminalReceive);
      socket.off(RoomServiceMsg.TERMINATE, handleTerminate);
      userMap.clear();
    };
  }, [
    disconnect,
    roomId,
    router,
    socket,
    handleUsersUpdate,
    handleMarkdownReceive,
    handleTerminalReceive,
  ]);

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
      <RemotePointers />
      <div
        aria-label="Editor Controls"
        className="h-9 flex-shrink-0"
        role="toolbar"
      >
        {monaco && editor && (
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
        )}
      </div>
      {mdContent !== null ? (
        <ResizablePanelGroup
          className="!h-[calc(100%-54px)]"
          orientation="horizontal"
        >
          <ResizablePanel
            aria-label="Notepad"
            className={cn(
              "animate-fade-in-left [&>div]:h-full",
              isEditorReady && "border-muted-foreground border-t"
            )}
            collapsible
            defaultSize="20%"
            minSize="10%"
            panelRef={notepadPanelRef}
            role="region"
          >
            <MemoizedNotepad markdown={mdContent} />
          </ResizablePanel>
          <ResizableHandle
            aria-label="Resize Handle"
            className={cn(
              "bg-muted-foreground",
              !isEditorReady && "hidden",
              !showNotepad && "hidden"
            )}
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
                  className={cn(
                    isEditorReady && "border-muted-foreground border-t"
                  )}
                  orientation="horizontal"
                >
                  <ResizablePanel defaultSize="60%" minSize="10%">
                    <CodeEditor
                      cursorPosition={setCursorPosition}
                      editorRef={handleEditorSetup}
                      monacoRef={handleMonacoSetup}
                      setCode={setCode}
                    />
                  </ResizablePanel>
                  <ResizableHandle
                    aria-label="Resize Handle"
                    className={cn(
                      "bg-muted-foreground",
                      !isEditorReady && "hidden",
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
                    {editor && (
                      <MemoizedLivePreview value={debouncedCode ?? ""} />
                    )}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle
                aria-label="Resize Handle"
                className={cn(
                  "bg-muted-foreground",
                  !isEditorReady && "hidden",
                  !showTerminal && "hidden"
                )}
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
            className={cn(
              "bg-muted-foreground",
              !isEditorReady && "hidden",
              !showWebcam && "hidden"
            )}
          />
          <ResizablePanel
            aria-label="Webcam Stream"
            className={cn(
              "animate-fade-in-right",
              isEditorReady && "border-muted-foreground border-t"
            )}
            collapsible
            defaultSize="15%"
            minSize="10%"
            panelRef={webcamPanelRef}
            role="region"
          >
            <MemoizedWebcamStream users={users} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        // biome-ignore lint/a11y/useSemanticElements: status div for loading indicator
        <div
          aria-live="polite"
          className="fixed top-0 left-0 flex size-full items-center justify-center p-2"
          role="status"
        >
          <Alert className="flex max-w-md gap-x-2 bg-background/50 backdrop-blur">
            <Spinner className="size-6" />
            <div>
              <AlertTitle>Loading session</AlertTitle>
              <AlertDescription>
                Loading your coding session. Please wait...
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
      {monaco && editor && (
        <MemoizedStatusBar
          cursorPosition={cursorPosition}
          editor={editor}
          monaco={monaco}
        />
      )}
    </main>
  );
}
