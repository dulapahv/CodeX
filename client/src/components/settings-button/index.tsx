import { useRef } from 'react';
import type { Monaco } from '@monaco-editor/react';
import { Settings } from 'lucide-react';
import * as monaco from 'monaco-editor';

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
            variant="ghost"
            size="icon"
            className="size-7 animate-swing-in-bottom-fwd rounded-sm p-0"
            onClick={handleButtonClick}
          >
            <Settings className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <SettingsSheet ref={settingsSheetRef} monaco={monaco} editor={editor} />
    </>
  );
};

export { SettingsButton };
