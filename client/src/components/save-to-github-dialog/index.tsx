import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useMediaQuery } from '@/hooks/use-media-query';
import { RepoTree } from '@/components/repo-tree';
import type { ExtendedTreeDataItem } from '@/components/repo-tree/types/tree';
import {
  AlertDialog,
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
import { CommitForm } from './types/form';

export interface SaveToGithubDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

export const SaveToGithubDialog = forwardRef<SaveToGithubDialogRef>(
  (props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] =
      useState<ExtendedTreeDataItem | null>(null);
    const [branch, setBranch] = useState('');
    const [path, setPath] = useState('');

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
      setPath('');
    }, []);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    useEffect(() => {
      console.log('branch:', branch);
      console.log('path:', path);
    }, [branch, path]);

    const onSubmit = useCallback(
      async (data: CommitForm) => {
        console.log('SAVE', data);
        if (!selectedItem) return;
        console.log('Saving to:', {
          item: selectedItem,
          filename: data.fileName,
          commitMessage: data.commitSummary,
          extendedDescription: data.extendedDescription,
          branch: branch,
          path: path,
        });
        // closeDialog();
      },
      [selectedItem, path, closeDialog],
    );

    const onError = () => {
      toast.error('Please check the information and try again.');
    };

    const formContent = (
      <>
        {/* Tree Container */}
        <div className="mx-4 min-h-10 flex-1 rounded-md border md:mx-0 md:mb-0">
          <RepoTree
            setSelectedItem={setSelectedItem}
            setBranch={setBranch}
            setPath={setPath}
          />
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
            <DrawerHeader className="flex-shrink-0 text-left">
              <DrawerTitle>Save to GitHub</DrawerTitle>
              <DrawerDescription>
                Select a repository, branch, and folder to save your code.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
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
