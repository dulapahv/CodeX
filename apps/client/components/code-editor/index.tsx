/**
 * Code editor component that provides real-time collaborative editing.
 * Features:
 * - Monaco editor integration
 * - Multi-cursor support
 * - Real-time sync
 * - Scroll synchronization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CodeServiceMsg,
  RoomServiceMsg,
  ScrollServiceMsg,
} from "@codex/types/message";
import type { Cursor } from "@codex/types/operation";
import type { Scroll } from "@codex/types/scroll";
import Editor, { type Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useTheme } from "next-themes";
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import type { StatusBarCursorPosition } from "@/components/status-bar";
import { getSocket } from "@/lib/socket";

import { LoadingCard } from "./components/loading-card";
import * as cursorService from "./service/cursor-service";
import * as editorService from "./service/editor-service";
import { bindMonacoToYText } from "./service/monaco-binding";
import * as scrollService from "./service/scroll-service";
import { createCollabDoc } from "./service/yjs-doc-service";

interface CodeEditorProps {
  cursorPosition: Dispatch<SetStateAction<StatusBarCursorPosition>>;
  editorRef: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  monacoRef: (monaco: Monaco) => void;
  setCode: (code: string) => void;
}

const CodeEditor = memo(function CodeEditor({
  monacoRef,
  editorRef,
  cursorPosition,
  setCode,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const socket = getSocket();

  const [theme, setTheme] = useState<string>("vs-dark");

  const [isMonacoReady, setIsMonacoReady] = useState(false);

  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const cursorDecorationsRef = useRef<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >({});
  const cleanupTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  // Initialize editor theme
  useEffect(() => {
    const storedTheme =
      localStorage.getItem("editorTheme") ||
      (resolvedTheme === "dark" ? "vs-dark" : "light");
    setTheme(storedTheme);
    localStorage.setItem("editorTheme", storedTheme);
  }, [resolvedTheme]);

  // Apply theme changes
  useEffect(() => {
    editorInstanceRef.current?.updateOptions({ theme });
  }, [theme]);

  // Setup socket event listeners after Monaco is ready
  useEffect(() => {
    if (!isMonacoReady) {
      return;
    }

    socket.on(CodeServiceMsg.UPDATE_CURSOR, (userID: string, cursor: Cursor) =>
      cursorService.updateCursor(
        userID,
        cursor,
        editorInstanceRef,
        monacoInstanceRef,
        cursorDecorationsRef,
        cleanupTimeoutsRef
      )
    );

    socket.on(
      ScrollServiceMsg.UPDATE_SCROLL,
      (userID: string, scroll: Scroll) =>
        scrollService.updateScroll(editorInstanceRef, userID, scroll)
    );

    socket.on(RoomServiceMsg.LEAVE, (userID: string) =>
      cursorService.removeCursor(userID, cursorDecorationsRef)
    );

    // Cleanup socket listeners
    return () => {
      socket.off(CodeServiceMsg.UPDATE_CURSOR);
      socket.off(ScrollServiceMsg.UPDATE_SCROLL);
      socket.off(RoomServiceMsg.LEAVE);
    };
  }, [isMonacoReady, socket]);

  // Attach the shared document once Monaco exists. Creating it here (rather
  // than on the page) keeps the socket handshake and the model binding in one
  // lifecycle, so both are torn down together.
  useEffect(() => {
    const editor = editorInstanceRef.current;
    const monacoInstance = monacoInstanceRef.current;
    if (!(isMonacoReady && editor && monacoInstance)) {
      return;
    }

    const collab = createCollabDoc();
    const unbind = bindMonacoToYText(collab.ytext, editor, monacoInstance);

    return () => {
      unbind();
      collab.destroy();
    };
  }, [isMonacoReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up Monaco disposables
      for (const disposable of disposablesRef.current) {
        disposable.dispose();
      }
      disposablesRef.current = [];

      // Clean up decorations
      for (const decoration of Object.values(cursorDecorationsRef.current)) {
        decoration.clear();
      }
      cursorDecorationsRef.current = {};

      // Clean up timeouts
      for (const timeout of Object.values(cleanupTimeoutsRef.current)) {
        clearTimeout(timeout);
      }
      cleanupTimeoutsRef.current = {};
    };
  }, []);

  const handleEditorMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    // Set up refs first
    editorInstanceRef.current = editor;
    monacoInstanceRef.current = monaco;

    // Call the provided ref callbacks
    editorRef(editor);
    monacoRef(monaco);

    // Set up the editor with the default configuration
    editorService.handleOnMount(editor, monaco, disposablesRef, cursorPosition);

    // Mark Monaco as ready
    setIsMonacoReady(true);
  };

  return (
    <Editor
      beforeMount={editorService.handleBeforeMount}
      defaultLanguage="html"
      loading={<LoadingCard />}
      onChange={(value: string | undefined) => setCode(value || "")}
      onMount={handleEditorMount}
      theme={theme}
    />
  );
});

export { CodeEditor };
