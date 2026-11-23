/**
 * Which parts of the room's VS Code-style layout are showing.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export type SideBarView =
  | "explorer"
  | "notepad"
  | "participants"
  | "repository";

export type PanelView = "problems" | "terminal";

export const isPanelView = (value: unknown): value is PanelView =>
  value === "problems" || value === "terminal";

export interface WorkbenchLayout {
  isCallOpen: boolean;
  isPanelOpen: boolean;
  isPreviewOpen: boolean;
  isSideBarOpen: boolean;
  panelView: PanelView;
  sideBarView: SideBarView;
}

export const SIDE_BAR_VIEW_LABELS: Record<SideBarView, string> = {
  explorer: "Explorer",
  notepad: "Notepad",
  participants: "Participants",
  repository: "Repository",
};
