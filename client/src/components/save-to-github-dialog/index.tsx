import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { RepoTree } from '@/components/repo-tree';
import {
  itemType,
  type ExtendedTreeDataItem,
} from '@/components/repo-tree/types/tree';
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

interface CommitResponse {
  content: {
    html_url: string;
    sha: string;
  };
}

export const SaveToGithubDialog = forwardRef<SaveToGithubDialogRef>(
  (props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] =
      useState<ExtendedTreeDataItem | null>(null);
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('');

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const {
      register,
      handleSubmit,
      setValue,
      clearErrors,
      reset,
      formState: { errors, isSubmitting },
    } = useCommitForm();

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => {
      if (!isSubmitting) {
        setIsOpen(false);
        setSelectedItem(null);
        reset();
      }
    }, [isSubmitting, reset]);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    useEffect(() => {
      const fileName =
        selectedItem?.type === itemType.FILE ? selectedItem.name : '';
      if (fileName) {
        setValue('fileName', fileName);
        clearErrors('fileName');
      }
    }, [selectedItem, setValue, clearErrors]);

    const commitChanges = async (data: CommitForm) => {
      if (!selectedItem) throw new Error('No file selected');

      const commitData = {
        repo: repo,
        branch: branch,
        path: selectedItem.path || '',
        filename: data.fileName,
        commitMessage: data.commitSummary,
        extendedDescription: data.extendedDescription,
        content: btoa('Hello World!'),
      };

      const response = await fetch('/api/github/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to commit changes');
      }

      return (await response.json()) as CommitResponse;
    };

    const onSubmit = useCallback(
      async (data: CommitForm) => {
        await toast.promise(commitChanges(data), {
          loading: 'Committing changes...',
          success: (result) => {
            closeDialog();
            return (
              <div className="flex flex-col text-sm">
                <p>Changes committed successfully!</p>
                <a
                  href={result.content.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View on GitHub
                </a>
              </div>
            );
          },
          error: (err) => (
            <div className="flex flex-col text-sm">
              <p>Failed to commit changes</p>
              <p>{parseError(err)}</p>
            </div>
          ),
        });
      },
      [selectedItem, repo, branch],
    );

    const onError = () => {
      toast.error('Please check the information and try again.');
    };

    const email = 'TEST_EMAIL@GMAIL.COM';

    const formContent = (
      <>
        <div className="mx-4 min-h-10 flex-1 rounded-md border md:mx-0 md:mb-0">
          <RepoTree
            setSelectedItem={setSelectedItem}
            setRepo={setRepo}
            setBranch={setBranch}
          />
        </div>

        <div className="mx-4 flex-shrink-0 space-y-3 md:mx-0">
          <Input
            placeholder="Filename (e.g., hello.js)"
            disabled={isSubmitting}
            {...register('fileName')}
          />
          {errors.fileName && (
            <p className="text-sm text-red-500">{errors.fileName.message}</p>
          )}
          <Input
            placeholder="Commit summary"
            disabled={isSubmitting}
            {...register('commitSummary')}
          />
          {errors.commitSummary && (
            <p className="text-sm text-red-500">
              {errors.commitSummary.message}
            </p>
          )}
          <Textarea
            placeholder="Extended description (Optional)"
            className="h-20 resize-none placeholder:text-sm"
            disabled={isSubmitting}
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
              <AlertDialogFooter className="flex items-center justify-between gap-2 sm:gap-0">
                <p className="w-full text-sm text-muted-foreground">
                  Commit Email: <span className="font-semibold">{email}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeDialog}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
        dismissible={!isSubmitting}
      >
        <DrawerContent className="first:[&>div]:bg-transparent">
          <div className="flex h-[90vh] flex-col">
            <DrawerHeader className="flex-shrink-0 text-left">
              <DrawerTitle>Save to GitHub</DrawerTitle>
              <DrawerDescription>
                Select a repository, branch, and folder to save your code.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
              {formContent}
            </div>
            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="flex-shrink-0"
            >
              <DrawerFooter>
                <p className="w-full text-sm text-muted-foreground">
                  Commit Email: <span className="font-semibold">{email}</span>
                </p>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeDialog}
                    disabled={isSubmitting}
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

export default SaveToGithubDialog;
