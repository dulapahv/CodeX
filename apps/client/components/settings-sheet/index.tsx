/**
 * Settings dialog component for Monaco editor configuration.
 * Features:
 * - Theme selection
 * - Editor preferences
 * - GitHub connection
 * - Settings import/export
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
import { Unplug } from 'lucide-react';
import type * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';

import { cn, loginWithGithub } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/spinner';

import { EditorConfig } from './components/editor-config';
import { EditorThemeSettings } from './components/editor-theme';

interface GithubUser {
  username: string;
  avatarUrl: string;
}

interface SettingsSheetRef {
  openDialog: () => void;
  closeDialog: () => void;
}

interface SettingsSheetProps {
  monaco: Monaco;
  editor: monaco.editor.IStandaloneCodeEditor;
}

const SettingsSheet = forwardRef<SettingsSheetRef, SettingsSheetProps>(
  ({ monaco, editor }, ref) => {
    const { resolvedTheme } = useTheme();

    const [isOpen, setIsOpen] = useState(false);
    const [githubUser, setGithubUser] = useState<GithubUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    useLayoutEffect(() => {
      fetch('/api/github/auth', {
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) =>
          data
            ? setGithubUser({
                username: data.username,
                avatarUrl: data.avatarUrl,
              })
            : null,
        )
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'github-oauth' && event.data.success) {
          const response = await fetch('/api/github/auth', {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setGithubUser({
              username: data.username,
              avatarUrl: data.avatarUrl,
            });
          }
          window.authWindow?.close();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, []);

    async function handleLogout() {
      try {
        const response = await fetch('/api/github/auth', {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) setGithubUser(null);
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }

    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          role="dialog"
          aria-label="Editor Settings"
          aria-modal="true"
          className="w-[calc(100%-10%)] overflow-y-auto sm:min-w-[540px]"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Configure your editor and GitHub connection.
            </SheetDescription>
          </SheetHeader>
          <div
            className="flex flex-col gap-y-4 py-4"
            role="group"
            aria-label="Settings Options"
          >
            <div>
              <Label className="text-base" id="github-section">
                GitHub Connection
              </Label>
              <div className="text-muted-foreground text-sm">
                Connect to GitHub to save your work and open files from your
                repositories.
              </div>
            </div>
            {isLoading ? (
              <div
                className="flex items-center justify-center py-2"
                role="status"
                aria-label="Loading GitHub connection status"
              >
                <Spinner />
              </div>
            ) : githubUser ? (
              <div
                className="space-y-2"
                role="status"
                aria-label={`Connected to GitHub as ${githubUser.username}`}
              >
                <div className="text-muted-foreground text-sm">
                  Connected to GitHub as:
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-8 overflow-hidden rounded-full">
                      <Skeleton
                        className="absolute size-full"
                        aria-hidden={imageLoaded ? 'true' : 'false'}
                        aria-label="Loading avatar"
                      />
                      <Image
                        src={githubUser.avatarUrl}
                        alt={`${githubUser.username}'s GitHub profile`}
                        fill
                        sizes="32px"
                        className={cn(
                          'object-cover transition-opacity',
                          imageLoaded ? 'opacity-100' : 'opacity-0',
                        )}
                        priority
                        onLoad={() => setImageLoaded(true)}
                        aria-hidden={!imageLoaded}
                      />
                    </div>
                    {!imageLoaded ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="max-w-[100px] truncate font-medium sm:max-w-[300px]">
                        {githubUser.username}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLogout}
                    className="flex shrink-0 items-center gap-2"
                    aria-label="Disconnect from GitHub"
                  >
                    <Unplug className="size-4" aria-hidden="true" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={loginWithGithub}
                variant="outline"
                className="w-full"
                aria-describedby="github-section"
              >
                <Image
                  src={`/images/${resolvedTheme === 'light' ? 'octocat' : 'octocat-white'}.svg`}
                  alt="GitHub logo"
                  className="mr-2"
                  width={18}
                  height={18}
                />
                Connect to GitHub
              </Button>
            )}
            <Separator />
            <div>
              <Label className="text-base" id="editor-section">
                Editor Settings
              </Label>
              <div className="text-muted-foreground text-sm">
                Customize the appearance of the editor and other settings. For
                more information on editor settings, refer to the{' '}
                <a
                  href="https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-muted-foreground font-medium underline
                    underline-offset-2 !transition-all"
                >
                  Monaco Editor documentation
                </a>
                .
              </div>
            </div>
            <EditorThemeSettings
              monaco={monaco}
              aria-labelledby="editor-section"
            />
            <div className="top-16 space-y-2">
              <Label className="font-normal">Settings</Label>
              <EditorConfig
                monaco={monaco}
                editor={editor}
                aria-labelledby="editor-section"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  },
);

SettingsSheet.displayName = 'SettingsSheet';

export { SettingsSheet, type SettingsSheetRef };
