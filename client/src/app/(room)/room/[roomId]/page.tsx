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

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Monaco } from '@monaco-editor/react';
import { LoaderCircle } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { CodeServiceMsg, RoomServiceMsg } from '@common/types/message';
import type { User } from '@common/types/user';

import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { leaveRoom } from '@/lib/utils';
import { LeaveButton } from '@/components/leave-button';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MonacoEditor } from '@/components/monaco';
import { SettingsButton } from '@/components/settings-button';
import { ShareButton } from '@/components/share-button';
import {
  StatusBar,
  type StatusBarCursorPosition,
} from '@/components/status-bar';
import { Toolbar } from '@/components/toolbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { UserList } from '@/components/user-list';

interface RoomProps {
  params: {
    roomId: string;
  };
}

export default function Room({ params }: RoomProps) {
  const router = useRouter();
  const socket = getSocket();

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
  const [defaultCode, setDefaultCode] = useState<string | null>(''); // ! CHANGE BACK TO NULL
  const [mdContent, setMdContent] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    leaveRoom();
    socket.disconnect();
  }, [socket]);

  useEffect(() => {
    // if (!socket.connected) { // ! UNCOMMENT
    //   router.replace(`/?room=${params.roomId}`);
    // }

    // Request users and listen for updates
    socket.emit(RoomServiceMsg.GET_USERS);
    socket.on(
      RoomServiceMsg.UPDATE_USERS,
      (usersDict: Record<string, string>) => {
        userMap.clear();
        userMap.addBulk(usersDict);
        setUsers(userMap.getAll());
      },
    );

    // Request code and listen for updates
    socket.emit(CodeServiceMsg.GET_CODE);
    socket.on(CodeServiceMsg.RECEIVE_CODE, (code: string) => {
      setDefaultCode(code);
    });

    // Request markdown content and listen for updates
    socket.emit(RoomServiceMsg.GET_MD);
    socket.on(RoomServiceMsg.MD_RX, (md: string) => {
      setMdContent(md);
    });

    window.addEventListener('popstate', disconnect);

    return () => {
      window.removeEventListener('popstate', disconnect);
      socket.off(RoomServiceMsg.UPDATE_USERS);
      socket.off(CodeServiceMsg.RECEIVE_CODE);
      socket.off(CodeServiceMsg.LANG_RX);
      socket.off(RoomServiceMsg.MD_RX);
      userMap.clear();
    };
  }, [disconnect, params.roomId, router, socket]);

  return (
    <main
      className="flex h-full min-w-[425px] flex-col overflow-clip"
      aria-label="Code Editor Workspace"
    >
      <div className="h-9" role="toolbar" aria-label="Editor Controls">
        {monaco && editor && (
          <div
            className="flex items-center gap-x-2 p-1"
            style={{ backgroundColor: 'var(--toolbar-bg-secondary)' }}
          >
            <div
              className="grow animate-fade-in-top"
              style={{ color: 'var(--toolbar-foreground)' }}
              role="group"
              aria-label="Editor Toolbar"
            >
              <Toolbar monaco={monaco} editor={editor} roomId={params.roomId} />
            </div>
            <nav aria-label="Collaboration Tools">
              <div className="flex items-center gap-x-2">
                <UserList users={users} />
                <ShareButton roomId={params.roomId} />
                <SettingsButton monaco={monaco} editor={editor} />
                <LeaveButton roomId={params.roomId} />
              </div>
            </nav>
          </div>
        )}
      </div>
      {defaultCode !== null && mdContent !== null ? (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className="animate-fade-in-left h-[calc(100%-24px)] [&>div]:h-full"
            role="region"
            aria-label="Notepad"
            collapsible
            minSize={10}
          >
            <MarkdownEditor markdown={mdContent} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            className="h-[calc(100%-24px)] animate-fade-in"
            role="region"
            aria-label="Code Editor"
            defaultSize={75}
            minSize={10}
          >
            <MonacoEditor
              monacoRef={setMonaco}
              editorRef={setEditor}
              cursorPosition={setCursorPosition}
              defaultCode={defaultCode}
            />
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
        <StatusBar
          monaco={monaco}
          editor={editor}
          cursorPosition={cursorPosition}
        />
      )}
    </main>
  );
}
