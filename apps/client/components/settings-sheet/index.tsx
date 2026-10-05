/**
 * Settings dialog component for Monaco editor configuration.
 * Features:
 * - Theme selection
 * - Editor preferences
 * - Repository connections
 * - Settings import/export
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { EditorConfig } from "./components/editor-config";
import { EditorThemeSettings } from "./components/editor-theme";
import { RepositoryConnections } from "./components/repository-connections";

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
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    return (
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
        <SheetContent
          aria-label="Editor Settings"
          aria-modal="true"
          className="overflow-y-auto data-[side=right]:w-[calc(100%-10%)] sm:min-w-[540px]"
          data-backdrop="clear"
          role="dialog"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Configure your editor and repository connections.
            </SheetDescription>
          </SheetHeader>
          {/* biome-ignore lint/a11y/useSemanticElements: grouping settings options */}
          <div
            aria-label="Settings Options"
            className="flex flex-col gap-y-4 px-4 pb-4"
            role="group"
          >
            <div>
              <Label className="text-base" id="repository-section">
                Repository connections
              </Label>
              <div className="text-muted-foreground text-sm">
                Connect a provider to open files from and save your work to your
                repositories.
              </div>
            </div>
            <RepositoryConnections isOpen={isOpen} />
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
