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

import { type Presence, ROOM_DOC } from "@codex/types/realtime";
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
import { useRoom } from "@/lib/realtime/room-context";

import { CodeEditorSkeleton } from "./components/editor-skeleton";
import * as cursorService from "./service/cursor-service";
import * as editorService from "./service/editor-service";
import { bindMonacoToYText } from "./service/monaco-binding";
import * as scrollService from "./service/scroll-service";

interface AwarenessChange {
  added: number[];
  removed: number[];
  updated: number[];
}

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

  const room = useRoom();

  const [theme, setTheme] = useState<string>("vs-dark");

  const [isMonacoReady, setIsMonacoReady] = useState(false);

  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const cursorDecorationsRef = useRef<
    Record<string, monaco.editor.IEditorDecorationsCollection>
  >({});
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

  // Show other users' cursors, and follow a user's scroll when asked to
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!(isMonacoReady && editor)) {
      return;
    }

    // Presence also changes for pointer moves, so skip unchanged cursors
    const lastSeen = new Map<number, string>();

    const handleChange = ({ added, updated, removed }: AwarenessChange) => {
      const states = room.awareness.getStates() as Map<number, Presence>;
      for (const clientId of removed) {
        lastSeen.delete(clientId);
        cursorService.removeCursor(String(clientId), cursorDecorationsRef);
      }
      for (const clientId of [...added, ...updated]) {
        const state = states.get(clientId);
        if (clientId === room.clientId || !state?.cursor) {
          continue;
        }
        const key = JSON.stringify([
          state.user.name,
          state.cursor,
          state.scroll,
        ]);
        if (lastSeen.get(clientId) === key) {
          continue;
        }
        lastSeen.set(clientId, key);
        cursorService.updateCursor(
          String(clientId),
          state.user.name,
          state.cursor,
          editorInstanceRef,
          monacoInstanceRef,
          cursorDecorationsRef
        );
        if (state.scroll) {
          scrollService.updateScroll(
            editorInstanceRef,
            String(clientId),
            state.scroll
          );
        }
      }
    };

    room.awareness.on("change", handleChange);
    handleChange({
      added: [...room.awareness.getStates().keys()],
      updated: [],
      removed: [],
    });
    const labelHover = cursorService.showLabelOnHover(
      editor,
      cursorDecorationsRef
    );

    return () => {
      room.awareness.off("change", handleChange);
      labelHover.dispose();
    };
  }, [isMonacoReady, room]);

  // Bind the editor to the room's shared code once Monaco exists
  useEffect(() => {
    const editor = editorInstanceRef.current;
    const monacoInstance = monacoInstanceRef.current;
    if (!(isMonacoReady && editor && monacoInstance)) {
      return;
    }
    return bindMonacoToYText(
      room.doc.getText(ROOM_DOC.code),
      editor,
      monacoInstance
    );
  }, [isMonacoReady, room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up Monaco disposables
      for (const disposable of disposablesRef.current) {
        disposable.dispose();
      }
      disposablesRef.current = [];

      for (const userID of Object.keys(cursorDecorationsRef.current)) {
        cursorService.removeCursor(userID, cursorDecorationsRef);
      }
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
    editorService.handleOnMount(
      editor,
      monaco,
      disposablesRef,
      cursorPosition,
      room.setPresence
    );

    // Mark Monaco as ready
    setIsMonacoReady(true);
  };

  return (
    <Editor
      beforeMount={editorService.handleBeforeMount}
      defaultLanguage="python"
      loading={<CodeEditorSkeleton />}
      onChange={(value: string | undefined) => setCode(value || "")}
      onMount={handleEditorMount}
      theme={theme}
    />
  );
});

export { CodeEditor };
