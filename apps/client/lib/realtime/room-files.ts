/**
 * The room's files in its shared document: each has a name, a language and
 * its text. The first file keeps its text where rooms with a single file
 * stored their code, so older rooms open with their code as that file.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { META_ACTIVITY, META_HAS_FILES, ROOM_DOC } from "@codex/types/realtime";
import * as Y from "yjs";

export const MAIN_FILE_ID = "main";

const NAME_KEY = "name";
const LANGUAGE_KEY = "language";
const CONTENT_KEY = "content";

export interface RoomFile {
  id: string;
  language: string;
  name: string;
}

export interface FileActivity {
  by: string;
  id: string;
  message: string;
}

const getFileMap = (doc: Y.Doc) => doc.getMap<Y.Map<unknown>>(ROOM_DOC.files);

const toRoomFile = (id: string, entry: Y.Map<unknown>): RoomFile | null => {
  const name = entry.get(NAME_KEY);
  const language = entry.get(LANGUAGE_KEY);
  return typeof name === "string" && typeof language === "string"
    ? { id, language, name }
    : null;
};

// Sorted by name like an explorer, with numbers in order (file2 before file10)
export const readFiles = (doc: Y.Doc): RoomFile[] =>
  [...getFileMap(doc)]
    .map(([id, entry]) => toRoomFile(id, entry))
    .filter((file) => file !== null)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

export const getFileText = (doc: Y.Doc, id: string): Y.Text | null => {
  if (id === MAIN_FILE_ID) {
    return getFileMap(doc).has(id) ? doc.getText(ROOM_DOC.code) : null;
  }
  const content = getFileMap(doc).get(id)?.get(CONTENT_KEY);
  return content instanceof Y.Text ? content : null;
};

export const findFileByName = (doc: Y.Doc, name: string) =>
  readFiles(doc).find(
    (file) => file.name.toLowerCase() === name.toLowerCase()
  ) ?? null;

// Typing inside a file also reaches deep observers, which only the list
// itself needs to hear about
export const observeFileList = (doc: Y.Doc, onChange: () => void) => {
  const files = getFileMap(doc);
  const observer = (events: Y.YEvent<Y.AbstractType<unknown>>[]) => {
    if (events.some(({ target }) => !(target instanceof Y.Text))) {
      onChange();
    }
  };
  files.observeDeep(observer);
  return () => files.unobserveDeep(observer);
};

// Wait for the room to sync first, or a new arrival could add a first file
// over the one the room already has
export const setUpFiles = (doc: Y.Doc, name: string, language: string) => {
  const meta = doc.getMap<unknown>(ROOM_DOC.meta);
  if (meta.get(META_HAS_FILES)) {
    return;
  }
  doc.transact(() => {
    const entry = new Y.Map<unknown>();
    entry.set(NAME_KEY, name);
    entry.set(LANGUAGE_KEY, language);
    getFileMap(doc).set(MAIN_FILE_ID, entry);
    meta.set(META_HAS_FILES, true);
  });
};

export const createFile = (
  doc: Y.Doc,
  { content = "", language, name }: Omit<RoomFile, "id"> & { content?: string }
) => {
  const id = crypto.randomUUID();
  doc.transact(() => {
    const entry = new Y.Map<unknown>();
    entry.set(NAME_KEY, name);
    entry.set(LANGUAGE_KEY, language);
    entry.set(CONTENT_KEY, new Y.Text(content));
    getFileMap(doc).set(id, entry);
  });
  return id;
};

export const updateFile = (
  doc: Y.Doc,
  id: string,
  changes: Partial<Omit<RoomFile, "id">>
) => {
  const entry = getFileMap(doc).get(id);
  if (!entry) {
    return;
  }
  doc.transact(() => {
    if (changes.name !== undefined) {
      entry.set(NAME_KEY, changes.name);
    }
    if (changes.language !== undefined) {
      entry.set(LANGUAGE_KEY, changes.language);
    }
  });
};

export const deleteFile = (doc: Y.Doc, id: string) => {
  doc.transact(() => {
    // The first file's text lives outside the list, so it's emptied instead
    if (id === MAIN_FILE_ID) {
      const text = doc.getText(ROOM_DOC.code);
      text.delete(0, text.length);
    }
    getFileMap(doc).delete(id);
  });
};

export const shareActivity = (doc: Y.Doc, by: string, message: string) => {
  const activity: FileActivity = { by, id: crypto.randomUUID(), message };
  doc.getMap<unknown>(ROOM_DOC.meta).set(META_ACTIVITY, activity);
};

export const isFileActivity = (value: unknown): value is FileActivity =>
  typeof value === "object" &&
  value !== null &&
  "by" in value &&
  typeof value.by === "string" &&
  "id" in value &&
  typeof value.id === "string" &&
  "message" in value &&
  typeof value.message === "string";

// Hears every change to the files, their text included
export const observeFileContents = (doc: Y.Doc, onChange: () => void) => {
  const files = getFileMap(doc);
  const mainText = doc.getText(ROOM_DOC.code);
  const listener = () => onChange();
  files.observeDeep(listener);
  mainText.observe(listener);
  return () => {
    files.unobserveDeep(listener);
    mainText.unobserve(listener);
  };
};
