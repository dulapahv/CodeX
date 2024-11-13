import React, {
  ChangeEvent,
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FolderSearch, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { parseError } from '@/lib/utils';
import { Tree } from '@/components/tree';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import type { ExtendedTreeDataItem } from './types/tree';
import { handleSelectItem } from './utils/handle-select-item';
import { setItemLoading } from './utils/set-item-loading';
import { transformReposToTreeData } from './utils/transform-repos-to-tree';

const LoadingState = () => (
  <div className="flex h-full flex-col space-y-4 p-4">
    <div className="flex animate-fade-in-top items-center space-x-4">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-20%)]" />
    </div>
    <div className="flex animate-fade-in-top items-center space-x-4 [animation-delay:25ms] [transition-delay:25ms]">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-30%)]" />
    </div>
    <div className="flex animate-fade-in-top items-center space-x-4 pl-6 [animation-delay:50ms] [transition-delay:50ms]">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-35%)]" />
    </div>
    <div className="flex animate-fade-in-top items-center space-x-4 pl-6 delay-75">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-25%)]" />
    </div>
    <div className="flex animate-fade-in-top items-center space-x-4 delay-100">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-15%)]" />
    </div>
  </div>
);

const EmptyState = ({
  text,
  searchInputRef,
}: {
  text: string;
  searchInputRef: RefObject<HTMLInputElement>;
}) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
    <FolderSearch
      className="mb-3 size-10 text-muted-foreground/80"
      strokeWidth={1.5}
    />
    <h3 className="mb-1.5 text-base font-medium">No repositories found</h3>
    <p className="max-w-[250px] text-sm text-muted-foreground">
      {text
        ? "We couldn't find any repositories matching your search"
        : 'Start by searching for a repository'}
    </p>
    {text && (
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
    )}
  </div>
);

interface RepoBrowserProps {
  setSelectedItem: Dispatch<SetStateAction<ExtendedTreeDataItem | null>>;
  setRepo: Dispatch<SetStateAction<string>>;
  setBranch: Dispatch<SetStateAction<string>>;
}

export function RepoBrowser({
  setSelectedItem,
  setRepo,
  setBranch,
}: RepoBrowserProps) {
  const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [searchQuery] = useDebounce(text, 500);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchRepos = useCallback(async (query?: string) => {
    if (query?.trim() === '') {
      query = undefined;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint =
        '/api/github/repos' + (query ? `?q=${encodeURIComponent(query)}` : '');
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch repositories');
      const data = await response.json();
      setTreeData(transformReposToTreeData(data.repositories));
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setText(event.target.value);
    },
    [],
  );

  // fetch repositories when search query changes
  useEffect(() => {
    fetchRepos(searchQuery);
  }, [searchQuery, fetchRepos]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return (
    <div className="flex h-full flex-col rounded-md border">
      <div className="relative border-b">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={text}
          onChange={handleSearchChange}
          placeholder="Search repositories..."
          className="border-transparent pl-10 focus-visible:border-input"
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <Alert
          variant="destructive"
          className="flex h-full items-center justify-center border-none"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !treeData || treeData.length === 0 ? (
        <EmptyState text={text} searchInputRef={searchInputRef} />
      ) : (
        <Tree
          data={treeData}
          className="h-full"
          onSelectChange={(item) =>
            handleSelectItem(
              item,
              treeData,
              setSelectedItem,
              setTreeData,
              setItemLoading,
              setError,
              setRepo,
              setBranch,
            )
          }
        />
      )}
    </div>
  );
}
