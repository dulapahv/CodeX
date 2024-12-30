'use client';

import {
  memo,
  use,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Monaco } from '@monaco-editor/react';
import { LoaderCircle } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { CodeServiceMsg, RoomServiceMsg } from '@common/types/message';
import type { ExecutionResult } from '@common/types/terminal';
import type { User } from '@common/types/user';

import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { cn, leaveRoom } from '@/lib/utils';
import { CodeEditor } from '@/components/code-editor';
import { FollowUser } from '@/components/follow-user';
import { LeaveButton } from '@/components/leave-button';
import { LivePreview } from '@/components/live-preview';
import { Notepad } from '@/components/notepad';
import { RemotePointers } from '@/components/remote-pointers';
import { RunButton } from '@/components/run-button';
import { SettingsButton } from '@/components/settings-button';
import { ShareButton } from '@/components/share-button';
import {
  StatusBar,
  type StatusBarCursorPosition,
} from '@/components/status-bar';
import { Terminal } from '@/components/terminal';
import { Toolbar } from '@/components/toolbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { UserList } from '@/components/user-list';
import { WebcamStream } from '@/components/webcam-stream';

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
  editor: monaco.editor.IStandaloneCodeEditor;
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
    <div className="flex items-center justify-between gap-x-2 bg-[color:var(--toolbar-bg-secondary)] p-1">
      <div
        className="animate-fade-in-top"
        role="group"
        aria-label="Editor Toolbar"
      >
        <Toolbar
          monaco={monaco}
          editor={editor}
          setShowNotepad={setShowNotepad}
          setShowTerminal={setShowTerminal}
          setShowWebcam={setShowWebcam}
          setShowLivePreview={setShowLivePreview}
          showNotepad={showNotepad}
          showTerminal={showTerminal}
          showWebcam={showWebcam}
          showLivePreview={showLivePreview}
        />
      </div>
      <RunButton monaco={monaco} editor={editor} setOutput={setOutput} />
      <nav aria-label="Collaboration Tools">
        <div className="flex items-center gap-x-2">
          <UserList users={users} />
          <ShareButton roomId={roomId} />
          <FollowUser users={users} />
          <SettingsButton monaco={monaco} editor={editor} />
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
  editor: monaco.editor.IStandaloneCodeEditor;
  cursorPosition: StatusBarCursorPosition;
}) {
  return (
    <StatusBar
      monaco={monaco}
      editor={editor}
      cursorPosition={cursorPosition}
    />
  );
});

interface SearchParamsProps {
  roomId: string;
}

export default function Room(props: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const { roomId } = use(props.searchParams);
  const router = useRouter();
  const socket = getSocket();

  const [showNotepad, setShowNotepad] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [cursorPosition, setCursorPosition] = useState<StatusBarCursorPosition>(
    {
      line: 1,
      column: 1,
      selected: 0,
    },
  );

  const [users, setUsers] = useState<User[]>([]);
  const [defaultCode, setDefaultCode] = useState<string | null>(null);
  const [mdContent, setMdContent] = useState<string | null>(null);
  const [output, setOutput] = useState<ExecutionResult[]>([]);

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

  const handleCodeReceive = useCallback((code: string) => {
    setDefaultCode(code);
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

    socket.emit(RoomServiceMsg.SYNC_USERS);
    socket.emit(CodeServiceMsg.SYNC_CODE);
    socket.emit(RoomServiceMsg.SYNC_MD);

    socket.on(RoomServiceMsg.SYNC_USERS, handleUsersUpdate);
    socket.on(CodeServiceMsg.SYNC_CODE, handleCodeReceive);
    socket.on(RoomServiceMsg.UPDATE_MD, handleMarkdownReceive);
    socket.on(CodeServiceMsg.UPDATE_TERM, handleTerminalReceive);

    window.addEventListener('popstate', disconnect);

    return () => {
      window.removeEventListener('popstate', disconnect);
      socket.off(RoomServiceMsg.SYNC_USERS);
      socket.off(CodeServiceMsg.SYNC_CODE);
      socket.off(CodeServiceMsg.UPDATE_LANG);
      socket.off(RoomServiceMsg.UPDATE_MD);
      socket.off(CodeServiceMsg.UPDATE_TERM);
      userMap.clear();
    };
  }, [
    disconnect,
    roomId,
    router,
    socket,
    handleUsersUpdate,
    handleCodeReceive,
    handleMarkdownReceive,
    handleTerminalReceive,
  ]);

  const handleMonacoSetup = useCallback((monacoInstance: Monaco) => {
    setMonaco(monacoInstance);
  }, []);

  const handleEditorSetup = useCallback(
    (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
      setEditor(editorInstance);
    },
    [],
  );

  return (
    <main
      className="flex h-full min-w-[500px] flex-col overflow-clip"
      aria-label="Code Editor Workspace"
    >
      <RemotePointers />
      <div className="h-9" role="toolbar" aria-label="Editor Controls">
        {monaco && editor && (
          <MemoizedToolbar
            monaco={monaco}
            editor={editor}
            roomId={roomId || ''}
            setOutput={setOutput}
            users={users}
            setShowNotepad={setShowNotepad}
            setShowTerminal={setShowTerminal}
            setShowWebcam={setShowWebcam}
            setShowLivePreview={setShowLivePreview}
            showNotepad={showNotepad}
            showTerminal={showTerminal}
            showWebcam={showWebcam}
            showLivePreview={showLivePreview}
          />
        )}
      </div>
      {defaultCode !== null && mdContent !== null ? (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className={cn(
              'h-[calc(100%-24px)] animate-fade-in-left [&>div]:h-full',
              monaco && editor && 'border-t border-muted-foreground',
              (!monaco || !editor) && 'hidden',
              !showNotepad && 'hidden',
            )}
            role="region"
            aria-label="Notepad"
            collapsible
            minSize={10}
            defaultSize={20}
          >
            <MemoizedNotepad markdown={mdContent} />
          </ResizablePanel>
          <ResizableHandle
            className={cn(
              'bg-muted-foreground',
              (!monaco || !editor) && 'hidden',
              !showNotepad && 'hidden',
            )}
          />

          <ResizablePanel defaultSize={65} minSize={10}>
            <ResizablePanelGroup
              direction="vertical"
              className="!h-[calc(100%-24px)] overflow-clip"
            >
              <ResizablePanel
                className="z-[1] animate-fade-in"
                role="region"
                aria-label="Code Editor"
                defaultSize={75}
                minSize={10}
              >
                <ResizablePanelGroup
                  direction="horizontal"
                  className={cn(
                    monaco && editor && 'border-t border-muted-foreground',
                  )}
                >
                  <ResizablePanel defaultSize={60} minSize={10}>
                    <CodeEditor
                      monacoRef={handleMonacoSetup}
                      editorRef={handleEditorSetup}
                      cursorPosition={setCursorPosition}
                      defaultCode={defaultCode}
                      setCode={setCode}
                    />
                  </ResizablePanel>
                  <ResizableHandle
                    className={cn(
                      'bg-muted-foreground',
                      (!monaco || !editor) && 'hidden',
                      !showLivePreview && 'hidden',
                    )}
                  />
                  <ResizablePanel
                    defaultSize={40}
                    minSize={10}
                    collapsible
                    className={cn(
                      'animate-fade-in-right',
                      (!monaco || !editor) && 'hidden',
                      !showLivePreview && 'hidden',
                    )}
                  >
                    {editor && (
                      <MemoizedLivePreview value={code || defaultCode} />
                    )}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle
                className={cn(
                  'bg-muted-foreground',
                  (!monaco || !editor) && 'hidden',
                  !showTerminal && 'hidden',
                )}
              />
              <ResizablePanel
                className={cn(
                  'animate-fade-in-bottom',
                  (!monaco || !editor) && 'hidden',
                  !showTerminal && 'hidden',
                )}
                role="region"
                aria-label="Terminal"
                collapsible
                minSize={10}
                defaultSize={25}
              >
                <MemoizedTerminal results={output} setResults={setOutput} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle
            className={cn(
              'bg-muted-foreground',
              (!monaco || !editor) && 'hidden',
              !showWebcam && 'hidden',
            )}
          />
          <ResizablePanel
            className={cn(
              'h-[calc(100%-24px)] animate-fade-in-right',
              monaco && editor && 'border-t border-muted-foreground',
              (!monaco || !editor) && 'hidden',
              !showWebcam && 'hidden',
            )}
            role="region"
            aria-label="Webcam Stream"
            collapsible
            minSize={10}
            defaultSize={15}
          >
            <MemoizedWebcamStream users={users} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div
          className="fixed left-0 top-0 flex size-full items-center justify-center p-2"
          role="status"
          aria-live="polite"
        >
          <Alert className="max-w-md bg-background/50 backdrop-blur">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            <AlertTitle>Loading session</AlertTitle>
            <AlertDescription>
              Loading your coding session. Please wait...
            </AlertDescription>
          </Alert>
        </div>
      )}
      {monaco && editor && (
        <MemoizedStatusBar
          monaco={monaco}
          editor={editor}
          cursorPosition={cursorPosition}
        />
      )}
    </main>
  );
}
