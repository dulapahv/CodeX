/**
 * Not found component for repository browser search results.
 * Features:
 * - Search status display
 * - Query highlight
 * - Return to search button
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { FolderDashedIcon } from "@phosphor-icons/react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";

interface RepoBrowserProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
}

export const NotFound = ({ searchQuery, searchInputRef }: RepoBrowserProps) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <FolderDashedIcon
      className="text-muted-foreground/80 mb-3 size-10"
      weight="light"
    />
    <h3 className="mb-1.5 text-base font-medium">No repositories found</h3>
    <p className="text-muted-foreground max-w-[250px] text-sm">
      Your search for &quot;<strong>{searchQuery}</strong>&quot; did not return
      any results.
    </p>
    <Button
      className="mt-3 h-8"
      onClick={() => {
        searchInputRef.current?.focus();
      }}
      size="sm"
      variant="ghost"
    >
      Try another search
    </Button>
  </div>
);
