"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import * as monaco from "monaco-editor";

import type { Monaco } from "@monaco-editor/react";
import { LeaveButton } from "@/components/leave-button";
import { MonacoEditor } from "@/components/monaco";
import { SettingSheet } from "@/components/settings-sheet";
import { ShareButton } from "@/components/share-button";
import { Toolbar } from "@/components/toolbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserList } from "@/components/user-list";
import { userMap } from "@/lib/services/user-map";
import { socket } from "@/lib/socket";
import { leaveRoom } from "@/lib/utils";

import type { User } from "../../../../../common/types/user";
import {
  CodeServiceMsg,
  RoomServiceMsg,
} from "../../../../../common/types/message";

interface RoomProps {
  params: {
    roomId: string;
  };
}

export default function Room({ params }: RoomProps) {
  const router = useRouter();

  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [defaultCode, setDefaultCode] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    leaveRoom(params.roomId);
    socket.disconnect();
  }, [params.roomId]);

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

    socket.emit(CodeServiceMsg.GET_CODE);
    socket.on(CodeServiceMsg.RECEIVE_CODE, (code: string) => {
      setDefaultCode(code);
    });

    window.addEventListener("popstate", disconnect);

    return () => {
      window.removeEventListener("popstate", disconnect);
      socket.off(RoomServiceMsg.UPDATE_USERS);
      socket.off(CodeServiceMsg.RECEIVE_CODE);
      userMap.clear();
    };
  }, [disconnect, params.roomId, router]);

  return (
    <main className="flex h-full min-w-[425px] flex-col overflow-clip">
      <div className="h-9">
        {monaco && editor && (
          <div className="flex items-center gap-x-2 bg-[#dddddd] p-1 dark:bg-[#3c3c3c]">
            <div className="grow">
              <Toolbar monaco={monaco} editor={editor} roomId={params.roomId} />
            </div>
            <UserList users={users} />
            <ShareButton roomId={params.roomId} />
            <SettingSheet monaco={monaco} editor={editor} />
            <LeaveButton roomId={params.roomId} />
          </div>
        )}
      </div>
      {defaultCode !== null ? (
        <div className="relative h-[calc(100%-36px)]">
          <MonacoEditor
            monacoRef={setMonaco}
            editorRef={setEditor}
            defaultCode={defaultCode}
          />
        </div>
      ) : (
        <div className="flex h-full -translate-y-3 animate-fade-in items-center justify-center">
          <Alert className="max-w-md">
            <LoaderCircle className="size-5 animate-spin" />
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
