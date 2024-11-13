import { RefObject } from 'react';
import { FolderSearch } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface RepoBrowserProps {
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement>;
}

export const NotFound = ({ searchQuery, searchInputRef }: RepoBrowserProps) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <FolderSearch
      className="mb-3 size-10 text-muted-foreground/80"
      strokeWidth={1.5}
    />
    <h3 className="mb-1.5 text-base font-medium">No repositories found</h3>
    <p className="max-w-[250px] text-sm text-muted-foreground">
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
