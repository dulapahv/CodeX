/**
 * Side bar view for opening code from a git provider or saving it as a
 * commit, with the accounts it uses.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { CloudArrowUpIcon, GitForkIcon } from "@phosphor-icons/react";
import { useId } from "react";

import { RepositoryConnections } from "@/components/settings-sheet/components/repository-connections";
import { Button } from "@/components/ui/button";
import { useRoomAccess } from "@/lib/realtime/room-context";

import { useWorkbench } from "./workbench-provider";

export const RepositoryView = () => {
  const { actions } = useWorkbench();
  const { canEdit } = useRoomAccess();
  const accountsId = useId();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-1 pb-4 text-xs">
      <div className="flex flex-col gap-2">
        <p className="text-wb-muted">
          Open a file from GitHub, GitLab, Bitbucket or Codeberg, or save the
          editor's code to one as a commit.
        </p>
        <Button
          className="bg-wb-accent hover:bg-wb-accent/90 h-7 w-full text-xs text-white"
          disabled={!(actions && canEdit)}
          onClick={actions?.openRepository}
        >
          <GitForkIcon aria-hidden="true" className="size-4" />
          <span className="truncate">Open from Repository…</span>
        </Button>
        <Button
          className="border-wb-border text-wb-fg hover:bg-wb-hover hover:text-wb-fg h-7 w-full bg-transparent text-xs dark:bg-transparent"
          disabled={!actions}
          onClick={actions?.saveRepository}
          variant="outline"
        >
          <CloudArrowUpIcon aria-hidden="true" className="size-4" />
          <span className="truncate">Save to Repository…</span>
        </Button>
      </div>
      <section aria-labelledby={accountsId} className="flex flex-col gap-3">
        <h3
          className="text-wb-fg text-[11px] tracking-wide uppercase"
          id={accountsId}
        >
          Accounts
        </h3>
        <RepositoryConnections isOpen />
      </section>
    </div>
  );
};
