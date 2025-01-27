/**
 * Not found component for repository browser search results.
 * Features:
 * - Search status display
 * - Query highlight
 * - Return to search button
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { RefObject } from 'react';

import { FolderSearch } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface RepoBrowserProps {
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export const NotFound = ({ searchQuery, searchInputRef }: RepoBrowserProps) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <FolderSearch
      className="text-muted-foreground/80 mb-3 size-10"
      strokeWidth={1.5}
    />
    <h3 className="mb-1.5 text-base font-medium">No repositories found</h3>
    <p className="text-muted-foreground max-w-[250px] text-sm">
      Your search for &quot;<strong>{searchQuery}</strong>&quot; did not return
      any results.
    </p>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        searchInputRef.current?.focus();
      }}
      className="mt-3 h-8"
    >
      Try another search
    </Button>
  </div>
);
