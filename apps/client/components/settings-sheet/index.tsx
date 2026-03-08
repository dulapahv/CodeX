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

import type { Monaco } from "@monaco-editor/react";
import { Unplug } from "lucide-react";
import type * as monaco from "monaco-editor";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, loginWithGithub } from "@/lib/utils";

import { EditorConfig } from "./components/editor-config";
import { EditorThemeSettings } from "./components/editor-theme";

interface GithubUser {
  avatarUrl: string;
  username: string;
}

interface SettingsSheetRef {
  closeDialog: () => void;
  openDialog: () => void;
}

interface SettingsSheetProps {
  editor: monaco.editor.IStandaloneCodeEditor;
  monaco: Monaco;
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
      fetch("/api/github/auth", {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) =>
          data
            ? setGithubUser({
                username: data.username,
                avatarUrl: data.avatarUrl,
              })
            : null
        )
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === "github-oauth" && event.data.success) {
          const response = await fetch("/api/github/auth", {
            credentials: "include",
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

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, []);

    async function handleLogout() {
      try {
        const response = await fetch("/api/github/auth", {
          method: "DELETE",
          credentials: "include",
        });
        if (response.ok) {
          setGithubUser(null);
        }
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }

    return (
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
        <SheetContent
          aria-label="Editor Settings"
          aria-modal="true"
          className="w-[calc(100%-10%)] overflow-y-auto sm:min-w-[540px]"
          role="dialog"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Configure your editor and GitHub connection.
            </SheetDescription>
          </SheetHeader>
          {/* biome-ignore lint/a11y/useSemanticElements: grouping settings options */}
          <div
            aria-label="Settings Options"
            className="flex flex-col gap-y-4 py-4"
            role="group"
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
            {(() => {
              if (isLoading) {
                return (
                  // biome-ignore lint/a11y/useSemanticElements: status div for loading state
                  <div
                    aria-label="Loading GitHub connection status"
                    className="flex items-center justify-center py-2"
                    role="status"
                  >
                    <Spinner />
                  </div>
                );
              }
              if (githubUser) {
                return (
                  // biome-ignore lint/a11y/useSemanticElements: status div for GitHub connection info
                  <div
                    aria-label={`Connected to GitHub as ${githubUser.username}`}
                    className="space-y-2"
                    role="status"
                  >
                    <div className="text-muted-foreground text-sm">
                      Connected to GitHub as:
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-8 overflow-hidden rounded-full">
                          <Skeleton
                            aria-hidden={imageLoaded ? "true" : "false"}
                            aria-label="Loading avatar"
                            className="absolute size-full"
                          />
                          <Image
                            alt={`${githubUser.username}'s GitHub profile`}
                            aria-hidden={!imageLoaded}
                            className={cn(
                              "object-cover transition-opacity",
                              imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            fill
                            loading="eager"
                            onLoad={() => setImageLoaded(true)}
                            sizes="32px"
                            src={githubUser.avatarUrl}
                          />
                        </div>
                        {imageLoaded ? (
                          <span className="max-w-[100px] truncate font-medium sm:max-w-[300px]">
                            {githubUser.username}
                          </span>
                        ) : (
                          <Skeleton className="h-4 w-24" />
                        )}
                      </div>
                      <Button
                        aria-label="Disconnect from GitHub"
                        className="flex shrink-0 items-center gap-2"
                        onClick={handleLogout}
                        size="sm"
                        variant="destructive"
                      >
                        <Unplug aria-hidden="true" className="size-4" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <Button
                  aria-describedby="github-section"
                  className="w-full"
                  onClick={loginWithGithub}
                  variant="outline"
                >
                  <Image
                    alt="GitHub logo"
                    className="mr-2"
                    height={18}
                    src={`/images/${resolvedTheme === "light" ? "octocat" : "octocat-white"}.svg`}
                    width={18}
                  />
                  Connect to GitHub
                </Button>
              );
            })()}
            <Separator />
            <div>
              <Label className="text-base" id="editor-section">
                Editor Settings
              </Label>
              <div className="text-muted-foreground text-sm">
                Customize the appearance of the editor and other settings. For
                more information on editor settings, refer to the{" "}
                <a
                  className="!transition-all font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
                  href="https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Monaco Editor documentation
                </a>
                .
              </div>
            </div>
            <EditorThemeSettings
              aria-labelledby="editor-section"
              monaco={monaco}
            />
            <div className="top-16 space-y-2">
              <Label className="font-normal">Settings</Label>
              <EditorConfig
                aria-labelledby="editor-section"
                editor={editor}
                monaco={monaco}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

SettingsSheet.displayName = "SettingsSheet";

export { SettingsSheet, type SettingsSheetRef };
