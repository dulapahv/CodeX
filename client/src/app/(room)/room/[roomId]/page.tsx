/**
 * Room page component that handles the collaborative code editing experience.
 * Manages room state, user connections, and code synchronization between clients.
 *
 * @remarks
 * This component:
 * - Establishes socket connection for real-time collaboration
 * - Renders Monaco editor with collaborative features
 * - Handles user presence/absence in the room
 * - Syncs code changes between connected users
 * - Provides toolbar controls and user interface elements
 * - Manages disconnection and cleanup when leaving room
 *
 * Uses the following services and components:
 * - [`userMap`](src/lib/services/user-map.ts) for managing connected users
 * - [`getSocket`](src/lib/socket.ts) for WebSocket connections
 * - [`MonacoEditor`](src/components/monaco/index.tsx) for code editing
 * - [`Toolbar`](src/components/toolbar/index.tsx) for editor controls
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import {
  Dispatch,
  memo,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Monaco } from '@monaco-editor/react';
import { LoaderCircle } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { isMobile } from 'react-device-detect';

import { CodeServiceMsg, RoomServiceMsg } from '@common/types/message';
import type { ExecutionResult } from '@common/types/terminal';
import type { User } from '@common/types/user';

import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { cn, leaveRoom } from '@/lib/utils';
import { LeaveButton } from '@/components/leave-button';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MonacoEditor } from '@/components/monaco';
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

interface RoomProps {
  params: {
    roomId: string;
  };
}

const MemoizedToolbar = memo(function MemoizedToolbar({
  monaco,
  editor,
  roomId,
  users,
  setOutput,
  showMarkdown,
  showTerminal,
  showWebcam,
  setShowMarkdown,
  setShowTerminal,
  setShowWebcam,
}: {
  monaco: Monaco;
  editor: monaco.editor.IStandaloneCodeEditor;
  roomId: string;
  users: User[];
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
  showMarkdown: boolean;
  showTerminal: boolean;
  showWebcam: boolean;
  setShowMarkdown: Dispatch<SetStateAction<boolean>>;
  setShowTerminal: Dispatch<SetStateAction<boolean>>;
  setShowWebcam: Dispatch<SetStateAction<boolean>>;
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
          setShowMarkdown={setShowMarkdown}
          setShowTerminal={setShowTerminal}
          setShowWebcam={setShowWebcam}
          showMarkdown={showMarkdown}
          showTerminal={showTerminal}
          showWebcam={showWebcam}
        />
      </div>
      <RunButton monaco={monaco} editor={editor} setOutput={setOutput} />
      <nav aria-label="Collaboration Tools">
        <div className="flex items-center gap-x-2">
          <UserList users={users} />
          <ShareButton roomId={roomId} />
          <SettingsButton monaco={monaco} editor={editor} />
          <LeaveButton roomId={roomId} />
        </div>
      </nav>
    </div>
  );
});

const MemoizedMarkdownEditor = memo(function MemoizedMarkdownEditor({
  markdown,
}: {
  markdown: string;
}) {
  return <MarkdownEditor markdown={markdown} />;
});

const MemoizedTerminal = memo(function MemoizedTerminal({
  results,
}: {
  results: ExecutionResult[];
}) {
  return <Terminal results={results} />;
});

const MemoizedWebcamStream = memo(function MemoizedWebcamStream({
  users,
}: {
  users: User[];
}) {
  return <WebcamStream users={users} />;
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

export default function Room({ params }: RoomProps) {
  const router = useRouter();
  const socket = getSocket();

  const [showMarkdown, setShowMarkdown] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
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
  const [defaultCode, setDefaultCode] = useState<string | null>(null); // ! CHANGE BACK TO NULL
  const [mdContent, setMdContent] = useState<string | null>(null); // ! CHANGE BACK TO NULL
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
      router.replace(`/?room=${params.roomId}`);
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
    params.roomId,
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
      className="flex h-full min-w-[480px] flex-col overflow-clip"
      aria-label="Code Editor Workspace"
    >
      <div className="h-9" role="toolbar" aria-label="Editor Controls">
        {monaco && editor && (
          <MemoizedToolbar
            monaco={monaco}
            editor={editor}
            roomId={params.roomId}
            setOutput={setOutput}
            users={users}
            setShowMarkdown={setShowMarkdown}
            setShowTerminal={setShowTerminal}
            setShowWebcam={setShowWebcam}
            showMarkdown={showMarkdown}
            showTerminal={showTerminal}
            showWebcam={showWebcam}
          />
        )}
      </div>
      {defaultCode !== null && mdContent !== null ? (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className={cn(
              'h-[calc(100%-24px)] animate-fade-in-left border-t-[1px] border-muted-foreground [&>div]:h-full',
              (!monaco || !editor) && 'hidden',
              !showMarkdown && 'hidden',
            )}
            role="region"
            aria-label="Notepad"
            collapsible
            minSize={10}
            defaultSize={20}
          >
            <MemoizedMarkdownEditor markdown={mdContent} />
          </ResizablePanel>
          <ResizableHandle
            withHandle={isMobile}
            className={cn(
              'bg-muted-foreground',
              (!monaco || !editor) && 'hidden',
              !showMarkdown && 'hidden',
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
                <MonacoEditor
                  monacoRef={handleMonacoSetup}
                  editorRef={handleEditorSetup}
                  cursorPosition={setCursorPosition}
                  defaultCode={defaultCode}
                />
              </ResizablePanel>
              <ResizableHandle
                withHandle={isMobile}
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
                <MemoizedTerminal results={output} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle
            withHandle={isMobile}
            className={cn(
              'bg-muted-foreground',
              (!monaco || !editor) && 'hidden',
              !showWebcam && 'hidden',
            )}
          />
          <ResizablePanel
            className={cn(
              'h-[calc(100%-24px)] animate-fade-in-right border-t-[1px] border-muted-foreground',
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
