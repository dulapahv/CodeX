import { Settings } from "lucide-react";
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

import { AppThemeSettings } from "./app-theme-settings";
import { EditorThemeSettings } from "./editor-theme-settings";

interface SettingSheetProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}
/* add default theme */
export function SettingSheet({ monaco, editor }: SettingSheetProps) {
  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 p-0">
              <Settings className="size-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            You can customize this code editor and the app to your liking.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-y-4 py-4">
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
