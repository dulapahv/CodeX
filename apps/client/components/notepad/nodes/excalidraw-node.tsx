/**
 * An Excalidraw drawing. The scene is kept as JSON for editing and as an SVG
 * for display, so viewing a note never loads the drawing editor. Written to
 * markdown as an `excalidraw` fenced block of the scene JSON.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import {
  DecoratorNode,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedPartial,
  type Spread,
} from "lexical";
import type { JSX } from "react";

import {
  type ExcalidrawPayload,
  OPEN_EXCALIDRAW_DIALOG_COMMAND,
} from "../commands";
import { BlockFrame } from "../components/block-frame";
import { ToolbarButton } from "../components/toolbar-button";

export type SerializedExcalidrawNode = Spread<
  ExcalidrawPayload,
  SerializedLexicalNode
>;

const ExcalidrawView = ({
  nodeKey,
  svg,
}: {
  nodeKey: NodeKey;
  svg: string;
}) => {
  const [editor] = useLexicalComposerContext();
  const edit = () =>
    editor.dispatchCommand(OPEN_EXCALIDRAW_DIALOG_COMMAND, nodeKey);

  return (
    <BlockFrame
      actions={
        <ToolbarButton className="size-6" label="Edit drawing" onClick={edit}>
          <PencilSimpleIcon />
        </ToolbarButton>
      }
      nodeKey={nodeKey}
    >
      <button
        className="block max-w-full cursor-default"
        data-selectable
        onDoubleClick={edit}
        title="Double-click to edit"
        type="button"
      >
        {svg ? (
          // biome-ignore lint/performance/noImgElement: the drawing is an inline SVG data URL, which next/image can't optimize
          // biome-ignore lint/correctness/useImageSize: the SVG carries its own size
          <img
            alt="Drawing"
            className="notepad-drawing max-w-full"
            draggable={false}
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
          />
        ) : (
          <span className="border-foreground/20 text-muted-foreground block border border-dashed p-6">
            Empty drawing
          </span>
        )}
      </button>
    </BlockFrame>
  );
};

export class ExcalidrawNode extends DecoratorNode<JSX.Element> {
  __data: string;
  __svg: string;

  static getType(): string {
    return "excalidraw";
  }

  static clone(node: ExcalidrawNode): ExcalidrawNode {
    return new ExcalidrawNode(node.__data, node.__svg, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedExcalidrawNode>
  ): ExcalidrawNode {
    return new ExcalidrawNode().updateFromJSON(serializedNode);
  }

  constructor(data = "", svg = "", key?: NodeKey) {
    super(key);
    this.__data = data;
    this.__svg = svg;
  }

  updateFromJSON(
    serializedNode: LexicalParseJSON<SerializedExcalidrawNode>
  ): this {
    const { data, svg } = serializedNode;
    return super.updateFromJSON(serializedNode).setDrawing({
      data: typeof data === "string" ? data : "",
      svg: typeof svg === "string" ? svg : "",
    });
  }

  exportJSON(): SerializedExcalidrawNode {
    return { ...super.exportJSON(), ...this.getDrawing() };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  getDrawing(): ExcalidrawPayload {
    const { __data, __svg } = this.getLatest();
    return { data: __data, svg: __svg };
  }

  setDrawing({ data, svg }: ExcalidrawPayload): this {
    const writable = this.getWritable();
    writable.__data = data;
    writable.__svg = svg;
    return writable;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <ExcalidrawView nodeKey={this.getKey()} svg={this.__svg} />;
  }
}

export const $createExcalidrawNode = (
  drawing: ExcalidrawPayload
): ExcalidrawNode => new ExcalidrawNode(drawing.data, drawing.svg);

export const $isExcalidrawNode = (
  node: LexicalNode | null | undefined
): node is ExcalidrawNode => node instanceof ExcalidrawNode;
