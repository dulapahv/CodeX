/**
 * Repository browser component for GitHub integration.
 * Features:
 * - Repository search
 * - Tree navigation
 * - File selection
 * - Loading states
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tree, type TreeDataItem } from '@/components/tree';

import { LoadingState } from './components/loading-skeleton';
import { NotFound } from './components/not-found';
import type { ExtendedTreeDataItem } from './types/tree';
import { fetchRepos } from './utils/fetch-repos';
import { handleSelectItem } from './utils/handle-select-item';
import { setItemLoading } from './utils/set-item-loading';

interface RepoBrowserProps {
  setSelectedItem: Dispatch<SetStateAction<ExtendedTreeDataItem | null>>;
  setRepo: Dispatch<SetStateAction<string>>;
  setBranch: Dispatch<SetStateAction<string>>;
}

const RepoBrowser = memo(
  ({ setSelectedItem, setRepo, setBranch }: RepoBrowserProps) => {
    const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [text, setText] = useState('');
    const [searchQuery] = useDebounce(text, 500);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearchChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => setText(event.target.value),
      [],
    );

    const fetchReposCallback = useCallback(() => {
      fetchRepos(setLoading, setError, setTreeData, searchQuery);
    }, [searchQuery]);

    useEffect(() => {
      fetchRepos(setLoading, setError, setTreeData);
    }, []);

    useEffect(() => {
      fetchReposCallback();
    }, [fetchReposCallback]);

    const handleSelectChangeCallback = useCallback(
      (item: TreeDataItem) => {
        handleSelectItem(
          item as ExtendedTreeDataItem,
          treeData,
          setSelectedItem,
          setTreeData,
          setItemLoading,
          setError,
          setRepo,
          setBranch,
        );
      },
      [treeData, setSelectedItem, setTreeData, setError, setRepo, setBranch],
    );

    const memoizedTree = useMemo(
      () => (
        <Tree
          data={treeData}
          className="animate-fade-in h-full"
          onSelectChange={handleSelectChangeCallback}
        />
      ),
      [treeData, handleSelectChangeCallback],
    );

    return (
      <div
        className="flex h-full flex-col rounded-md border"
        role="region"
        aria-label="Repository search"
      >
        <div className="relative border-b">
          <Search
            className="text-muted-foreground absolute left-4 top-1/2 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            value={text}
            onChange={handleSearchChange}
            placeholder="Search repositories..."
            className="focus-visible:border-input border-transparent pl-10"
            type="search"
            role="searchbox"
            aria-label="Search repositories"
            aria-busy={loading}
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
          <NotFound searchQuery={searchQuery} searchInputRef={searchInputRef} />
        ) : (
          memoizedTree
        )}
      </div>
    );
  },
);

RepoBrowser.displayName = 'RepoBrowser';

export { RepoBrowser };
