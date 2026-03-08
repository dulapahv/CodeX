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
import { Settings } from "lucide-react";
import type * as monaco from "monaco-editor";
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
  editor: monaco.editor.IStandaloneCodeEditor;
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
        <TooltipTrigger asChild>
          <Button
            aria-expanded="false"
            aria-haspopup="dialog"
            aria-label="Open Settings"
            className="hover:!text-foreground size-7 animate-fade-in-top rounded-sm p-0 text-[color:var(--toolbar-foreground)]"
            onClick={handleButtonClick}
            size="icon"
            variant="ghost"
          >
            <Settings aria-hidden="true" className="size-4" />
          </Button>
        </TooltipTrigger>
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
