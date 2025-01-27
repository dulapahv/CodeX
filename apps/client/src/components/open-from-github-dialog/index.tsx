/**
 * Open from GitHub dialog component that handles file browsing and loading.
 * Features:
 * - GitHub repository browsing
 * - File content loading
 * - Authentication handling
 * - Responsive dialog/drawer
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react';
import Image from 'next/image';

import type { Monaco } from '@monaco-editor/react';
import { Settings } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { loginWithGithub } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
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
import { RepoBrowser } from '@/components/repo-browser';
import {
  itemType,
  type ExtendedTreeDataItem,
} from '@/components/repo-browser/types/tree';
import { Spinner } from '@/components/spinner';

import { getDisplayPath } from './utils';

interface OpenFromGithubDialogProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

interface OpenFromGithubDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

const OpenFromGithubDialog = forwardRef<
  OpenFromGithubDialogRef,
  OpenFromGithubDialogProps
>(({ monaco, editor }, ref) => {
  const { resolvedTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(
    null,
  );
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [fileName, setFileName] = useState('');
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingContent, setIsFetchingContent] = useState(false);

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
      setFileName('');
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
  const closeDialog = useCallback(() => setIsOpen(false), []);

  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  useEffect(() => {
    const fileName =
      selectedItem?.type === itemType.FILE ? selectedItem.name : '';
    if (fileName) {
      setFileName(fileName);
    }
  }, [selectedItem]);

  const handleOpenFile = async () => {
    if (!monaco || !editor || !repo || !branch || !fileName || !selectedItem) {
      toast.error('Please select a file to open');
      return;
    }

    try {
      setIsFetchingContent(true);

      // Construct the path from selectedItem's path
      const path = (selectedItem.path ?? '').split('/').slice(0, -1).join('/');

      const response = await fetch(
        `/api/github/content?repo=${repo}&branch=${branch}&path=${path}&filename=${fileName}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch file content');
      }

      const data = await response.json();

      // Try to detect language from file extension
      const extension = fileName.split('.').pop() || '';
      const languages = monaco.languages.getLanguages();
      const language = languages.find((lang) =>
        lang.extensions?.some((ext) => ext.replace('.', '') === extension),
      );

      // Set content and language (default to plaintext)
      editor.setValue(data.content);
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language?.id || 'plaintext');
      }

      // Close dialog
      closeDialog();

      // Show success message
      toast.success('File opened successfully');
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to open file',
      );
    } finally {
      setIsFetchingContent(false);
    }
  };

  const authContent = (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4"
      role="status"
    >
      {isLoading ? (
        <Spinner size="lg" />
      ) : !githubUser ? (
        <>
          <p
            className="text-muted-foreground text-center text-sm"
            id="login-prompt"
          >
            Please connect to GitHub to open files from your repositories.
          </p>
          <Button
            onClick={loginWithGithub}
            variant="outline"
            aria-describedby="login-prompt"
          >
            <Image
              src={`/images/${resolvedTheme === 'light' ? 'octocat' : 'octocat-white'}.svg`}
              alt="GitHub logo"
              className="mr-2"
              width={16}
              height={16}
            />
            Connect to GitHub
          </Button>
        </>
      ) : null}
    </div>
  );

  const formContent = (
    <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
      <RepoBrowser
        setSelectedItem={setSelectedItem}
        setRepo={setRepo}
        setBranch={setBranch}
        aria-label="Repository browser"
      />
    </div>
  );

  if (isDesktop) {
    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent
          className="flex h-[90vh] flex-col gap-4 sm:max-w-2xl"
          autoFocus={false}
        >
          <AlertDialogHeader className="flex-shrink-0 space-y-0 text-left">
            <AlertDialogTitle>Open from GitHub</AlertDialogTitle>
            <AlertDialogDescription>
              Select a repository, branch, and folder to open your code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!isLoading && !githubUser ? authContent : formContent}

          <div>
            <AlertDialogFooter className="flex items-center justify-between gap-2 sm:gap-0">
              {githubUser && (
                <div className="w-full">
                  <p className="text-muted-foreground break-all text-xs">
                    Open{' '}
                    <span className="font-semibold">
                      {getDisplayPath(
                        repo,
                        githubUser,
                        branch,
                        selectedItem,
                        fileName,
                      )}
                    </span>
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center text-xs">
                    <span>To disconnect GitHub, go to</span>
                    <span className="flex items-center font-semibold">
                      <Settings
                        className="mx-1 inline size-3"
                        aria-hidden="true"
                      />
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
                disabled={isFetchingContent}
                aria-busy={isFetchingContent}
              >
                Cancel
              </Button>
              {githubUser && (
                <Button
                  onClick={handleOpenFile}
                  disabled={
                    !selectedItem?.type ||
                    selectedItem.type !== itemType.FILE ||
                    isFetchingContent
                  }
                >
                  {isFetchingContent ? (
                    <>
                      <Spinner className="mr-2" />
                      Opening...
                    </>
                  ) : (
                    'Open'
                  )}
                </Button>
              )}
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
      <DrawerContent className="first:[&>div]:mt-0 first:[&>div]:bg-transparent">
        <div className="flex h-[90vh] flex-col">
          <DrawerHeader className="flex-shrink-0 text-left">
            <DrawerTitle>Open from GitHub</DrawerTitle>
            <DrawerDescription>
              Select a repository, branch, and folder to open your code.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {!isLoading && !githubUser ? authContent : formContent}
          </div>

          <div className="flex-shrink-0">
            <DrawerFooter>
              {githubUser && (
                <>
                  <div className="w-full">
                    <p className="text-muted-foreground break-all text-xs">
                      Opening{' '}
                      <span className="font-semibold">
                        {getDisplayPath(
                          repo,
                          githubUser,
                          branch,
                          selectedItem,
                          fileName,
                        )}
                      </span>
                    </p>
                    <div className="text-muted-foreground flex flex-wrap items-center text-xs">
                      <span>To disconnect GitHub, go to</span>
                      <span className="flex items-center font-semibold">
                        <Settings
                          className="mx-1 inline size-3"
                          aria-hidden="true"
                        />
                        Settings
                      </span>
                      .
                    </div>
                  </div>
                  <Button
                    onClick={handleOpenFile}
                    disabled={
                      !selectedItem?.type ||
                      selectedItem.type !== itemType.FILE ||
                      isFetchingContent
                    }
                    aria-busy={isFetchingContent}
                  >
                    {isFetchingContent ? (
                      <>
                        <Spinner className="mr-2" />
                        Opening...
                      </>
                    ) : (
                      'Open'
                    )}
                  </Button>
                </>
              )}
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeDialog}
                  disabled={isFetchingContent}
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

OpenFromGithubDialog.displayName = 'OpenFromGithubDialog';

export { OpenFromGithubDialog, type OpenFromGithubDialogRef };
