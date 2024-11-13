import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react';
import { LoaderCircle, Settings } from 'lucide-react';
import * as monaco from 'monaco-editor';
import { toast } from 'sonner';

import { useMediaQuery } from '@/hooks/use-media-query';
import { RepoBrowser } from '@/components/repo-browser';
import {
  itemType,
  type ExtendedTreeDataItem,
} from '@/components/repo-browser/types/tree';
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
import { loginWithGithub } from '@/utils/login-with-github';

import { useCommitForm } from './hooks/useCommitForm';
import { getDisplayPath } from './utils/get-display-path';
import { onSubmit } from './utils/on-submit';

interface SaveToGithubDialogProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

export interface SaveToGithubDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

export const SaveToGithubDialog = forwardRef<
  SaveToGithubDialogRef,
  SaveToGithubDialogProps
>(({ editor }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(
    null,
  );
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useCommitForm();

  // GitHub authentication
  useLayoutEffect(() => {
    if (isOpen) {
      fetch('/api/github/auth', {
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setGithubUser(data?.username ?? null))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setRepo('');
      setBranch('');
      setSelectedItem(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'github-oauth' && event.data.success) {
        const response = await fetch('/api/github/auth', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setGithubUser(data.username);
        }
        window.authWindow?.close();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  const onError = () => {
    toast.error('Please check the information and try again.');
  };

  const authContent = (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      {isLoading ? (
        <LoaderCircle className="size-6 animate-spin" />
      ) : !githubUser ? (
        <>
          <p className="text-center text-sm text-muted-foreground">
            Please log in with GitHub to save your code.
          </p>
          <Button onClick={loginWithGithub} variant="outline">
            Login with GitHub
          </Button>
        </>
      ) : null}
    </div>
  );

  const formContent = (
    <>
      <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
        <RepoBrowser
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
          <p className="text-sm text-red-500">{errors.commitSummary.message}</p>
        )}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent
          className="flex h-[90vh] flex-col gap-4 sm:max-w-2xl"
          autoFocus={false}
        >
          <AlertDialogHeader className="flex-shrink-0 text-left">
            <AlertDialogTitle>Save to GitHub</AlertDialogTitle>
            <AlertDialogDescription>
              Select a repository, branch, and folder to save your code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!isLoading && !githubUser ? authContent : formContent}

          <form
            onSubmit={handleSubmit(
              (data) =>
                onSubmit(
                  data,
                  selectedItem,
                  repo,
                  branch,
                  editor?.getModel()?.getValue() || '',
                  closeDialog,
                ),
              onError,
            )}
          >
            <AlertDialogFooter className="flex items-center justify-between gap-2 sm:gap-0">
              {githubUser && (
                <div className="w-full">
                  <p className="break-all text-xs text-muted-foreground">
                    Saving to{' '}
                    <span className="font-semibold">
                      {getDisplayPath(
                        repo,
                        githubUser,
                        branch,
                        selectedItem,
                        watch('fileName'),
                      )}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center text-xs text-muted-foreground">
                    <span>To disconnect GitHub, go to</span>
                    <span className="flex items-center font-semibold">
                      <Settings className="mx-1 inline size-3" />
                      Settings
                    </span>
                    .
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {githubUser && (
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
              )}
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
      <DrawerContent className="first:[&>div]:mt-0 first:[&>div]:bg-transparent">
        <div className="flex h-[90vh] flex-col">
          <DrawerHeader className="flex-shrink-0 text-left">
            <DrawerTitle>Save to GitHub</DrawerTitle>
            <DrawerDescription>
              Select a repository, branch, and folder to save your code.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {!isLoading && !githubUser ? authContent : formContent}
          </div>

          <form
            onSubmit={handleSubmit(
              (data) =>
                onSubmit(
                  data,
                  selectedItem,
                  repo,
                  branch,
                  editor?.getModel()?.getValue() || '',
                  closeDialog,
                ),
              onError,
            )}
            className="flex-shrink-0"
          >
            <DrawerFooter>
              {githubUser && (
                <>
                  <div className="w-full">
                    <p className="break-all text-xs text-muted-foreground">
                      Saving to{' '}
                      <span className="font-semibold">
                        {getDisplayPath(
                          repo,
                          githubUser,
                          branch,
                          selectedItem,
                          watch('fileName'),
                        )}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center text-xs text-muted-foreground">
                      <span>To disconnect GitHub, go to</span>
                      <span className="flex items-center font-semibold">
                        <Settings className="mx-1 inline size-3" />
                        Settings
                      </span>
                      .
                    </div>
                  </div>
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
                </>
              )}
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
});

SaveToGithubDialog.displayName = 'SaveToGithubDialog';

export default SaveToGithubDialog;
