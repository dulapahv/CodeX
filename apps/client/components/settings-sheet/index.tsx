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
import type * as monacoEditor from "monaco-editor";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
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
  editor: monacoEditor.editor.IStandaloneCodeEditor;
  monaco: Monaco;
}

const SettingsSheet = forwardRef<SettingsSheetRef, SettingsSheetProps>(
  ({ monaco, editor }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    useImperativeHandle(ref, () => ({
      closeDialog,
      openDialog,
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
              <h3
                className="text-base leading-none select-none"
                id="repository-section"
              >
                Repository connections
              </h3>
              <div className="text-muted-foreground text-sm">
                Connect a provider to open files from and save your work to your
                repositories.
              </div>
            </div>
            <RepositoryConnections isOpen={isOpen} />
            <Separator />
            <div>
              <h3
                className="text-base leading-none select-none"
                id="editor-section"
              >
                Editor Settings
              </h3>
              <div className="text-muted-foreground text-sm">
                Customize the appearance of the editor and other settings. For
                more information on editor settings, refer to the{" "}
                <a
                  className="text-foreground hover:text-muted-foreground font-medium underline underline-offset-2 !transition-all"
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
            <EditorConfig
              aria-labelledby="editor-section"
              editor={editor}
              monaco={monaco}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

SettingsSheet.displayName = "SettingsSheet";

export { SettingsSheet, type SettingsSheetRef };
