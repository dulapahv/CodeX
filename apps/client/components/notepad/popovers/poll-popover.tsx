/**
 * Starts a poll with a question and its first options.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type FormEvent, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { INSERT_POLL_COMMAND } from "../commands";
import {
  InsertPopover,
  InsertPopoverActions,
  type PopoverAnchor,
} from "../components/insert-popover";

const LINES = /\r?\n/u;

interface PollPopoverProps {
  anchor: PopoverAnchor | null;
  anchorElem: HTMLElement;
  onClose: () => void;
  open: boolean;
}

const PollPopover = ({
  anchor,
  anchorElem,
  onClose,
  open,
}: PollPopoverProps) => {
  const [editor] = useLexicalComposerContext();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("");
  const questionId = useId();
  const optionsId = useId();

  const close = () => {
    setQuestion("");
    setOptions("");
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }
    editor.dispatchCommand(INSERT_POLL_COMMAND, {
      options: options
        .split(LINES)
        .map((option) => option.trim())
        .filter(Boolean),
      question: question.trim(),
    });
    close();
  };

  return (
    <InsertPopover
      anchor={anchor}
      anchorElem={anchorElem}
      description="Everyone in the room can vote and add options."
      onClose={close}
      open={open}
      title="Insert poll"
    >
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor={questionId}>Question</Label>
          <Input
            id={questionId}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Where should we eat?"
            required
            value={question}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={optionsId}>Options, one per line</Label>
          <Textarea
            className="min-h-20"
            id={optionsId}
            onChange={(event) => setOptions(event.target.value)}
            placeholder={"Pizza\nSushi\nTacos"}
            value={options}
          />
        </div>
        <InsertPopoverActions
          canSubmit={question.trim() !== ""}
          onCancel={close}
          submitLabel="Insert"
        />
      </form>
    </InsertPopover>
  );
};

export { PollPopover };
