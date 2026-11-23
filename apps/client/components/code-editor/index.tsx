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

import type { Presence } from "@codex/types/realtime";
import Editor, { loader, type Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { useTheme } from "next-themes";
import { memo, useEffect, useRef, useState } from "react";
import { useWorkbench } from "@/components/workbench/workbench-provider";
import { useRoom } from "@/lib/realtime/room-context";
import { MAIN_FILE_ID } from "@/lib/realtime/room-files";

import { CodeEditorSkeleton } from "./components/editor-skeleton";
import * as cursorService from "./service/cursor-service";
import * as editorService from "./service/editor-service";
import * as scrollService from "./service/scroll-service";

// The editor is fetched from this CDN, while the monaco-editor package only
// supplies types, so keep the two versions in step
const MONACO_VERSION = "0.57.0";

loader.config({
  paths: {
    vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`,
  },
});

interface AwarenessChange {
  added: number[];
  removed: number[];
  updated: number[];
}

interface CodeEditorProps {
  editorRef: (editor: monacoEditor.editor.IStandaloneCodeEditor) => void;
  monacoRef: (monaco: Monaco) => void;
}

const CodeEditor = memo(function CodeEditorComponent({
  monacoRef,
  editorRef,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const room = useRoom();
  const { fileModels } = useWorkbench().files;

  const [theme, setTheme] = useState<string>("vs-dark");

  const [isMonacoReady, setIsMonacoReady] = useState(false);

  const editorInstanceRef =
    useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const cursorDecorationsRef = useRef<
    Record<string, monacoEditor.editor.IEditorDecorationsCollection>
  >({});
  const disposablesRef = useRef<monacoEditor.IDisposable[]>([]);

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

  // Show the cursors of people on the same file, and follow a user's scroll
  // when asked to
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!(isMonacoReady && editor && fileModels)) {
      return;
    }

    // Presence also changes for pointer moves, so skip unchanged cursors
    const lastSeen = new Map<number, string>();

    const removeCursor = (clientId: number) => {
      lastSeen.delete(clientId);
      cursorService.removeCursor(String(clientId), cursorDecorationsRef);
    };

    const getShownFileId = () => {
      const model = editor.getModel();
      return model ? fileModels.getFileId(model) : null;
    };

    const showCursor = (
      clientId: number,
      state: Presence | undefined,
      shownFileId: string | null
    ) => {
      // People from before multiple files were always in the first file
      const isOnShownFile =
        shownFileId !== null && (state?.file ?? MAIN_FILE_ID) === shownFileId;
      if (!(state?.cursor && isOnShownFile)) {
        if (lastSeen.has(clientId)) {
          removeCursor(clientId);
        }
        return;
      }
      const key = JSON.stringify([state.user.name, state.cursor, state.scroll]);
      if (lastSeen.get(clientId) === key) {
        return;
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
    };

    const handleChange = ({ added, updated, removed }: AwarenessChange) => {
      const states = room.awareness.getStates() as Map<number, Presence>;
      const shownFileId = getShownFileId();
      for (const clientId of removed) {
        removeCursor(clientId);
      }
      for (const clientId of [...added, ...updated]) {
        if (clientId !== room.clientId) {
          showCursor(clientId, states.get(clientId), shownFileId);
        }
      }
    };

    const showEveryone = () =>
      handleChange({
        added: [...room.awareness.getStates().keys()],
        removed: [],
        updated: [],
      });

    // Cursors belong to the file they were drawn on, so they're cleared
    // before the editor changes file and drawn again after
    const stopClearing = fileModels.onWillShow(() => {
      for (const clientId of [...lastSeen.keys()]) {
        removeCursor(clientId);
      }
    });
    const modelChange = editor.onDidChangeModel(showEveryone);

    room.awareness.on("change", handleChange);
    showEveryone();
    const labelHover = cursorService.showLabelOnHover(
      editor,
      cursorDecorationsRef
    );

    return () => {
      room.awareness.off("change", handleChange);
      stopClearing();
      modelChange.dispose();
      labelHover.dispose();
      for (const clientId of [...lastSeen.keys()]) {
        removeCursor(clientId);
      }
    };
  }, [fileModels, isMonacoReady, room]);

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
    editor: monacoEditor.editor.IStandaloneCodeEditor,
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
      room.setPresence
    );

    // Mark Monaco as ready
    setIsMonacoReady(true);
  };

  return (
    <Editor
      beforeMount={editorService.handleBeforeMount}
      defaultLanguage="python"
      // The room's files own their models, so the editor leaves them be
      keepCurrentModel
      loading={<CodeEditorSkeleton />}
      onMount={handleEditorMount}
      theme={theme}
    />
  );
});

export { CodeEditor };
