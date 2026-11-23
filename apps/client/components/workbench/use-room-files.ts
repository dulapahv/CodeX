/**
 * The room's files as this person sees them: everyone shares the files,
 * while each person has their own open tabs and the file in front of them.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  DEFAULT_LANGUAGE,
  META_LANGUAGE,
  ROOM_DOC,
} from "@codex/types/realtime";
import type { Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createFileModels,
  type FileModels,
} from "@/components/code-editor/service/file-models";
import type { FileContent } from "@/components/toolbar/utils";
import type { RoomConnection } from "@/lib/realtime/room-connection";
import { useRoomAccess, VIEW_ONLY_MESSAGE } from "@/lib/realtime/room-context";
import {
  createFile as createFileInDoc,
  deleteFile as deleteFileInDoc,
  findFileByName,
  getFileText,
  MAIN_FILE_ID,
  observeFileList,
  type RoomFile,
  readFiles,
  setUpFiles,
  shareActivity,
  updateFile,
} from "@/lib/realtime/room-files";
import { storage } from "@/lib/services/storage";

import {
  getDefaultFileName,
  getFileLanguage,
  getFileNameError,
  renameForLanguage,
} from "./file-name";

type Editor = monaco.editor.IStandaloneCodeEditor;

const LINE_BREAKS = /\r\n?/gu;

interface Tabs {
  activeId: string | null;
  openIds: string[];
}

const NO_TABS: Tabs = { activeId: null, openIds: [] };

// Closing the open file moves to the tab beside it, as in VS Code
const closeTabs = (tabs: Tabs, closing: Set<string>): Tabs => {
  const openIds = tabs.openIds.filter((id) => !closing.has(id));
  if (tabs.activeId === null || !closing.has(tabs.activeId)) {
    return openIds.length === tabs.openIds.length ? tabs : { ...tabs, openIds };
  }
  const index = tabs.openIds.indexOf(tabs.activeId);
  return {
    activeId: openIds[Math.min(index, openIds.length - 1)] ?? null,
    openIds,
  };
};

const describeFiles = (verb: string, items: FileContent[]) =>
  items.length === 1
    ? `${verb} ${items[0].name}`
    : `${verb} ${items.length} files`;

const getActor = () => storage.getUsername() ?? "Someone";

export interface RoomFiles {
  activeFile: RoomFile | null;
  /** Adds files, opening the last one, and returns any whose name is taken */
  addFiles: (items: FileContent[]) => FileContent[];
  closeFile: (id: string) => void;
  /** Returns why the name can't be used, if it can't */
  createFile: (name: string) => string | null;
  deleteFile: (id: string) => void;
  fileModels: FileModels | null;
  files: RoomFile[];
  /** Moves a tab in front of another, or to the end when that's null */
  moveTab: (id: string, beforeId: string | null) => void;
  openFile: (id: string) => void;
  openIds: string[];
  /** Returns why the name can't be used, if it can't */
  renameFile: (id: string, name: string) => string | null;
  /** Replaces the text of the files with these names */
  replaceFiles: (items: FileContent[]) => void;
  revealInFile: (id: string, range: monaco.IRange) => void;
  setLanguage: (id: string, language: string) => void;
}

export const useRoomFiles = (
  editor: Editor | null,
  monacoInstance: Monaco | null,
  room: RoomConnection | null
): RoomFiles => {
  const [files, setFiles] = useState<RoomFile[]>([]);
  const [tabs, setTabs] = useState(NO_TABS);
  const [fileModels, setFileModels] = useState<FileModels | null>(null);
  // The server ignores a viewer's changes, so they'd only show on their screen
  const { canEdit } = useRoomAccess();
  const hasOpenedFirstRef = useRef(false);
  const shouldFocusRef = useRef(true);
  const pendingRevealRef = useRef<{
    id: string;
    range: monaco.IRange;
  } | null>(null);

  useEffect(() => {
    if (!(editor && monacoInstance && room)) {
      return;
    }
    const { doc } = room;
    let models: FileModels | null = null;

    const start = () => {
      const savedLanguage = doc
        .getMap<unknown>(ROOM_DOC.meta)
        .get(META_LANGUAGE);
      const language =
        typeof savedLanguage === "string" ? savedLanguage : DEFAULT_LANGUAGE;
      setUpFiles(doc, getDefaultFileName(monacoInstance, language), language);
      models = createFileModels(doc, editor, monacoInstance);
      setFileModels(models);
      setFiles(readFiles(doc));
    };

    const stopObserving = observeFileList(doc, () => setFiles(readFiles(doc)));
    const stopWaiting = room.isSynced() ? undefined : room.onSynced(start);
    if (room.isSynced()) {
      start();
    }

    return () => {
      stopWaiting?.();
      stopObserving();
      models?.dispose();
      setFileModels(null);
    };
  }, [editor, monacoInstance, room]);

  // Opens the first file on arrival, and closes tabs for deleted files
  useEffect(() => {
    if (files.length === 0) {
      return;
    }
    const ids = new Set(files.map(({ id }) => id));
    if (!hasOpenedFirstRef.current) {
      hasOpenedFirstRef.current = true;
      const firstId = ids.has(MAIN_FILE_ID) ? MAIN_FILE_ID : files[0].id;
      setTabs({ activeId: firstId, openIds: [firstId] });
      return;
    }
    setTabs((current) =>
      closeTabs(current, new Set(current.openIds.filter((id) => !ids.has(id))))
    );
  }, [files]);

  useEffect(() => {
    fileModels?.show(tabs.activeId);
    room?.setPresence({ file: tabs.activeId ?? undefined });

    // The editor stays hidden while the files load, so it takes the focus
    // once the first file shows, and again for a file someone just made
    if (editor && fileModels && tabs.activeId && shouldFocusRef.current) {
      shouldFocusRef.current = false;
      editor.focus();
    }

    const pending = pendingRevealRef.current;
    if (editor && pending && pending.id === tabs.activeId) {
      pendingRevealRef.current = null;
      editor.setSelection(pending.range);
      editor.revealRangeInCenterIfOutsideViewport(pending.range);
      editor.focus();
    }
  }, [editor, fileModels, room, tabs.activeId]);

  const openFile = useCallback((id: string) => {
    setTabs((current) => {
      if (current.openIds.includes(id)) {
        return { ...current, activeId: id };
      }
      // A new tab opens beside the one in front, as in VS Code
      const openIds = [...current.openIds];
      openIds.splice(openIds.indexOf(current.activeId ?? "") + 1, 0, id);
      return { activeId: id, openIds };
    });
  }, []);

  const closeFile = useCallback((id: string) => {
    setTabs((current) => closeTabs(current, new Set([id])));
  }, []);

  const moveTab = useCallback((id: string, beforeId: string | null) => {
    setTabs((current) => {
      const openIds = current.openIds.filter((openId) => openId !== id);
      const index = beforeId === null ? -1 : openIds.indexOf(beforeId);
      openIds.splice(index === -1 ? openIds.length : index, 0, id);
      return { ...current, openIds };
    });
  }, []);

  const revealInFile = useCallback(
    (id: string, range: monaco.IRange) => {
      pendingRevealRef.current = { id, range };
      openFile(id);
      // Already in front, so the effect above won't run again
      if (editor && tabs.activeId === id) {
        pendingRevealRef.current = null;
        editor.setSelection(range);
        editor.revealRangeInCenterIfOutsideViewport(range);
        editor.focus();
      }
    },
    [editor, openFile, tabs.activeId]
  );

  const getNameError = useCallback(
    (name: string, exceptId?: string) => {
      const error = getFileNameError(name);
      if (error || !room) {
        return error;
      }
      const existing = findFileByName(room.doc, name);
      return existing && existing.id !== exceptId
        ? `${existing.name} already exists`
        : null;
    },
    [room]
  );

  const createFile = useCallback(
    (name: string) => {
      const error = canEdit ? getNameError(name) : VIEW_ONLY_MESSAGE;
      if (error || !(room && monacoInstance)) {
        return error;
      }
      const id = createFileInDoc(room.doc, {
        language: getFileLanguage(monacoInstance, name),
        name,
      });
      shareActivity(room.doc, getActor(), `created ${name}`);
      shouldFocusRef.current = true;
      openFile(id);
      return null;
    },
    [canEdit, getNameError, monacoInstance, openFile, room]
  );

  const renameFile = useCallback(
    (id: string, name: string) => {
      const error = canEdit ? getNameError(name, id) : VIEW_ONLY_MESSAGE;
      const file = room ? readFiles(room.doc).find((f) => f.id === id) : null;
      if (error || !(room && monacoInstance && file)) {
        return error;
      }
      if (file.name !== name) {
        updateFile(room.doc, id, {
          language: getFileLanguage(monacoInstance, name),
          name,
        });
        shareActivity(room.doc, getActor(), `renamed ${file.name} to ${name}`);
      }
      return null;
    },
    [canEdit, getNameError, monacoInstance, room]
  );

  const deleteFile = useCallback(
    (id: string) => {
      const roomFiles = room ? readFiles(room.doc) : [];
      const file = roomFiles.find((f) => f.id === id);
      // A room always keeps one file to write in
      if (!(canEdit && room && file) || roomFiles.length <= 1) {
        return;
      }
      deleteFileInDoc(room.doc, id);
      shareActivity(room.doc, getActor(), `deleted ${file.name}`);
    },
    [canEdit, room]
  );

  // The name follows the language too, unless another file has that name
  const setLanguage = useCallback(
    (id: string, language: string) => {
      const file = room ? readFiles(room.doc).find((f) => f.id === id) : null;
      if (!(canEdit && room && monacoInstance && file)) {
        return;
      }
      const renamed = renameForLanguage(monacoInstance, file.name, language);
      const name = getNameError(renamed, id) ? file.name : renamed;
      updateFile(room.doc, id, { language, name });
    },
    [canEdit, getNameError, monacoInstance, room]
  );

  const addFiles = useCallback(
    (items: FileContent[]) => {
      if (!(canEdit && room && monacoInstance)) {
        return [];
      }
      const added: FileContent[] = [];
      const taken: FileContent[] = [];
      let lastId: string | null = null;
      for (const item of items) {
        if (getNameError(item.name)) {
          taken.push(item);
          continue;
        }
        lastId = createFileInDoc(room.doc, {
          content: item.content.replace(LINE_BREAKS, "\n"),
          language: getFileLanguage(monacoInstance, item.name),
          name: item.name,
        });
        added.push(item);
      }
      if (lastId) {
        shareActivity(room.doc, getActor(), describeFiles("added", added));
        openFile(lastId);
      }
      return taken;
    },
    [canEdit, getNameError, monacoInstance, openFile, room]
  );

  const replaceFiles = useCallback(
    (items: FileContent[]) => {
      if (!(canEdit && room)) {
        return;
      }
      let lastId: string | null = null;
      for (const item of items) {
        const file = findFileByName(room.doc, item.name);
        if (!file) {
          continue;
        }
        if (fileModels?.getModel(file.id)) {
          fileModels.replaceText(file.id, item.content);
        } else {
          const text = getFileText(room.doc, file.id);
          room.doc.transact(() => {
            text?.delete(0, text.length);
            text?.insert(0, item.content.replace(LINE_BREAKS, "\n"));
          });
        }
        lastId = file.id;
      }
      if (lastId) {
        shareActivity(room.doc, getActor(), describeFiles("replaced", items));
        openFile(lastId);
      }
    },
    [canEdit, fileModels, openFile, room]
  );

  const activeFile = useMemo(
    () => files.find(({ id }) => id === tabs.activeId) ?? null,
    [files, tabs.activeId]
  );

  return useMemo(
    () => ({
      activeFile,
      addFiles,
      closeFile,
      createFile,
      deleteFile,
      fileModels,
      files,
      moveTab,
      openFile,
      openIds: tabs.openIds,
      renameFile,
      replaceFiles,
      revealInFile,
      setLanguage,
    }),
    [
      activeFile,
      addFiles,
      closeFile,
      createFile,
      deleteFile,
      fileModels,
      files,
      moveTab,
      openFile,
      renameFile,
      replaceFiles,
      revealInFile,
      setLanguage,
      tabs.openIds,
    ]
  );
};
