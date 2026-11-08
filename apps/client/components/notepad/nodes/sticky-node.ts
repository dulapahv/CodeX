/**
 * A colored sticky note that holds other blocks.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { addClassNamesToElement } from "@lexical/utils";
import {
  type EditorConfig,
  ElementNode,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedElementNode,
  type SerializedPartial,
  type Spread,
} from "lexical";

export const STICKY_COLORS = {
  blue: "Blue",
  green: "Green",
  pink: "Pink",
  purple: "Purple",
  yellow: "Yellow",
} as const;

export type StickyColor = keyof typeof STICKY_COLORS;

export const isStickyColor = (value: string): value is StickyColor =>
  Object.hasOwn(STICKY_COLORS, value);

export type SerializedStickyNode = Spread<
  { color: StickyColor },
  SerializedElementNode
>;

export class StickyNode extends ElementNode {
  __color: StickyColor;

  static getType(): string {
    return "sticky";
  }

  static clone(node: StickyNode): StickyNode {
    return new StickyNode(node.__color, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedStickyNode>
  ): StickyNode {
    return new StickyNode().updateFromJSON(serializedNode);
  }

  constructor(color: StickyColor = "yellow", key?: NodeKey) {
    super(key);
    this.__color = color;
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedStickyNode>): this {
    const { color } = serializedNode;
    return super
      .updateFromJSON(serializedNode)
      .setColor(
        typeof color === "string" && isStickyColor(color) ? color : "yellow"
      );
  }

  exportJSON(): SerializedStickyNode {
    return { ...super.exportJSON(), color: this.getColor() };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.sticky);
    element.dataset.color = this.__color;
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__color !== this.__color) {
      dom.dataset.color = this.__color;
    }
    return false;
  }

  getColor(): StickyColor {
    return this.getLatest().__color;
  }

  setColor(color: StickyColor): this {
    const writable = this.getWritable();
    writable.__color = color;
    return writable;
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }

  canIndent(): false {
    return false;
  }
}

export const $createStickyNode = (color: StickyColor = "yellow"): StickyNode =>
  new StickyNode(color);

export const $isStickyNode = (
  node: LexicalNode | null | undefined
): node is StickyNode => node instanceof StickyNode;
