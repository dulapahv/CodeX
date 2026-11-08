/**
 * Adds a ruby annotation, a small reading guide shown above the selected
 * text, such as furigana over kanji.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type FormEvent, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TOGGLE_RUBY_COMMAND } from "../commands";
import {
  InsertPopover,
  InsertPopoverActions,
  type PopoverAnchor,
} from "../components/insert-popover";

interface RubyPopoverProps {
  anchor: PopoverAnchor | null;
  anchorElem: HTMLElement;
  onClose: () => void;
  open: boolean;
}

const RubyPopover = ({
  anchor,
  anchorElem,
  onClose,
  open,
}: RubyPopoverProps) => {
  const [editor] = useLexicalComposerContext();
  const [annotation, setAnnotation] = useState("");
  const annotationId = useId();

  const close = () => {
    setAnnotation("");
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!annotation.trim()) {
      return;
    }
    editor.dispatchCommand(TOGGLE_RUBY_COMMAND, annotation.trim());
    close();
  };

  return (
    <InsertPopover
      anchor={anchor}
      anchorElem={anchorElem}
      description="Shown small above the selected text, like a pronunciation guide."
      onClose={close}
      open={open}
      title="Ruby annotation"
    >
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor={annotationId}>Annotation</Label>
          <Input
            id={annotationId}
            onChange={(event) => setAnnotation(event.target.value)}
            placeholder="かんじ"
            value={annotation}
          />
        </div>
        <InsertPopoverActions
          canSubmit={annotation.trim() !== ""}
          onCancel={close}
          submitLabel="Annotate"
        />
      </form>
    </InsertPopover>
  );
};

export { RubyPopover };
