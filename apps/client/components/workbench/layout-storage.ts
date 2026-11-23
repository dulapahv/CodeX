/**
 * Remembers each person's layout between visits: which parts are open, the
 * side bar and panel views, and the panel sizes.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { LayoutStorage } from "react-resizable-panels";

import {
  isPanelView,
  SIDE_BAR_VIEW_LABELS,
  type SideBarView,
  type WorkbenchLayout,
} from "./types";

const LAYOUT_KEY = "codex-workbench-layout";

export const DEFAULT_LAYOUT: WorkbenchLayout = {
  isCallOpen: true,
  isPanelOpen: true,
  isPreviewOpen: true,
  isSideBarOpen: true,
  panelView: "terminal",
  sideBarView: "notepad",
};

const isSideBarView = (value: unknown): value is SideBarView =>
  typeof value === "string" && value in SIDE_BAR_VIEW_LABELS;

const pickBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

// Storage can be blocked or full, which only means the layout isn't kept
export const layoutStorage: LayoutStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // See above
    }
  },
};

export const readLayout = (): WorkbenchLayout => {
  let saved: unknown;
  try {
    saved = JSON.parse(layoutStorage.getItem(LAYOUT_KEY) ?? "null");
  } catch {
    return DEFAULT_LAYOUT;
  }
  if (typeof saved !== "object" || saved === null) {
    return DEFAULT_LAYOUT;
  }
  const layout = saved as Record<string, unknown>;
  return {
    isCallOpen: pickBoolean(layout.isCallOpen, DEFAULT_LAYOUT.isCallOpen),
    isPanelOpen: pickBoolean(layout.isPanelOpen, DEFAULT_LAYOUT.isPanelOpen),
    isPreviewOpen: pickBoolean(
      layout.isPreviewOpen,
      DEFAULT_LAYOUT.isPreviewOpen
    ),
    isSideBarOpen: pickBoolean(
      layout.isSideBarOpen,
      DEFAULT_LAYOUT.isSideBarOpen
    ),
    panelView: isPanelView(layout.panelView)
      ? layout.panelView
      : DEFAULT_LAYOUT.panelView,
    sideBarView: isSideBarView(layout.sideBarView)
      ? layout.sideBarView
      : DEFAULT_LAYOUT.sideBarView,
  };
};

export const writeLayout = (layout: WorkbenchLayout) =>
  layoutStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
