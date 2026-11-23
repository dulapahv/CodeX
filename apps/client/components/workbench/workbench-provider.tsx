/**
 * The room's VS Code-style workbench: which parts of the layout show, the
 * commands the menus, command palette and shortcuts run, and the dialogs
 * those commands open.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AboutDialog, type AboutDialogRef } from "@/components/about-dialog";
import {
  COLLABORATIVE_REDO_ACTION_ID,
  COLLABORATIVE_UNDO_ACTION_ID,
} from "@/components/code-editor/service/monaco-binding";
import { LeaveDialog, type LeaveDialogRef } from "@/components/leave-dialog";
import {
  OpenFromRepositoryDialog,
  type OpenFromRepositoryDialogRef,
} from "@/components/open-from-repository-dialog";
import { ReplacePromptDialog } from "@/components/replace-prompt-dialog";
import {
  SaveToRepositoryDialog,
  type SaveToRepositoryDialogRef,
} from "@/components/save-to-repository-dialog";
import {
  SettingsSheet,
  type SettingsSheetRef,
} from "@/components/settings-sheet";
import { ShareDialog, type ShareDialogRef } from "@/components/share-dialog";
import type {
  ShortcutPlatform,
  ToolbarActions,
} from "@/components/toolbar/types";
import {
  type FileContent,
  getShortcutPlatform,
  pickLocalFiles,
  readLocalFiles,
  saveLocal,
} from "@/components/toolbar/utils";
import { useFollowUserId } from "@/hooks/use-follow-user-id";
import { REPO_URL } from "@/lib/constants";
import { useRoomConnection } from "@/lib/realtime/room-context";

import { CommandPalette, PALETTE_ACTION_ID } from "./command-palette";
import { readLayout, writeLayout } from "./layout-storage";
import { RoomNotifications } from "./room-notifications";
import { ThemePicker } from "./theme-picker";
import type { PanelView, SideBarView, WorkbenchLayout } from "./types";
import { useOpenFiles } from "./use-open-files";
import { type RoomFiles, useRoomFiles } from "./use-room-files";

type Editor = monacoEditor.editor.IStandaloneCodeEditor;

export type LayoutToggle = Exclude<
  keyof WorkbenchLayout,
  "panelView" | "sideBarView"
>;

interface WorkbenchContextValue {
  /** Every menu command, once the editor has loaded */
  actions: ToolbarActions | null;
  editor: Editor | null;
  files: RoomFiles;
  /** Adds files someone picked or dropped, asking before replacing any */
  importFiles: (items: FileContent[]) => void;
  isCreatingFile: boolean;
  layout: WorkbenchLayout;
  monaco: Monaco | null;
  /** Opens a side bar view, or closes the side bar if it's already showing */
  openView: (view: SideBarView) => void;
  platform: ShortcutPlatform;
  /** The file whose editor tab is being renamed */
  renamingFileId: string | null;
  roomId: string;
  setCreatingFile: (isCreating: boolean) => void;
  /** Keeps the layout in step when someone drags a part closed or open */
  setPartOpen: (part: LayoutToggle, isOpen: boolean) => void;
  setRenamingFileId: (id: string | null) => void;
  showLeave: () => void;
  showPalette: () => void;
  showPanelView: (view: PanelView) => void;
  showShare: () => void;
  showView: (view: SideBarView) => void;
  togglePart: (part: LayoutToggle) => void;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export const useWorkbench = () => {
  const context = use(WorkbenchContext);
  if (!context) {
    throw new Error("useWorkbench must be used inside a WorkbenchProvider");
  }
  return context;
};

// Ctrl+B means bold in the notepad and other text boxes
const isTypingOutsideCode = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches("input, textarea")) &&
  !target.closest(".monaco-editor");

const getShortcutKey = (event: KeyboardEvent) => {
  const key = event.code === "Backquote" ? "`" : event.key.toLowerCase();
  const modifiers = [
    (event.ctrlKey || event.metaKey) && "mod",
    event.altKey && "alt",
    event.shiftKey && "shift",
  ].filter(Boolean);
  return [...modifiers, key].join("+");
};

interface WorkbenchProviderProps {
  children: ReactNode;
  editor: Editor | null;
  monaco: Monaco | null;
  roomId: string;
}

export const WorkbenchProvider = ({
  children,
  editor,
  monaco,
  roomId,
}: WorkbenchProviderProps) => {
  const connection = useRoomConnection();
  // The room page only renders in the browser, after a client navigation,
  // so the saved layout can be read straight away
  const [layout, setLayout] = useState(readLayout);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [pendingImports, setPendingImports] = useState<FileContent[]>([]);
  const [isReplacePromptOpen, setIsReplacePromptOpen] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [isCreatingFile, setCreatingFile] = useState(false);
  const [platform] = useState(getShortcutPlatform);
  const files = useRoomFiles(editor, monaco, connection);
  const { activeFile, addFiles, openFile, renameFile } = files;

  const openFromRepositoryDialogRef = useRef<OpenFromRepositoryDialogRef>(null);
  const saveToRepositoryDialogRef = useRef<SaveToRepositoryDialogRef>(null);
  const settingsSheetRef = useRef<SettingsSheetRef>(null);
  const shareDialogRef = useRef<ShareDialogRef>(null);
  const leaveDialogRef = useRef<LeaveDialogRef>(null);
  const aboutDialogRef = useRef<AboutDialogRef>(null);

  useEffect(() => writeLayout(layout), [layout]);

  const setPartOpen = useCallback((part: LayoutToggle, isOpen: boolean) => {
    setLayout((current) =>
      current[part] === isOpen ? current : { ...current, [part]: isOpen }
    );
  }, []);

  const togglePart = useCallback((part: LayoutToggle) => {
    setLayout((current) => ({ ...current, [part]: !current[part] }));
  }, []);

  const openView = useCallback((view: SideBarView) => {
    setLayout((current) => {
      const isShowing = current.isSideBarOpen && current.sideBarView === view;
      return { ...current, isSideBarOpen: !isShowing, sideBarView: view };
    });
  }, []);

  const showView = useCallback((view: SideBarView) => {
    setLayout((current) => ({
      ...current,
      isSideBarOpen: true,
      sideBarView: view,
    }));
  }, []);

  const showPanelView = useCallback((view: PanelView) => {
    setLayout((current) => ({
      ...current,
      isPanelOpen: true,
      panelView: view,
    }));
  }, []);

  // Like Ctrl+` in VS Code, which closes the terminal only when it's showing
  const toggleTerminal = useCallback(() => {
    setLayout((current) => {
      const isShowing = current.isPanelOpen && current.panelView === "terminal";
      return { ...current, isPanelOpen: !isShowing, panelView: "terminal" };
    });
  }, []);

  const togglePanel = useCallback(
    () => togglePart("isPanelOpen"),
    [togglePart]
  );
  const showPalette = useCallback(() => setIsPaletteOpen(true), []);
  const showShare = useCallback(() => shareDialogRef.current?.openDialog(), []);
  const showLeave = useCallback(() => leaveDialogRef.current?.openDialog(), []);

  // Adds what it can and asks before replacing a file with the same name
  const importFiles = useCallback(
    (items: FileContent[]) => {
      const taken = addFiles(items);
      if (taken.length > 0) {
        setPendingImports(taken);
        setIsReplacePromptOpen(true);
      }
    },
    [addFiles]
  );

  const openLocal = useCallback(() => {
    pickLocalFiles(async (picked) => importFiles(await readLocalFiles(picked)));
  }, [importFiles]);

  const getFileName = useCallback(() => activeFile?.name ?? "", [activeFile]);

  const renameActiveFile = useCallback(
    (name: string) => {
      if (activeFile) {
        renameFile(activeFile.id, name);
      }
    },
    [activeFile, renameFile]
  );

  // Following someone brings up the file they have open
  const followUserId = useFollowUserId();
  const openFiles = useOpenFiles();
  const followedFileId = followUserId
    ? (openFiles.get(followUserId) ?? null)
    : null;
  const hasFollowedFile = files.files.some(({ id }) => id === followedFileId);
  useEffect(() => {
    if (followedFileId && hasFollowedFile) {
      openFile(followedFileId);
    }
  }, [followedFileId, hasFollowedFile, openFile]);

  const actions = useMemo<ToolbarActions | null>(() => {
    if (!(monaco && editor && connection)) {
      return null;
    }

    const runEditorAction = (actionId: string) => () => {
      editor.focus();
      editor.trigger("keyboard", actionId, null);
    };

    return {
      about: () => aboutDialogRef.current?.openDialog(),
      addCursorAbove: runEditorAction("editor.action.insertCursorAbove"),
      addCursorBelow: runEditorAction("editor.action.insertCursorBelow"),
      addCursorsToLineEnds: runEditorAction(
        "editor.action.insertCursorAtEndOfEachLineSelected"
      ),
      addLineComment: runEditorAction("editor.action.addCommentLine"),
      addNextOccurrence: runEditorAction(
        "editor.action.addSelectionToNextFindMatch"
      ),
      changeAllOccurrences: runEditorAction("editor.action.changeAll"),
      colorTheme: () => setIsThemePickerOpen(true),
      commandPalette: showPalette,
      copy: runEditorAction("editor.action.clipboardCopyAction"),
      copyLineDown: runEditorAction("editor.action.copyLinesDownAction"),
      copyLineUp: runEditorAction("editor.action.copyLinesUpAction"),
      cursorUndo: runEditorAction("cursorUndo"),
      cut: runEditorAction("editor.action.clipboardCutAction"),
      deleteLine: runEditorAction("editor.action.deleteLines"),
      duplicateSelection: runEditorAction("editor.action.duplicateSelection"),
      expandLineSelection: runEditorAction("expandLineSelection"),
      expandSelection: runEditorAction("editor.action.smartSelect.expand"),
      find: runEditorAction("actions.find"),
      findNext: runEditorAction("editor.action.nextMatchFindAction"),
      findPrevious: runEditorAction("editor.action.previousMatchFindAction"),
      fold: runEditorAction("editor.fold"),
      foldAll: runEditorAction("editor.foldAll"),
      foldRecursively: runEditorAction("editor.foldRecursively"),
      formatDocument: runEditorAction("editor.action.formatDocument"),
      formatSelection: runEditorAction("editor.action.formatSelection"),
      goToBracket: runEditorAction("editor.action.jumpToBracket"),
      goToDefinition: runEditorAction("editor.action.revealDefinition"),
      goToLine: runEditorAction("editor.action.gotoLine"),
      goToReferences: runEditorAction("editor.action.goToReferences"),
      goToSymbol: runEditorAction("editor.action.quickOutline"),
      indentLine: runEditorAction("editor.action.indentLines"),
      insertLineAbove: runEditorAction("editor.action.insertLineBefore"),
      insertLineBelow: runEditorAction("editor.action.insertLineAfter"),
      leaveRoom: showLeave,
      lowercase: runEditorAction("editor.action.transformToLowercase"),
      manual: () => {
        window.open(
          `${REPO_URL}/blob/main/manual.md`,
          "_blank",
          "noopener,noreferrer"
        );
      },
      moveLineDown: runEditorAction("editor.action.moveLinesDownAction"),
      moveLineUp: runEditorAction("editor.action.moveLinesUpAction"),
      newFile: () => {
        showView("explorer");
        setCreatingFile(true);
      },
      nextProblem: runEditorAction("editor.action.marker.nextInFiles"),
      openLocal,
      openRepository: () => openFromRepositoryDialogRef.current?.openDialog(),
      organizeImports: runEditorAction("editor.action.organizeImports"),
      outdentLine: runEditorAction("editor.action.outdentLines"),
      paste: runEditorAction("editor.action.clipboardPasteAction"),
      peekDefinition: runEditorAction("editor.action.peekDefinition"),
      previousProblem: runEditorAction("editor.action.marker.prevInFiles"),
      quickFix: runEditorAction("editor.action.quickFix"),
      redo: runEditorAction(COLLABORATIVE_REDO_ACTION_ID),
      refactor: runEditorAction("editor.action.refactor"),
      removeBrackets: runEditorAction("editor.action.removeBrackets"),
      removeLineComment: runEditorAction("editor.action.removeCommentLine"),
      renameFile: () => {
        if (activeFile) {
          setRenamingFileId(activeFile.id);
        }
      },
      renameSymbol: runEditorAction("editor.action.rename"),
      replace: runEditorAction("editor.action.startFindReplaceAction"),
      saveLocal: () => {
        if (activeFile) {
          saveLocal(editor.getValue(), activeFile.name);
        }
      },
      saveRepository: () => saveToRepositoryDialogRef.current?.openDialog(),
      selectAll: runEditorAction("editor.action.selectAll"),
      selectHighlights: runEditorAction("editor.action.selectHighlights"),
      selectToBracket: runEditorAction("editor.action.selectToBracket"),
      settings: () => settingsSheetRef.current?.openDialog(),
      share: showShare,
      showExplorer: () => showView("explorer"),
      showHover: runEditorAction("editor.action.showHover"),
      showNotepad: () => showView("notepad"),
      showParticipants: () => showView("participants"),
      showProblems: () => showPanelView("problems"),
      showRepository: () => showView("repository"),
      showTerminal: () => showPanelView("terminal"),
      shrinkSelection: runEditorAction("editor.action.smartSelect.shrink"),
      sortLinesAscending: runEditorAction("editor.action.sortLinesAscending"),
      sortLinesDescending: runEditorAction("editor.action.sortLinesDescending"),
      titleCase: runEditorAction("editor.action.transformToTitlecase"),
      toggleBlockComment: runEditorAction("editor.action.blockComment"),
      toggleCall: () => togglePart("isCallOpen"),
      toggleFold: runEditorAction("editor.toggleFold"),
      toggleLineComment: runEditorAction("editor.action.commentLine"),
      togglePanel,
      togglePreview: () => togglePart("isPreviewOpen"),
      toggleSideBar: () => togglePart("isSideBarOpen"),
      toggleTabFocusMode: runEditorAction("editor.action.toggleTabFocusMode"),
      triggerParameterHints: runEditorAction(
        "editor.action.triggerParameterHints"
      ),
      triggerSuggest: runEditorAction("editor.action.triggerSuggest"),
      trimTrailingWhitespace: runEditorAction(
        "editor.action.trimTrailingWhitespace"
      ),
      undo: runEditorAction(COLLABORATIVE_UNDO_ACTION_ID),
      unfold: runEditorAction("editor.unfold"),
      unfoldAll: runEditorAction("editor.unfoldAll"),
      unfoldRecursively: runEditorAction("editor.unfoldRecursively"),
      uppercase: runEditorAction("editor.action.transformToUppercase"),
      zoomIn: runEditorAction("editor.action.fontZoomIn"),
      zoomOut: runEditorAction("editor.action.fontZoomOut"),
    };
  }, [
    monaco,
    editor,
    connection,
    activeFile,
    openLocal,
    showLeave,
    showPalette,
    showShare,
    showView,
    showPanelView,
    togglePart,
    togglePanel,
  ]);

  // The editor keeps F1 for its own command list, so this takes it over
  useEffect(() => {
    if (!(editor && monaco)) {
      return;
    }
    const action = editor.addAction({
      id: PALETTE_ACTION_ID,
      keybindings: [
        monaco.KeyCode.F1,
        // biome-ignore lint/suspicious/noBitwiseOperators: Monaco combines key codes with bit flags
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      ],
      label: "Show All Commands",
      run: showPalette,
    });
    return () => action.dispose();
  }, [editor, monaco, showPalette]);

  useEffect(() => {
    const shortcuts: Record<string, (() => void) | undefined> = {
      f1: showPalette,
      "mod+,": actions?.settings,
      "mod+`": toggleTerminal,
      "mod+b": () => togglePart("isSideBarOpen"),
      "mod+j": togglePanel,
      "mod+o": actions?.openLocal,
      "mod+q": showLeave,
      "mod+s": actions?.saveLocal,
      "mod+shift+o": actions?.openRepository,
      "mod+shift+p": showPalette,
      "mod+shift+s": actions?.saveRepository,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const key = getShortcutKey(event);
      const run = shortcuts[key];
      if (!run || (key === "mod+b" && isTypingOutsideCode(event.target))) {
        return;
      }
      event.preventDefault();
      run();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, showPalette, toggleTerminal, togglePanel, togglePart]);

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      actions,
      editor,
      files,
      importFiles,
      isCreatingFile,
      layout,
      monaco,
      openView,
      platform,
      renamingFileId,
      roomId,
      setCreatingFile,
      setPartOpen,
      setRenamingFileId,
      showLeave,
      showPalette,
      showPanelView,
      showShare,
      showView,
      togglePart,
    }),
    [
      actions,
      editor,
      files,
      importFiles,
      isCreatingFile,
      layout,
      monaco,
      openView,
      platform,
      renamingFileId,
      roomId,
      setPartOpen,
      showLeave,
      showPalette,
      showPanelView,
      showShare,
      showView,
      togglePart,
    ]
  );

  return (
    <WorkbenchContext value={value}>
      {children}
      <RoomNotifications />
      <ShareDialog ref={shareDialogRef} roomId={roomId} />
      <ReplacePromptDialog
        confirmLabel="Replace"
        description={
          pendingImports.length === 1
            ? "A file with this name is already in the room. Replacing it changes it for everyone."
            : `${pendingImports.map(({ name }) => name).join(", ")} are already in the room. Replacing them changes them for everyone.`
        }
        onCancel={() => setIsReplacePromptOpen(false)}
        onConfirm={() => {
          setIsReplacePromptOpen(false);
          files.replaceFiles(pendingImports);
        }}
        open={isReplacePromptOpen}
        title={
          pendingImports.length === 1
            ? `Replace ${pendingImports[0].name}?`
            : `Replace ${pendingImports.length} files?`
        }
      />
      <AboutDialog ref={aboutDialogRef} />
      {/* Leaving tells the room, so it waits for the connection */}
      {connection && <LeaveDialog ref={leaveDialogRef} />}
      {monaco && editor && (
        <>
          <OpenFromRepositoryDialog
            editor={editor}
            monaco={monaco}
            ref={openFromRepositoryDialogRef}
          />
          <SaveToRepositoryDialog
            editor={editor}
            getFileName={getFileName}
            onSaved={renameActiveFile}
            ref={saveToRepositoryDialogRef}
          />
          <SettingsSheet
            editor={editor}
            monaco={monaco}
            ref={settingsSheetRef}
          />
        </>
      )}
      <ThemePicker
        onOpenChange={setIsThemePickerOpen}
        open={isThemePickerOpen}
      />
      {actions && editor && (
        <CommandPalette
          actions={actions}
          editor={editor}
          layout={layout}
          onOpenChange={setIsPaletteOpen}
          open={isPaletteOpen}
          platform={platform}
        />
      )}
    </WorkbenchContext>
  );
};
