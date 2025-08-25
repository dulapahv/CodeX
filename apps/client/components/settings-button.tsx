/**
 * Settings button component that opens editor configuration panel.
 * Features:
 * - Sheet trigger button
 * - Editor settings access
 * - Accessible tooltip
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useRef } from 'react';

import type { Monaco } from '@monaco-editor/react';
import { Settings } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  SettingsSheet,
  type SettingsSheetRef,
} from '@/components/settings-sheet';

interface SettingsButtonProps {
  monaco: Monaco;
  editor: monaco.editor.IStandaloneCodeEditor;
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
            aria-label="Open Settings"
            aria-haspopup="dialog"
            aria-expanded="false"
            variant="ghost"
            size="icon"
            className="animate-fade-in-top hover:!text-foreground size-7 rounded-sm p-0
              text-[color:var(--toolbar-foreground)]"
            onClick={handleButtonClick}
          >
            <Settings className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent role="tooltip" sideOffset={8}>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <SettingsSheet
        ref={settingsSheetRef}
        monaco={monaco}
        editor={editor}
        aria-label="Editor Settings"
      />
    </>
  );
};

export { SettingsButton };
