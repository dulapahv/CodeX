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
import type * as monaco from "monaco-editor";
import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
import { AboutDialog, type AboutDialogRef } from "@/components/about-dialog";
import { LeaveDialog, type LeaveDialogRef } from "@/components/leave-dialog";
import {
  OpenFromGithubDialog,
  type OpenFromGithubDialogRef,
} from "@/components/open-from-github-dialog";
import {
  OpenPromptDialog,
  type OpenPromptDialogRef,
} from "@/components/open-prompt-dialog";
import {
  SaveToGithubDialog,
  type SaveToGithubDialogRef,
} from "@/components/save-to-github-dialog";
import {
  SettingsSheet,
  type SettingsSheetRef,
} from "@/components/settings-sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { REPO_URL } from "@/lib/constants";

import { DesktopMenu } from "./components/desktop-menu";
import { MobileMenu } from "./components/mobile-menu";
import type { ToolbarActions } from "./types";
import { getOS, openLocal, saveLocal } from "./utils";

interface ToolbarProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
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

  const openFromGithubDialogRef = useRef<OpenFromGithubDialogRef>(null);
  const openPromptDialogRef1 = useRef<OpenPromptDialogRef>(null);
  const openPromptDialogRef2 = useRef<OpenPromptDialogRef>(null);
  const saveToGithubDialogRef = useRef<SaveToGithubDialogRef>(null);
  const settingsSheetRef = useRef<SettingsSheetRef>(null);
  const leaveDialogRef = useRef<LeaveDialogRef>(null);
  const aboutDialogRef = useRef<AboutDialogRef>(null);

  const modKey = getOS() === "Mac OS" || getOS() === "iOS" ? "⌘" : "Ctrl";

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: keyboard shortcut handler requires many branches
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey) {
        if (event.shiftKey) {
          switch (event.key) {
            case "O":
              event.preventDefault();
              openPromptDialogRef2.current?.openDialog();
              break;
            case "S":
              event.preventDefault();
              saveToGithubDialogRef.current?.openDialog();
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

  const toolbarActions: ToolbarActions = {
    openLocal: () => {
      if (editor.getModel()?.getValue()) {
        openPromptDialogRef1.current?.openDialog();
      } else {
        openLocal(monaco, editor);
      }
    },
    openGitHub: () => {
      if (editor.getModel()?.getValue()) {
        openPromptDialogRef2.current?.openDialog();
      } else {
        openFromGithubDialogRef.current?.openDialog();
      }
    },
    saveLocal: () => saveLocal(monaco, editor),
    saveGitHub: () => saveToGithubDialogRef.current?.openDialog(),
    leaveRoom: () => leaveDialogRef.current?.openDialog(),
    settings: () => settingsSheetRef.current?.openDialog(),
    undo: () => {
      editor.focus();
      editor.trigger("keyboard", "undo", null);
    },
    redo: () => {
      editor.focus();
      editor.trigger("keyboard", "redo", null);
    },
    cut: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.clipboardCutAction", null);
    },
    copy: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.clipboardCopyAction", null);
    },
    paste: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.clipboardPasteAction", null);
    },
    find: () => editor.trigger("keyboard", "actions.find", null),
    replace: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.startFindReplaceAction", null);
    },
    toggleLineComment: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.commentLine", null);
    },
    toggleBlockComment: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.blockComment", null);
    },
    uppercase: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.transformToUppercase", null);
    },
    lowercase: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.transformToLowercase", null);
    },
    titleCase: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.transformToTitlecase", null);
    },
    sortLinesAscending: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.sortLinesAscending", null);
    },
    sortLinesDescending: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.sortLinesDescending", null);
    },
    selectAll: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.selectAll", null);
    },
    copyLineUp: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.copyLinesUpAction", null);
    },
    copyLineDown: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.copyLinesDownAction", null);
    },
    moveLineUp: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.moveLinesUpAction", null);
    },
    moveLineDown: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.moveLinesDownAction", null);
    },
    duplicateSelection: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.duplicateSelection", null);
    },
    addCursorAbove: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.insertCursorAbove", null);
    },
    addCursorBelow: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.insertCursorBelow", null);
    },
    selectToBracket: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.smartSelect.expand", null);
    },
    selectHighlights: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.selectHighlights", null);
    },
    expandSelection: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.smartSelect.expand", null);
    },
    shrinkSelection: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.smartSelect.shrink", null);
    },
    commandPalette: () => {
      // Timeout to prevent command palette triggering before editor is focussed
      editor.focus();
      setTimeout(() => {
        editor.trigger("keyboard", "editor.action.quickCommand", null);
      }, 1);
    },
    zoomIn: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.fontZoomIn", null);
    },
    zoomOut: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.action.fontZoomOut", null);
    },
    foldAll: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.foldAll", null);
    },
    unfoldAll: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.unfoldAll", null);
    },
    toggleFold: () => {
      editor.focus();
      editor.trigger("keyboard", "editor.fold", null);
    },
    toggleNotepadPanel: () => setShowNotepad((show) => !show),
    toggleTerminalPanel: () => setShowTerminal((show) => !show),
    toggleWebcamPanel: () => setShowWebcam((show) => !show),
    toggleSandpackPanel: () => setShowLivePreview((show) => !show),
    manual: () => {
      window.open(`${REPO_URL}/blob/main/manual.md`, "_blank");
    },
    about: () => aboutDialogRef.current?.openDialog(),
  };

  return (
    <>
      {isDesktop ? (
        <DesktopMenu
          actions={toolbarActions}
          livePreview={showLivePreview}
          modKey={modKey}
          notepad={showNotepad}
          terminal={showTerminal}
          webcam={showWebcam}
        />
      ) : (
        <MobileMenu
          actions={toolbarActions}
          livePreview={showLivePreview}
          modKey={modKey}
          notepad={showNotepad}
          terminal={showTerminal}
          webcam={showWebcam}
        />
      )}
      <OpenFromGithubDialog
        editor={editor}
        monaco={monaco}
        ref={openFromGithubDialogRef}
      />
      <OpenPromptDialog
        callback={() => openLocal(monaco, editor)}
        ref={openPromptDialogRef1}
      />
      <OpenPromptDialog
        callback={() => openFromGithubDialogRef.current?.openDialog()}
        ref={openPromptDialogRef2}
      />
      <SaveToGithubDialog editor={editor} ref={saveToGithubDialogRef} />
      <SettingsSheet editor={editor} monaco={monaco} ref={settingsSheetRef} />
      <LeaveDialog ref={leaveDialogRef} />
      <AboutDialog ref={aboutDialogRef} />
    </>
  );
};

export { Toolbar };
