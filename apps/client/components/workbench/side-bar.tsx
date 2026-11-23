/**
 * The side bar, showing whichever view the activity bar picked.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { FilePlusIcon, FolderOpenIcon } from "@phosphor-icons/react";
import { type ReactNode, useId } from "react";

import { useRoomAccess } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { ExplorerView } from "./explorer-view";
import { ParticipantsView } from "./participants-view";
import { RepositoryView } from "./repository-view";
import { SIDE_BAR_VIEW_LABELS } from "./types";
import { ViewHeader, WorkbenchAction } from "./view-header";
import { useWorkbench } from "./workbench-provider";

export const SideBar = ({ notepad }: { notepad: ReactNode }) => {
  const { actions, layout, setCreatingFile } = useWorkbench();
  const { canEdit } = useRoomAccess();
  const { sideBarView } = layout;
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="bg-wb-chrome text-wb-fg flex h-full flex-col"
    >
      <ViewHeader id={headingId} title={SIDE_BAR_VIEW_LABELS[sideBarView]}>
        {sideBarView === "explorer" && canEdit && (
          <>
            <WorkbenchAction
              disabled={!actions}
              label="New File"
              onClick={() => setCreatingFile(true)}
            >
              <FilePlusIcon />
            </WorkbenchAction>
            <WorkbenchAction
              disabled={!actions}
              label="Open from Local"
              onClick={() => actions?.openLocal()}
            >
              <FolderOpenIcon />
            </WorkbenchAction>
          </>
        )}
      </ViewHeader>
      {/* Kept mounted, so switching views doesn't lose the notepad's place */}
      <div
        className={cn("min-h-0 flex-1", sideBarView !== "notepad" && "hidden")}
      >
        {notepad}
      </div>
      {sideBarView === "explorer" && <ExplorerView />}
      {sideBarView === "participants" && <ParticipantsView />}
      {sideBarView === "repository" && <RepositoryView />}
    </section>
  );
};
