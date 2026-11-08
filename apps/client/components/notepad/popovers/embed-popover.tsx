/**
 * Embeds a YouTube video, X post or Figma file from its link.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type FormEvent, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { INSERT_EMBED_COMMAND } from "../commands";
import {
  InsertPopover,
  InsertPopoverActions,
  type PopoverAnchor,
} from "../components/insert-popover";
import {
  EMBED_PROVIDERS,
  type EmbedProvider,
  getEmbedId,
} from "../nodes/embed-node";

const EXAMPLES: Record<EmbedProvider, string> = {
  figma: "https://www.figma.com/design/…",
  x: "https://x.com/user/status/…",
  youtube: "https://www.youtube.com/watch?v=…",
};

interface EmbedPopoverProps {
  anchor: PopoverAnchor | null;
  anchorElem: HTMLElement;
  onClose: () => void;
  provider: EmbedProvider | null;
}

const EmbedPopover = ({
  anchor,
  anchorElem,
  onClose,
  provider,
}: EmbedPopoverProps) => {
  const [editor] = useLexicalComposerContext();
  const [url, setUrl] = useState("");
  // Keeps the title while the popover fades out after provider is cleared
  const [shownProvider, setShownProvider] = useState(provider);
  const urlId = useId();

  if (provider && provider !== shownProvider) {
    setShownProvider(provider);
  }

  const isValid = provider !== null && getEmbedId(provider, url) !== null;
  const name = shownProvider ? EMBED_PROVIDERS[shownProvider] : "";

  const close = () => {
    setUrl("");
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!(provider && isValid)) {
      return;
    }
    editor.dispatchCommand(INSERT_EMBED_COMMAND, { provider, url: url.trim() });
    close();
  };

  return (
    <InsertPopover
      anchor={anchor}
      anchorElem={anchorElem}
      description={`Paste the link to the ${name}.`}
      onClose={close}
      open={provider !== null}
      title={`Embed ${name}`}
    >
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor={urlId}>Link</Label>
          <Input
            aria-invalid={url.trim() !== "" && !isValid}
            id={urlId}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={shownProvider ? EXAMPLES[shownProvider] : undefined}
            type="url"
            value={url}
          />
          {url.trim() !== "" && !isValid && (
            <p className="text-destructive">This isn't a {name} link.</p>
          )}
        </div>
        <InsertPopoverActions
          canSubmit={isValid}
          onCancel={close}
          submitLabel="Embed"
        />
      </form>
    </InsertPopover>
  );
};

export { EmbedPopover };
