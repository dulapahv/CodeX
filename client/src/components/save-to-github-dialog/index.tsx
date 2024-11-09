import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { FileCode, Folder, GitBranch, Loader2 } from 'lucide-react';

import { parseError } from '@/lib/utils';
import { Tree, type TreeDataItem } from '@/components/tree';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// API response types
interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
}

interface GithubBranch {
  name: string;
}

interface GithubContent {
  name: string;
  path: string;
  type: 'dir' | 'file';
}

// Extended interface for GitHub-specific functionality
interface ExtendedTreeDataItem extends Omit<TreeDataItem, 'type'> {
  full_name?: string;
  path?: string;
  type?: 'repo' | 'branch' | 'dir' | 'file';
  children?: ExtendedTreeDataItem[]; // Override children type
}

// Transform functions remain the same
const transformReposToTreeData = (
  repos: GithubRepo[],
): ExtendedTreeDataItem[] => {
  if (!repos) return [];
  return repos.map((repo) => ({
    id: repo.id.toString(),
    name: repo.name,
    full_name: repo.full_name,
    children: undefined,
    icon: Folder,
    type: 'repo',
  }));
};

const transformBranchesToTreeData = (
  branches: GithubBranch[],
): ExtendedTreeDataItem[] => {
  if (!branches) return [];
  return branches.map((branch) => ({
    id: `branch-${branch.name}`,
    name: branch.name,
    children: undefined,
    icon: GitBranch,
    type: 'branch',
  }));
};

const transformContentsToTreeData = (
  contents: GithubContent[],
): ExtendedTreeDataItem[] => {
  if (!contents) return [];
  return contents
    .filter((item) => item.type === 'dir' || item.type === 'file')
    .map((item) => ({
      id: `content-${item.path}`,
      name: item.name,
      path: item.path,
      children: item.type === 'dir' ? undefined : undefined,
      icon: item.type === 'dir' ? Folder : FileCode,
      type: item.type,
    }));
};

interface SaveToGithubDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

const SaveToGithubDialog = forwardRef<SaveToGithubDialogRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(
    null,
  );
  const [filename, setFilename] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [currentPath, setCurrentPath] = useState('');

  // All the fetch and utility functions remain the same
  const setItemLoading = useCallback((itemId: string, isLoading: boolean) => {
    setTreeData((prevData) => {
      const updateChildren = (
        items: ExtendedTreeDataItem[],
      ): ExtendedTreeDataItem[] => {
        return items.map((item) => {
          if (item.id === itemId) {
            return { ...item, isLoading };
          }
          if (item.children) {
            const extendedChildren = item.children;
            return {
              ...item,
              children: updateChildren(extendedChildren),
            };
          }
          return item;
        });
      };
      return updateChildren(prevData);
    });
  }, []);

  // Fetch functions remain the same...
  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/oauth/repos/github');
      if (!response.ok) throw new Error('Failed to fetch repositories');
      const data = await response.json();
      setTreeData(transformReposToTreeData(data.repositories));
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(
    async (repo: ExtendedTreeDataItem) => {
      if (!repo.full_name) return;

      setItemLoading(repo.id, true);
      setError('');
      try {
        const [owner, repoName] = repo.full_name.split('/');
        const response = await fetch(
          `/api/oauth/repos/github/branches/${owner}/${repoName}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch branches');
        }

        const branches = await response.json();
        const branchData = transformBranchesToTreeData(branches);

        setTreeData((prevData) =>
          prevData.map((item) =>
            item.id === repo.id
              ? { ...item, children: branchData, isLoading: false }
              : item,
          ),
        );
      } catch (err) {
        setError(parseError(err));
        setItemLoading(repo.id, false);
      }
    },
    [setItemLoading],
  );

  const fetchContents = useCallback(
    async (
      repo: ExtendedTreeDataItem,
      branch: ExtendedTreeDataItem,
      path = '',
    ) => {
      if (!repo.full_name) return;

      setItemLoading(branch.id, true);
      setError('');
      try {
        const [owner, repoName] = repo.full_name.split('/');
        const response = await fetch(
          `/api/oauth/repos/github/contents/${owner}/${repoName}?path=${encodeURIComponent(
            path,
          )}&ref=${encodeURIComponent(branch.name)}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch contents');
        }

        const contents = await response.json();
        const contentData = transformContentsToTreeData(contents);

        setTreeData((prevData) => {
          return prevData.map((repoItem) => {
            if (repoItem.id === repo.id) {
              return {
                ...repoItem,
                children: repoItem.children?.map((branchItem) => {
                  if (branchItem.id === branch.id) {
                    return {
                      ...branchItem,
                      children: contentData,
                      isLoading: false,
                    };
                  }
                  return branchItem;
                }),
              };
            }
            return repoItem;
          });
        });
      } catch (err) {
        setError(parseError(err));
        setItemLoading(branch.id, false);
      }
    },
    [setItemLoading],
  );

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen, fetchRepos]);

  const handleSelectItem = useCallback(
    async (item: TreeDataItem) => {
      const extendedItem = item as ExtendedTreeDataItem;
      setSelectedItem(extendedItem);

      if (extendedItem.type === 'repo' && !item.children) {
        await fetchBranches(extendedItem);
      } else if (extendedItem.type === 'branch' && !item.children) {
        const parentRepo = treeData.find((repo) =>
          repo.children?.some((branch) => branch.id === item.id),
        );
        if (parentRepo) {
          await fetchContents(parentRepo, extendedItem);
        }
      } else if (extendedItem.type === 'dir' && !item.children) {
        const parentRepo = treeData.find((repo) =>
          repo.children?.some((branch) =>
            branch.children?.some((content) => content.id === item.id),
          ),
        );
        const parentBranch = parentRepo?.children?.find((branch) =>
          branch.children?.some((content) => content.id === item.id),
        );

        if (parentRepo && parentBranch && extendedItem.path) {
          await fetchContents(parentRepo, parentBranch, extendedItem.path);
        }
      }
    },
    [treeData, fetchBranches, fetchContents],
  );

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
    setFilename('');
    setCommitMessage('');
    setCurrentPath('');
    setTreeData([]);
  }, []);

  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  const handleSave = useCallback(async () => {
    if (!selectedItem) return;
    console.log('Saving to:', {
      item: selectedItem,
      filename,
      commitMessage,
      path: currentPath,
    });
    closeDialog();
  }, [selectedItem, filename, commitMessage, currentPath, closeDialog]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="flex h-[80vh] flex-col gap-4 sm:max-w-2xl">
        <AlertDialogHeader className="flex-shrink-0 text-left">
          <AlertDialogTitle>Save to GitHub</AlertDialogTitle>
          <AlertDialogDescription>
            Select a repository, branch, and folder to save your code.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* Tree Container */}
          <div className="min-h-0 flex-1 rounded-md border">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <Tree
                data={treeData}
                className="h-full"
                onSelectChange={handleSelectItem}
                folderIcon={Folder}
                itemIcon={FileCode}
              />
            )}
          </div>

          {/* Input Fields Container */}
          <div className="flex-shrink-0 space-y-3">
            <Input
              placeholder="Filename (e.g., script.js)"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
            <Textarea
              placeholder="Commit message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="h-20 resize-none"
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <Button
            onClick={handleSave}
            disabled={!selectedItem || !filename || !commitMessage.trim()}
            asChild
          >
            <AlertDialogAction>Save</AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

SaveToGithubDialog.displayName = 'SaveToGithubDialog';

export { SaveToGithubDialog };
