import React, { useState, useEffect } from 'react';
import { Settings, LogOut } from "lucide-react";
import * as monaco from "monaco-editor";
import type { Monaco } from "@monaco-editor/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GITHUB_CLIENT_ID, GITHUB_OAUTH_URL } from "@/lib/constants";

import { AppThemeSettings } from "./app-theme-settings";
import { EditorThemeSettings } from "./editor-theme-settings";

interface SettingSheetProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

export function SettingSheet({ monaco, editor }: SettingSheetProps) {
  const [githubUser, setGithubUser] = useState<string | null>(null);
  
  useEffect(() => {
    // Listen for messages from the OAuth popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'github-oauth') {
        if (event.data.success) {
          setGithubUser(event.data.username);
        }
        // Close the popup window if it exists
        if (window.authWindow) {
          window.authWindow?.close();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function loginWithGithub() {
    const width = 790;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindow = window.open(
      `${GITHUB_OAUTH_URL}/authorize?client_id=${GITHUB_CLIENT_ID}`,
      "_blank",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
    );

    // Store reference to auth window
    window.authWindow = authWindow;
  }

  function handleLogout() {
    setGithubUser(null);
    // Add any additional logout logic here
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
              className="size-7 rounded-sm p-0"
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
          {githubUser ? (
            <div className="flex items-center justify-between">
              <span className="text-sm">
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