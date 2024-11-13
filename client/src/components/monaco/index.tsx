/**
 * A collaborative Monaco Editor component that handles real-time code
 * synchronization and cursor tracking between multiple users.
 *
 * @example
 * ```tsx
 * <MonacoEditor
 *   monacoRef={setMonaco}
 *   editorRef={setEditor}
 *   defaultCode="console.log('hello world')"
 * />
 * ```
 *
 * @param props - Component props
 * @param props.monacoRef - Callback to get Monaco instance
 * @param props.editorRef - Callback to get editor instance
 * @param props.defaultCode - Initial code content
 *
 * @remarks
 * Uses the following services:
 * - [`codeService`](./service/code-service.ts) for code synchronization
 * - [`cursorService`](./service/cursor-service.ts) for cursor tracking
 * - [`editorService`](./service/editor-service.ts) for editor configuration
 * - [`getSocket`](src/lib/socket.ts) for real-time communication
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo, useEffect, useRef, useState } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';

import {
  CodeServiceMsg,
  RoomServiceMsg,
  UserServiceMsg,
} from '@common/types/message';
import { Cursor, EditOp } from '@common/types/operation';

import { getSocket } from '@/lib/socket';

import { LoadingCard } from './components/loading-card';
import { StatusBar } from './components/status-bar';
import * as codeService from './service/code-service';
import * as cursorService from './service/cursor-service';
import * as editorService from './service/editor-service';
import type { StatusBarCursorPosition } from './types';

interface MonacoEditorProps {
  monacoRef: (monaco: Monaco) => void;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  defaultCode?: string;
}

const MonacoEditor = memo(function MonacoEditor({
  monacoRef,
  editorRef,
  defaultCode,
}: MonacoEditorProps) {
  const { resolvedTheme } = useTheme();
  const socket = getSocket();

  const [theme, setTheme] = useState<string>('vs-dark');
  const [cursorPosition, setCursorPosition] = useState<StatusBarCursorPosition>(
    {
      line: 1,
      column: 1,
      selected: 0,
    },
  );
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const skipUpdateRef = useRef(false);
  const cursorDecorationsRef = useRef<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >({});
  const cleanupTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  // Initialize editor theme
  useEffect(() => {
    const storedTheme =
      localStorage.getItem('editorTheme') ||
      (resolvedTheme === 'dark' ? 'vs-dark' : 'light');
    setTheme(storedTheme);
    localStorage.setItem('editorTheme', storedTheme);
  }, [resolvedTheme]);

  // Apply theme changes
  useEffect(() => {
    editorInstanceRef.current?.updateOptions({ theme });
  }, [theme]);

  // Setup socket event listeners after Monaco is ready
  useEffect(() => {
    if (!isMonacoReady) return;

    socket.on(CodeServiceMsg.CODE_RX, (op: EditOp) =>
      codeService.updateCode(op, editorInstanceRef, skipUpdateRef),
    );

    socket.on(UserServiceMsg.CURSOR_RX, (userID: string, cursor: Cursor) =>
      cursorService.updateCursor(
        userID,
        cursor,
        editorInstanceRef,
        monacoInstanceRef,
        cursorDecorationsRef,
        cleanupTimeoutsRef,
      ),
    );

    socket.on(RoomServiceMsg.USER_LEFT, (userID: string) =>
      cursorService.removeCursor(userID, cursorDecorationsRef),
    );

    // Cleanup socket listeners
    return () => {
      socket.off(CodeServiceMsg.CODE_RX);
      socket.off(UserServiceMsg.CURSOR_RX);
      socket.off(RoomServiceMsg.USER_LEFT);
    };
  }, [isMonacoReady, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up Monaco disposables
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];

      // Clean up decorations
      Object.values(cursorDecorationsRef.current).forEach((decoration) =>
        decoration.clear(),
      );
      cursorDecorationsRef.current = {};

      // Clean up timeouts
      Object.values(cleanupTimeoutsRef.current).forEach((timeout) =>
        clearTimeout(timeout),
      );
      cleanupTimeoutsRef.current = {};
    };
  }, []);

  const handleEditorMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    // Set up refs first
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    // Call the provided ref callbacks
    editorRef(editor);
    monacoRef(monaco);

    // Set up the editor with the default configuration
    editorService.handleOnMount(
      editor,
      monaco,
      disposablesRef,
      setCursorPosition,
      defaultCode,
    );

    // Mark Monaco as ready
    setIsMonacoReady(true);
  };

  return (
    <>
      <div className="h-[calc(100%-24px)]">
        <Editor
          defaultLanguage="python"
          theme={theme}
          loading={<LoadingCard />}
          beforeMount={editorService.handleBeforeMount}
          onMount={handleEditorMount}
          onChange={(
            value: string | undefined,
            ev: monaco.editor.IModelContentChangedEvent,
          ) => editorService.handleOnChange(value, ev, skipUpdateRef)}
        />
      </div>
      <StatusBar
        monaco={monacoInstanceRef.current}
        editor={editorInstanceRef.current}
        cursorPosition={cursorPosition}
      />
    </>
  );
});

export { MonacoEditor };
