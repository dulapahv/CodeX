/**
 * Settings button component that opens a settings sheet for configuring
 * editor options.
 * Provides access to editor preferences and configuration via a
 * slide-out panel.
 *
 * @example
 * ```tsx
 * <SettingsButton
 *   monaco={monaco}
 *   editor={editor}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.monaco - Monaco instance for editor configuration
 * @param props.editor - Monaco editor instance
 *
 * @remarks
 * Uses the following components:
 * - [`SettingsSheet`](src/components/settings-sheet/index.tsx) for
 *   settings panel
 * - [`Button`](src/components/ui/button.tsx) for trigger
 * - [`Tooltip`](src/components/ui/tooltip.tsx) for hover hints
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useRef } from 'react';
import type { Monaco } from '@monaco-editor/react';
import { Settings } from 'lucide-react';
import type * as monaco from 'monaco-editor';

import {
  SettingsSheet,
  type SettingsSheetRef,
} from '@/components/settings-sheet';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SettingsButtonProps {
  monaco: Monaco;
  editor: monaco.editor.IStandaloneCodeEditor | null;
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
            className="size-7 animate-fade-in-top rounded-sm p-0 text-[color:var(--toolbar-foreground)] hover:!text-foreground"
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
