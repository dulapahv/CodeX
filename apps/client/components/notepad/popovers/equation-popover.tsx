/**
 * Writes or edits a LaTeX equation with a live preview.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, type NodeKey } from "lexical";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  type EquationDialogPayload,
  INSERT_EQUATION_COMMAND,
} from "../commands";
import {
  InsertPopover,
  InsertPopoverActions,
  type PopoverAnchor,
} from "../components/insert-popover";
import { $isEquationNode, renderEquation } from "../nodes/equation-node";

const EXAMPLE = "e^{i\\pi} + 1 = 0";

interface EquationFormProps extends EquationDialogPayload {
  onClose: () => void;
}

const EquationForm = ({
  equation: initialEquation = "",
  inline: initialInline = false,
  nodeKey,
  onClose,
}: EquationFormProps) => {
  const [editor] = useLexicalComposerContext();
  const [equation, setEquation] = useState(initialEquation);
  const [inline, setInline] = useState(initialInline);
  const previewRef = useRef<HTMLDivElement>(null);
  const equationId = useId();
  const inlineId = useId();

  useEffect(() => {
    if (previewRef.current) {
      renderEquation(previewRef.current, {
        equation: equation || EXAMPLE,
        inline,
      });
    }
  }, [equation, inline]);

  const save = (key: NodeKey | undefined) => {
    const value = equation.trim();
    if (!key) {
      if (value) {
        editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
          equation: value,
          inline,
        });
      }
      return;
    }
    editor.update(() => {
      const node = $getNodeByKey(key);
      if (!$isEquationNode(node)) {
        return;
      }
      if (value) {
        node.setEquation(value);
      } else {
        node.remove();
      }
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save(nodeKey);
    onClose();
  };

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor={equationId}>Equation</Label>
        <Textarea
          className="min-h-16 font-mono"
          id={equationId}
          onChange={(event) => setEquation(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              handleSubmit(event);
            }
          }}
          placeholder={EXAMPLE}
          value={equation}
        />
      </div>
      {!nodeKey && (
        <div className="flex items-center gap-2">
          <Switch checked={inline} id={inlineId} onCheckedChange={setInline} />
          <Label htmlFor={inlineId}>Inline with the text</Label>
        </div>
      )}
      <div className="grid gap-1">
        <span className="text-muted-foreground">Preview</span>
        <div
          className="border-foreground/15 min-h-12 overflow-x-auto border p-2 text-base"
          ref={previewRef}
        />
      </div>
      <InsertPopoverActions
        canSubmit={Boolean(nodeKey || equation.trim())}
        onCancel={onClose}
        submitLabel={nodeKey ? "Save" : "Insert"}
      />
    </form>
  );
};

interface EquationPopoverProps {
  anchor: PopoverAnchor | null;
  anchorElem: HTMLElement;
  onClose: () => void;
  payload: EquationDialogPayload | null;
}

const EquationPopover = ({
  anchor,
  anchorElem,
  onClose,
  payload,
}: EquationPopoverProps) => {
  // Keeps the form while the popover fades out after payload is cleared
  const [shown, setShown] = useState(payload);
  if (payload && payload !== shown) {
    setShown(payload);
  }

  return (
    <InsertPopover
      anchor={anchor}
      anchorElem={anchorElem}
      className="w-96"
      description="Write the equation in LaTeX."
      onClose={onClose}
      open={payload !== null}
      title={shown?.nodeKey ? "Edit equation" : "Insert equation"}
    >
      {shown && (
        <EquationForm
          key={shown.nodeKey ?? "new"}
          onClose={onClose}
          {...shown}
        />
      )}
    </InsertPopover>
  );
};

export { EquationPopover };
