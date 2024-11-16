import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react';
import type { Monaco } from '@monaco-editor/react';
import { LoaderCircle, Unplug } from 'lucide-react';
import type * as monaco from 'monaco-editor';

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
import { loginWithGithub } from '@/utils/login-with-github';

import { AppThemeSettings } from './components/app-theme';
import { EditorThemeSettings } from './components/editor-theme';

interface SettingsSheetRef {
  openDialog: () => void;
  closeDialog: () => void;
}

interface SettingsSheetProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

const SettingsSheet = forwardRef<SettingsSheetRef, SettingsSheetProps>(
  ({ monaco, editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [githubUser, setGithubUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
        .then((data) => setGithubUser(data?.username ?? null))
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
            setGithubUser(data.username);
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
        <SheetContent>
          <SheetHeader className="text-left">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Personalize your experience and preferences.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-y-4 py-4">
            <Label className="text-base">GitHub Connection</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <LoaderCircle className="size-4 animate-spin" />
              </div>
            ) : githubUser ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Connected as{' '}
                  <span className="font-semibold">{githubUser}</span>
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <Unplug className="size-4" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={loginWithGithub}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Login with GitHub
              </Button>
            )}
            <Separator />
            <Label className="text-base">General</Label>
            <AppThemeSettings />
            <Separator />
            <Label className="text-base">Editor</Label>
            <EditorThemeSettings monaco={monaco} />
          </div>
        </SheetContent>
      </Sheet>
    );
  },
);

SettingsSheet.displayName = 'SettingsSheet';

export { SettingsSheet, type SettingsSheetRef };
