/**
 * Toolbar component that provides menu access and editor actions.
 * Features:
 * - Desktop/mobile responsive menus
 * - File handling actions
 * - Editor command access
 * - Dialog/sheet management
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
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
import {
  OpenPromptDialog,
  type OpenPromptDialogRef,
} from "@/components/open-prompt-dialog";
import {
  SaveToRepositoryDialog,
  type SaveToRepositoryDialogRef,
} from "@/components/save-to-repository-dialog";
import {
  SettingsSheet,
  type SettingsSheetRef,
} from "@/components/settings-sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { REPO_URL } from "@/lib/constants";

import { DesktopMenu } from "./components/desktop-menu";
import { MobileMenu } from "./components/mobile-menu";
import type { ToolbarActions } from "./types";
import { getShortcutPlatform, openLocal, saveLocal } from "./utils";

interface ToolbarProps {
  editor: monacoEditor.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
  setShowLivePreview: Dispatch<SetStateAction<boolean>>;
  setShowNotepad: Dispatch<SetStateAction<boolean>>;
  setShowTerminal: Dispatch<SetStateAction<boolean>>;
  setShowWebcam: Dispatch<SetStateAction<boolean>>;
  showLivePreview: boolean;
  showNotepad: boolean;
  showTerminal: boolean;
  showWebcam: boolean;
}

const Toolbar = ({
  monaco,
  editor,
  setShowNotepad,
  setShowTerminal,
  setShowWebcam,
  setShowLivePreview,
  showNotepad,
  showTerminal,
  showWebcam,
  showLivePreview,
}: ToolbarProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const openFromRepositoryDialogRef = useRef<OpenFromRepositoryDialogRef>(null);
  const openPromptDialogRef1 = useRef<OpenPromptDialogRef>(null);
  const openPromptDialogRef2 = useRef<OpenPromptDialogRef>(null);
  const saveToRepositoryDialogRef = useRef<SaveToRepositoryDialogRef>(null);
  const settingsSheetRef = useRef<SettingsSheetRef>(null);
  const leaveDialogRef = useRef<LeaveDialogRef>(null);
  const aboutDialogRef = useRef<AboutDialogRef>(null);

  const platform = getShortcutPlatform();

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: keyboard shortcut handler requires many branches
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey) {
          switch (event.key) {
            case "O":
              event.preventDefault();
              if (editor?.getModel()?.getValue()) {
                openPromptDialogRef2.current?.openDialog();
              } else {
                openFromRepositoryDialogRef.current?.openDialog();
              }
              break;
            case "S":
              event.preventDefault();
              saveToRepositoryDialogRef.current?.openDialog();
              break;
            default:
              break;
          }
        } else {
          switch (event.key) {
            case "q":
              event.preventDefault();
              leaveDialogRef.current?.openDialog();
              break;
            case "s":
              event.preventDefault();
              if (monaco) {
                saveLocal(monaco, editor);
              }
              break;
            case ",":
              event.preventDefault();
              settingsSheetRef.current?.openDialog();
              break;
            default:
              break;
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [monaco, editor]);

  if (!(monaco && editor)) {
    return null;
  }

  const runEditorAction = (actionId: string) => () => {
    editor.focus();
    editor.trigger("keyboard", actionId, null);
  };

  const toolbarActions: ToolbarActions = {
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
    commandPalette: runEditorAction("editor.action.quickCommand"),
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
    leaveRoom: () => leaveDialogRef.current?.openDialog(),
    lowercase: runEditorAction("editor.action.transformToLowercase"),
    manual: () => {
      window.open(`${REPO_URL}/blob/main/manual.md`, "_blank");
    },
    moveLineDown: runEditorAction("editor.action.moveLinesDownAction"),
    moveLineUp: runEditorAction("editor.action.moveLinesUpAction"),
    nextProblem: runEditorAction("editor.action.marker.nextInFiles"),
    openLocal: () => {
      if (editor.getModel()?.getValue()) {
        openPromptDialogRef1.current?.openDialog();
      } else {
        openLocal(monaco, editor);
      }
    },
    openRepository: () => {
      if (editor.getModel()?.getValue()) {
        openPromptDialogRef2.current?.openDialog();
      } else {
        openFromRepositoryDialogRef.current?.openDialog();
      }
    },
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
    renameSymbol: runEditorAction("editor.action.rename"),
    replace: runEditorAction("editor.action.startFindReplaceAction"),
    saveLocal: () => saveLocal(monaco, editor),
    saveRepository: () => saveToRepositoryDialogRef.current?.openDialog(),
    selectAll: runEditorAction("editor.action.selectAll"),
    selectHighlights: runEditorAction("editor.action.selectHighlights"),
    selectToBracket: runEditorAction("editor.action.selectToBracket"),
    settings: () => settingsSheetRef.current?.openDialog(),
    showHover: runEditorAction("editor.action.showHover"),
    shrinkSelection: runEditorAction("editor.action.smartSelect.shrink"),
    sortLinesAscending: runEditorAction("editor.action.sortLinesAscending"),
    sortLinesDescending: runEditorAction("editor.action.sortLinesDescending"),
    titleCase: runEditorAction("editor.action.transformToTitlecase"),
    toggleBlockComment: runEditorAction("editor.action.blockComment"),
    toggleFold: runEditorAction("editor.toggleFold"),
    toggleLineComment: runEditorAction("editor.action.commentLine"),
    toggleNotepadPanel: () => setShowNotepad((show) => !show),
    toggleSandpackPanel: () => setShowLivePreview((show) => !show),
    toggleTabFocusMode: runEditorAction("editor.action.toggleTabFocusMode"),
    toggleTerminalPanel: () => setShowTerminal((show) => !show),
    toggleWebcamPanel: () => setShowWebcam((show) => !show),
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

  return (
    <>
      {isDesktop ? (
        <DesktopMenu
          actions={toolbarActions}
          livePreview={showLivePreview}
          notepad={showNotepad}
          platform={platform}
          terminal={showTerminal}
          webcam={showWebcam}
        />
      ) : (
        <MobileMenu
          actions={toolbarActions}
          livePreview={showLivePreview}
          notepad={showNotepad}
          platform={platform}
          terminal={showTerminal}
          webcam={showWebcam}
        />
      )}
      <OpenFromRepositoryDialog
        editor={editor}
        monaco={monaco}
        ref={openFromRepositoryDialogRef}
      />
      <OpenPromptDialog
        callback={() => openLocal(monaco, editor)}
        ref={openPromptDialogRef1}
      />
      <OpenPromptDialog
        callback={() => openFromRepositoryDialogRef.current?.openDialog()}
        ref={openPromptDialogRef2}
      />
      <SaveToRepositoryDialog editor={editor} ref={saveToRepositoryDialogRef} />
      <SettingsSheet editor={editor} monaco={monaco} ref={settingsSheetRef} />
      <LeaveDialog ref={leaveDialogRef} />
      <AboutDialog ref={aboutDialogRef} />
    </>
  );
};

export { Toolbar };
