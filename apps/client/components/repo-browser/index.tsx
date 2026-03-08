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

import { Search } from "lucide-react";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import { Tree, type TreeDataItem } from "@/components/tree";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

import { LoadingState } from "./components/loading-skeleton";
import { NotFound } from "./components/not-found";
import type { ExtendedTreeDataItem } from "./types/tree";
import { fetchRepos } from "./utils/fetch-repos";
import { handleSelectItem } from "./utils/handle-select-item";
import { setItemLoading } from "./utils/set-item-loading";

interface RepoBrowserProps {
  setBranch: Dispatch<SetStateAction<string>>;
  setRepo: Dispatch<SetStateAction<string>>;
  setSelectedItem: Dispatch<SetStateAction<ExtendedTreeDataItem | null>>;
}

const RepoBrowser = memo(
  ({ setSelectedItem, setRepo, setBranch }: RepoBrowserProps) => {
    const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [text, setText] = useState("");
    const [searchQuery] = useDebounce(text, 500);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearchChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => setText(event.target.value),
      []
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
          setBranch
        );
      },
      [treeData, setSelectedItem, setRepo, setBranch]
    );

    const memoizedTree = useMemo(
      () => (
        <Tree
          className="h-full animate-fade-in"
          data={treeData}
          onSelectChange={handleSelectChangeCallback}
        />
      ),
      [treeData, handleSelectChangeCallback]
    );

    return (
      <section
        aria-label="Repository search"
        className="flex h-full flex-col rounded-md border"
      >
        <div className="relative border-b">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-busy={loading}
            aria-label="Search repositories"
            className="border-transparent pl-10 focus-visible:border-input"
            onChange={handleSearchChange}
            placeholder="Search repositories..."
            ref={searchInputRef}
            role="searchbox"
            type="search"
            value={text}
          />
        </div>
        {(() => {
          if (loading) {
            return <LoadingState />;
          }
          if (error) {
            return (
              <Alert
                className="flex h-full items-center justify-center border-none"
                variant="destructive"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            );
          }
          if (!treeData || treeData.length === 0) {
            return (
              <NotFound
                searchInputRef={searchInputRef}
                searchQuery={searchQuery}
              />
            );
          }
          return memoizedTree;
        })()}
      </section>
    );
  }
);

RepoBrowser.displayName = "RepoBrowser";

export { RepoBrowser };
