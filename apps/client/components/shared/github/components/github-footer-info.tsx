/**
 * GitHub footer information component.
 * Displays file path and disconnect instructions.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Settings } from "lucide-react";

interface GithubFooterInfoProps {
  actionLabel?: string;
  displayPath: string;
  githubUser: string | null;
}

export const GithubFooterInfo = ({
  githubUser,
  displayPath,
  actionLabel = "File",
}: GithubFooterInfoProps) => {
  if (!githubUser) {
    return null;
  }

  return (
    <div className="w-full">
      <p className="break-all text-muted-foreground text-xs">
        {actionLabel} <span className="font-semibold">{displayPath}</span>
      </p>
      <div className="flex flex-wrap items-center text-muted-foreground text-xs">
        <span>To disconnect GitHub, go to</span>
        <span className="flex items-center font-semibold">
          <Settings aria-hidden="true" className="mx-1 inline size-3" />
          Settings
        </span>
        .
      </div>
    </div>
  );
};
