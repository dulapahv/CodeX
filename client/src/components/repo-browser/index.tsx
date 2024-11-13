import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { Tree } from '@/components/tree';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

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

const RepoBrowser = ({
  setSelectedItem,
  setRepo,
  setBranch,
}: RepoBrowserProps) => {
  const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [searchQuery] = useDebounce(text, 500);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) =>
    setText(event.target.value);

  useEffect(() => {
    fetchRepos(setLoading, setError, setTreeData);
  }, []);

  useEffect(() => {
    fetchRepos(setLoading, setError, setTreeData, searchQuery);
  }, [searchQuery]);

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
        <NotFound searchQuery={searchQuery} searchInputRef={searchInputRef} />
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
};

export { RepoBrowser };
