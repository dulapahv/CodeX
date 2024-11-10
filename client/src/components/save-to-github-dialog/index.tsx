import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { FileCode, Folder, Loader2, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Tree, type TreeDataItem } from '@/components/tree';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useCommitForm } from './hooks/useCommitForm';
import { CommitForm } from './types/github';
import type { ExtendedTreeDataItem } from './types/tree';
import { handleSelectItem } from './utils/handle-select-item';
import { setItemLoading } from './utils/set-item-loading';
import { transformBranchesToTreeData } from './utils/transform-branches-to-tree';
import { transformContentsToTreeData } from './utils/transform-contents-to-tree';
import { transformReposToTreeData } from './utils/transform-repos-to-tree';

export interface SaveToGithubDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

export const SaveToGithubDialog = forwardRef<SaveToGithubDialogRef>(
  (props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [treeData, setTreeData] = useState<ExtendedTreeDataItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] =
      useState<ExtendedTreeDataItem | null>(null);
    const [currentPath, setCurrentPath] = useState('');

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useCommitForm();

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => {
      setIsOpen(false);
      setSelectedItem(null);
      setCurrentPath('');
      setTreeData([]);
    }, []);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

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

    useEffect(() => {
      if (isOpen) {
        fetchRepos();
      }
    }, [isOpen, fetchRepos]);

    const onSubmit = useCallback(
      async (data: CommitForm) => {
        console.log('SAVE', data);
        if (!selectedItem) return;
        console.log('Saving to:', {
          item: selectedItem,
          filename: data.fileName,
          commitMessage: data.commitSummary,
          extendedDescription: data.extendedDescription,
          path: currentPath,
        });
        // closeDialog();
      },
      [selectedItem, currentPath, closeDialog],
    );

    const onError = () => {
      toast.error('Please check the information and try again.');
    };

    const formContent = (
      <>
        {/* Tree Container */}
        <div className="mx-4 min-h-10 flex-1 rounded-md border md:mx-0 md:mb-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin" />
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
                )
              }
              folderIcon={Folder}
              itemIcon={FileCode}
            />
          )}
        </div>

        {/* Input Fields Container */}
        <div className="mx-4 flex-shrink-0 space-y-3 md:mx-0">
          <Input
            placeholder="Filename (e.g., hello.js)"
            {...register('fileName')}
          />
          {errors.fileName && (
            <p className="text-sm text-red-500">{errors.fileName.message}</p>
          )}
          <Input placeholder="Commit summary" {...register('commitSummary')} />
          {errors.commitSummary && (
            <p className="text-sm text-red-500">
              {errors.commitSummary.message}
            </p>
          )}
          <Textarea
            placeholder="Extended description (Optional)"
            className="h-20 resize-none placeholder:text-sm"
            {...register('extendedDescription')}
          />
        </div>
      </>
    );

    if (isDesktop) {
      return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent className="flex h-[90vh] flex-col gap-4 sm:max-w-2xl">
            <AlertDialogHeader className="flex-shrink-0 text-left">
              <AlertDialogTitle>Save to GitHub</AlertDialogTitle>
              <AlertDialogDescription>
                Select a repository, branch, and folder to save your code.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {formContent}
            <form onSubmit={handleSubmit(onSubmit, onError)}>
              <AlertDialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isSubmitting && (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
        <DrawerContent className="first:[&>div]:bg-transparent">
          {/* Main content wrapper with flex and scrolling */}
          <div className="flex h-[90vh] flex-col">
            <DrawerHeader className="mx-4 flex-shrink-0">
              <DrawerTitle>Save to GitHub</DrawerTitle>
              <DrawerDescription>
                Select a repository, branch, and folder to save your code.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              {formContent}
            </div>
            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="flex-shrink-0"
            >
              <DrawerFooter>
                <Button type="submit">
                  {isSubmitting && (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    );
  },
);

SaveToGithubDialog.displayName = 'SaveToGithubDialog';
