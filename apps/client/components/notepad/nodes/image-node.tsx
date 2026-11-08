/**
 * An inline image with an optional caption and width. Drag its side handles
 * to resize it. Written to markdown as `![alt](src)`, or as an `<img>` tag
 * once it has a width or caption.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { addClassNamesToElement } from "@lexical/utils";
import { ChatTextIcon } from "@phosphor-icons/react";
import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedPartial,
  type Spread,
} from "lexical";
import {
  type JSX,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

const MIN_WIDTH = 48;

export interface ImagePayload {
  altText: string;
  caption?: string;
  src: string;
  width?: number | null;
}

export type SerializedImageNode = Spread<
  { altText: string; caption: string; src: string; width: number | null },
  SerializedLexicalNode
>;

type Side = "left" | "right";

interface ImageViewProps {
  altText: string;
  caption: string;
  nodeKey: NodeKey;
  src: string;
  width: number | null;
}

const ImageView = ({
  altText,
  caption,
  nodeKey,
  src,
  width,
}: ImageViewProps) => {
  const [editor] = useLexicalComposerContext();
  const [isSelected] = useLexicalNodeSelection(nodeKey);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isAddingCaption, setIsAddingCaption] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption);
  const [isEditingCaption, setIsEditingCaption] = useState(false);

  useEffect(() => {
    if (!isEditingCaption) {
      setDraftCaption(caption);
    }
  }, [caption, isEditingCaption]);

  const update = (apply: (node: ImageNode) => void) =>
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        apply(node);
      }
    });

  const startResize = (side: Side) => (event: PointerEvent) => {
    const image = imageRef.current;
    const block = editor.getElementByKey(nodeKey)?.parentElement;
    if (!(image && block)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = Math.round(image.getBoundingClientRect().width);
    const maxWidth = block.clientWidth;
    const direction = side === "right" ? 1 : -1;
    let next = startWidth;
    image.style.maxHeight = "none";

    const onMove = (move: globalThis.PointerEvent) => {
      next = Math.round(
        Math.min(
          Math.max(startWidth + (move.clientX - startX) * direction, MIN_WIDTH),
          maxWidth
        )
      );
      image.style.width = `${next}px`;
    };
    // The click that ends a drag would otherwise land outside and deselect it
    const swallowClick = (click: MouseEvent) => click.stopPropagation();
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.addEventListener("click", swallowClick, { capture: true });
      setTimeout(() =>
        document.removeEventListener("click", swallowClick, { capture: true })
      );
      if (next === startWidth) {
        image.style.maxHeight = "";
        return;
      }
      update((node) => node.setWidth(next));
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const showCaption = caption !== "" || isAddingCaption;

  return (
    <span className="relative inline-flex max-w-full flex-col align-bottom">
      <span className="relative inline-block max-w-full">
        {/* biome-ignore lint/performance/noImgElement: notes link images from any host, which next/image can't load */}
        {/* biome-ignore lint/correctness/useImageSize: the size is unknown until the linked image loads */}
        <img
          alt={altText}
          className={cn(
            "block max-w-full",
            !width && "max-h-[32rem]",
            isSelected && "outline-primary outline-2 outline-offset-2"
          )}
          draggable={false}
          ref={imageRef}
          src={src}
          style={width ? { width } : undefined}
        />
        {isSelected && (
          <>
            {(["left", "right"] as const).map((side) => (
              <span
                aria-hidden="true"
                className={cn(
                  "bg-primary absolute top-1/2 h-8 w-1.5 -translate-y-1/2 cursor-ew-resize",
                  side === "left" ? "-left-1" : "-right-1"
                )}
                key={side}
                onPointerDown={startResize(side)}
              />
            ))}
            {!showCaption && (
              <button
                className="absolute right-1 bottom-1 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/70"
                onClick={() => setIsAddingCaption(true)}
                type="button"
              >
                <ChatTextIcon className="size-3.5" />
                Add caption
              </button>
            )}
          </>
        )}
      </span>
      {showCaption && (
        <input
          aria-label="Image caption"
          autoFocus={isAddingCaption && !caption}
          className="notepad-image-caption w-0 min-w-full"
          onBlur={() => {
            setIsEditingCaption(false);
            setIsAddingCaption(false);
          }}
          onChange={(event) => {
            setDraftCaption(event.target.value);
            update((node) => node.setCaption(event.target.value));
          }}
          onFocus={() => setIsEditingCaption(true)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          placeholder="Write a caption"
          value={draftCaption}
        />
      )}
    </span>
  );
};

const convertImageElement = (domNode: Node): DOMConversionOutput | null => {
  if (
    !(domNode instanceof HTMLImageElement) ||
    domNode.src.startsWith("file:")
  ) {
    return null;
  }
  return {
    node: $createImageNode({
      altText: domNode.alt,
      src: domNode.src,
      width: domNode.width || null,
    }),
  };
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __caption: string;
  __width: number | null;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        altText: node.__altText,
        caption: node.__caption,
        src: node.__src,
        width: node.__width,
      },
      node.__key
    );
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedImageNode>
  ): ImageNode {
    return new ImageNode().updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({ conversion: convertImageElement, priority: 0 }),
    };
  }

  constructor(
    {
      altText = "",
      caption = "",
      src = "",
      width = null,
    }: Partial<ImagePayload> = {},
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__caption = caption;
    this.__width = width;
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedImageNode>): this {
    const { altText, caption, src, width } = serializedNode;
    const writable = super.updateFromJSON(serializedNode).getWritable();
    writable.__src = typeof src === "string" ? src : "";
    writable.__altText = typeof altText === "string" ? altText : "";
    writable.__caption = typeof caption === "string" ? caption : "";
    writable.__width =
      typeof width === "number" && width > 0 ? Math.round(width) : null;
    return writable;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      altText: this.getAltText(),
      caption: this.getCaption(),
      src: this.getSrc(),
      width: this.getWidth(),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.getSrc());
    element.setAttribute("alt", this.getAltText());
    const width = this.getWidth();
    if (width) {
      element.setAttribute("width", String(width));
    }
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    addClassNamesToElement(element, config.theme.image);
    return element;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.getLatest().__src;
  }

  getAltText(): string {
    return this.getLatest().__altText;
  }

  getCaption(): string {
    return this.getLatest().__caption;
  }

  setCaption(caption: string): this {
    const writable = this.getWritable();
    writable.__caption = caption;
    return writable;
  }

  getWidth(): number | null {
    return this.getLatest().__width;
  }

  setWidth(width: number | null): this {
    const writable = this.getWritable();
    writable.__width = width;
    return writable;
  }

  decorate(): JSX.Element {
    return (
      <ImageView
        altText={this.__altText}
        caption={this.__caption}
        nodeKey={this.getKey()}
        src={this.__src}
        width={this.__width}
      />
    );
  }
}

export const $createImageNode = (payload: ImagePayload): ImageNode =>
  $applyNodeReplacement(new ImageNode(payload));

export const $isImageNode = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode;
