/**
 * Footer of the repository dialogs: the target path and where to disconnect.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Settings } from "lucide-react";

import { PROVIDER_LABELS, type ProviderId } from "@/lib/git-providers/types";

interface GitFooterInfoProps {
  actionLabel: string;
  displayPath: string;
  provider: ProviderId;
}

export const GitFooterInfo = ({
  actionLabel,
  displayPath,
  provider,
}: GitFooterInfoProps) => (
  <div className="w-full">
    <p className="break-all text-muted-foreground text-xs">
      {actionLabel} <span className="font-semibold">{displayPath}</span>
    </p>
    <div className="flex flex-wrap items-center text-muted-foreground text-xs">
      <span>To disconnect {PROVIDER_LABELS[provider]}, go to</span>
      <span className="flex items-center font-semibold">
        <Settings aria-hidden="true" className="mx-1 inline size-3" />
        Settings
      </span>
      .
    </div>
  </div>
);
