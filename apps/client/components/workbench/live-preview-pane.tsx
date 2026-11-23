/**
 * The live preview of the room's page: the open HTML file, or index.html
 * while a stylesheet or script is open, with the room's CSS and JavaScript
 * files it links to pulled in.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import type * as Y from "yjs";

import { LivePreview } from "@/components/live-preview";
import { useRoomConnection } from "@/lib/realtime/room-context";
import {
  getFileText,
  observeFileContents,
  type RoomFile,
  readFiles,
} from "@/lib/realtime/room-files";

import { useWorkbench } from "./workbench-provider";

const PREVIEW_DELAY_MS = 300;

const LINK_TAG = /<link\b[^>]*>/giu;
const SCRIPT_TAG = /<script\b[^>]*>\s*<\/script\s*>/giu;
const HREF = /\bhref\s*=\s*["'](?<href>[^"']+)["']/iu;
const SRC = /\s*\bsrc\s*=\s*["'](?<src>[^"']+)["']/iu;
const STYLESHEET = /\brel\s*=\s*["']?stylesheet/iu;
const LEADING_DOT_SLASH = /^\.\//u;
const CLOSING_STYLE = /<\/style/giu;
const CLOSING_SCRIPT = /<\/script/giu;

const pickPage = (files: RoomFile[], activeId: string | null) => {
  const active = files.find(({ id }) => id === activeId);
  if (active?.language === "html") {
    return active;
  }
  return (
    files.find(({ name }) => name.toLowerCase() === "index.html") ??
    files.find(({ language }) => language === "html") ??
    active ??
    null
  );
};

export const buildPreviewSource = (doc: Y.Doc, activeId: string | null) => {
  const files = readFiles(doc);
  const page = pickPage(files, activeId);
  if (!page) {
    return "";
  }
  const read = ({ id }: RoomFile) => getFileText(doc, id)?.toString() ?? "";
  const byName = new Map(files.map((file) => [file.name.toLowerCase(), file]));
  const findLocal = (path: string) =>
    byName.get(path.replace(LEADING_DOT_SLASH, "").toLowerCase());

  return (
    read(page)
      .replace(LINK_TAG, (tag) => {
        const href = HREF.exec(tag)?.groups?.href;
        const file = href && STYLESHEET.test(tag) ? findLocal(href) : undefined;
        return file
          ? `<style>${read(file).replace(CLOSING_STYLE, "<\\/style")}</style>`
          : tag;
      })
      // Keeps the tag's other attributes, such as type="module"
      .replace(SCRIPT_TAG, (tag) => {
        const src = SRC.exec(tag)?.groups?.src;
        const file = src ? findLocal(src) : undefined;
        if (!file) {
          return tag;
        }
        const opening = tag.slice(0, tag.indexOf(">") + 1).replace(SRC, "");
        return `${opening}${read(file).replace(CLOSING_SCRIPT, "<\\/script")}</script>`;
      })
  );
};

export const LivePreviewPane = () => {
  const room = useRoomConnection();
  const { files } = useWorkbench();
  const activeId = files.activeFile?.id ?? null;
  const [source, setSource] = useState("");
  const [debouncedSource] = useDebounce(source, PREVIEW_DELAY_MS);

  useEffect(() => {
    if (!room) {
      return;
    }
    const update = () => setSource(buildPreviewSource(room.doc, activeId));
    update();
    return observeFileContents(room.doc, update);
  }, [activeId, room]);

  return <LivePreview value={debouncedSource} />;
};
