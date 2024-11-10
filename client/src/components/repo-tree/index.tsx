import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { LoaderCircle } from 'lucide-react';

import { parseError } from '@/lib/utils';
import { Tree } from '@/components/tree';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { ExtendedTreeDataItem } from './types/tree';
import { handleSelectItem } from './utils/handle-select-item';
import { setItemLoading } from './utils/set-item-loading';
import { transformReposToTreeData } from './utils/transform-repos-to-tree';

interface RepoTreeProps {
  setSelectedItem: Dispatch<SetStateAction<ExtendedTreeDataItem | null>>;
  setBranch: Dispatch<SetStateAction<string>>;
  setPath: Dispatch<SetStateAction<string>>;
}

export function RepoTree({
  setSelectedItem,
  setBranch,
  setPath,
}: RepoTreeProps) {
  const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/github/repos');
      if (!response.ok) throw new Error('Failed to fetch repositories');
      const data = await response.json();
      setTreeData(transformReposToTreeData(data.repositories));
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return loading ? (
    <div className="flex h-full items-center justify-center">
      <LoaderCircle className="size-6 animate-spin" />
    </div>
  ) : error ? (
    <Alert variant="destructive" className="border-none">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
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
          setBranch,
          setPath,
        )
      }
    />
  );
}
