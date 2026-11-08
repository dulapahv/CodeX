/**
 * Font size buttons around a field where any size can be typed.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import type { FocusEvent, KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";

import {
  applyTextStyle,
  clampFontSize,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  stepFontSize,
} from "../text-styles";
import { ToolbarButton } from "./toolbar-button";

interface FontSizeControlProps {
  disabled: boolean;
  size: number;
}

const FontSizeControl = ({ disabled, size }: FontSizeControlProps) => {
  const [editor] = useLexicalComposerContext();

  const apply = (next: number) =>
    applyTextStyle(editor, { "font-size": `${clampFontSize(next)}px` });

  const applyInput = (input: HTMLInputElement) => {
    const next = Number.parseFloat(input.value);
    if (Number.isFinite(next) && next !== size) {
      apply(next);
    } else {
      input.value = String(size);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyInput(event.currentTarget);
      editor.focus();
    } else if (event.key === "Escape") {
      event.currentTarget.value = String(size);
      editor.focus();
    }
  };

  return (
    <div className="flex items-center">
      <ToolbarButton
        className="size-6"
        disabled={disabled || size <= MIN_FONT_SIZE}
        label="Decrease font size"
        onClick={() => apply(stepFontSize(size, -1))}
      >
        <MinusIcon />
      </ToolbarButton>
      <Input
        aria-label="Font size"
        className="border-foreground/20 h-6 w-10 bg-transparent px-1 text-center text-inherit"
        defaultValue={size}
        disabled={disabled}
        inputMode="numeric"
        key={size}
        onBlur={(event: FocusEvent<HTMLInputElement>) =>
          applyInput(event.currentTarget)
        }
        onKeyDown={handleKeyDown}
        title="Font size"
      />
      <ToolbarButton
        className="size-6"
        disabled={disabled || size >= MAX_FONT_SIZE}
        label="Increase font size"
        onClick={() => apply(stepFontSize(size, 1))}
      >
        <PlusIcon />
      </ToolbarButton>
    </div>
  );
};

export { FontSizeControl };
