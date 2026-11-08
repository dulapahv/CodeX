/**
 * A toolbar button that opens a palette for text or background color, with
 * a custom color and a reset to the default.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { Icon } from "@phosphor-icons/react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { restoreEditorFocus } from "../utils";

const HEX_COLOR = /^#[\da-f]{6}/iu;

interface ColorPickerButtonProps {
  colors: { label: string; value: string }[];
  disabled?: boolean;
  icon: Icon;
  label: string;
  onChange: (color: string | null) => void;
  value: string;
}

const ColorPickerButton = ({
  colors,
  disabled,
  icon: ColorIcon,
  label,
  onChange,
  value,
}: ColorPickerButtonProps) => {
  const [editor] = useLexicalComposerContext();
  const customId = useId();
  const customValue = value.match(HEX_COLOR)?.[0] ?? "#000000";

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              disabled={disabled}
              render={
                <Button
                  aria-label={label}
                  className="hover:bg-foreground/10 h-7 flex-col gap-0 px-1.5 text-inherit"
                  size="sm"
                  variant="ghost"
                >
                  <ColorIcon />
                  <span
                    aria-hidden="true"
                    className="ring-foreground/20 h-1 w-4 ring-1"
                    style={{ backgroundColor: value || "transparent" }}
                  />
                </Button>
              }
            />
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="w-56"
        finalFocus={() => restoreEditorFocus(editor)}
      >
        <div className="grid grid-cols-6 gap-1.5">
          {colors.map((color) => (
            <button
              aria-label={color.label}
              aria-pressed={value === color.value}
              className={cn(
                "ring-foreground/15 hover:ring-foreground/40 size-7 ring-1 hover:ring-2",
                value === color.value && "ring-primary ring-2"
              )}
              key={color.value}
              onClick={() => onChange(color.value)}
              style={{ backgroundColor: color.value }}
              title={color.label}
              type="button"
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label
            className="flex flex-1 cursor-pointer items-center gap-2 text-xs"
            htmlFor={customId}
          >
            <input
              className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
              id={customId}
              onChange={(event) => onChange(event.target.value)}
              type="color"
              value={customValue}
            />
            Custom
          </label>
          <Button onClick={() => onChange(null)} size="xs" variant="secondary">
            Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ColorPickerButton };
