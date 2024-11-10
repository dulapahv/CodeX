import React, { useEffect, useState } from 'react';
import type { Monaco } from '@monaco-editor/react';
import { LoaderCircle, LogOut, Settings } from 'lucide-react';
import * as monaco from 'monaco-editor';

import { GITHUB_CLIENT_ID, GITHUB_OAUTH_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { AppThemeSettings } from './app-theme';
import { EditorThemeSettings } from './editor-theme';

interface SettingSheetProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

export function SettingSheet({ monaco, editor }: SettingSheetProps) {
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  function loginWithGithub() {
    const width = 790;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    if (window.authWindow?.closed === false) {
      window.authWindow.focus();
    } else {
      window.authWindow = window.open(
        `${GITHUB_OAUTH_URL}/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo`,
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`,
      );
    }
  }

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger
            onFocus={(e) => {
              e.preventDefault();
            }}
            asChild
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-7 animate-swing-in-bottom-fwd rounded-sm p-0"
            >
              <Settings className="size-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent>
        <SheetHeader className="text-left">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            You can customize this code editor and the app to your liking.
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
                Connected as {githubUser}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={loginWithGithub}
              variant="outline"
              className="w-full"
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
}
