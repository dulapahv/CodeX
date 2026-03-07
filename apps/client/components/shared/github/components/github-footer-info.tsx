/**
 * GitHub footer information component.
 * Displays file path and disconnect instructions.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Settings } from 'lucide-react';

interface GithubFooterInfoProps {
  githubUser: string | null;
  displayPath: string;
  actionLabel?: string;
}

export const GithubFooterInfo = ({
  githubUser,
  displayPath,
  actionLabel = 'File'
}: GithubFooterInfoProps) => {
  if (!githubUser) return null;

  return (
    <div className="w-full">
      <p className="text-muted-foreground break-all text-xs">
        {actionLabel} <span className="font-semibold">{displayPath}</span>
      </p>
      <div className="text-muted-foreground flex flex-wrap items-center text-xs">
        <span>To disconnect GitHub, go to</span>
        <span className="flex items-center font-semibold">
          <Settings className="mx-1 inline size-3" aria-hidden="true" />
          Settings
        </span>
        .
      </div>
    </div>
  );
};
