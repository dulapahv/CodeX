/**
 * Settings button component that opens editor configuration panel.
 * Features:
 * - Sheet trigger button
 * - Editor settings access
 * - Accessible tooltip
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import { GearIcon } from "@phosphor-icons/react";
import type * as monacoEditor from "monaco-editor";
import { useRef } from "react";
import {
  SettingsSheet,
  type SettingsSheetRef,
} from "@/components/settings-sheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingsButtonProps {
  editor: monacoEditor.editor.IStandaloneCodeEditor;
  monaco: Monaco;
}

const SettingsButton = ({ monaco, editor }: SettingsButtonProps) => {
  const settingsSheetRef = useRef<SettingsSheetRef>(null);

  const handleButtonClick = () => {
    settingsSheetRef.current?.openDialog();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-haspopup="dialog"
              aria-label="Open Settings"
              className="hover:!text-foreground animate-fade-in-top size-7 p-0 text-[color:var(--toolbar-foreground)]"
              onClick={handleButtonClick}
              size="icon"
              variant="ghost"
            >
              <GearIcon aria-hidden="true" className="size-4" />
            </Button>
          }
        />
        <TooltipContent role="tooltip" sideOffset={8}>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <SettingsSheet
        aria-label="Editor Settings"
        editor={editor}
        monaco={monaco}
        ref={settingsSheetRef}
      />
    </>
  );
};

export { SettingsButton };
