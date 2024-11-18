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
import { MonacoEditor } from '@/components/monaco';
import { SettingsButton } from '@/components/settings-button';
import { ShareButton } from '@/components/share-button';
import { Toolbar } from '@/components/toolbar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  const [users, setUsers] = useState<User[]>([]);
  const [defaultCode, setDefaultCode] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    leaveRoom();
    socket.disconnect();
  }, [socket]);

  useEffect(() => {
    if (!socket.connected) {
      router.replace(`/?room=${params.roomId}`);
    }

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

    window.addEventListener('popstate', disconnect);

    return () => {
      window.removeEventListener('popstate', disconnect);
      socket.off(RoomServiceMsg.UPDATE_USERS);
      socket.off(CodeServiceMsg.RECEIVE_CODE);
      socket.off(CodeServiceMsg.LANG_RX);
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
              className="grow animate-slide-in-top"
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
      {defaultCode !== null ? (
        <div
          className="relative h-[calc(100%-36px)]"
          role="region"
          aria-label="Code Editor"
        >
          <MonacoEditor
            monacoRef={setMonaco}
            editorRef={setEditor}
            defaultCode={defaultCode}
          />
        </div>
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
    </main>
  );
}
