/**
 * A row of columns (a CSS grid) whose cells each hold their own blocks.
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

export const DEFAULT_COLUMNS = "1fr 1fr";

export type SerializedLayoutContainerNode = Spread<
  { templateColumns: string },
  SerializedElementNode
>;

export class LayoutContainerNode extends ElementNode {
  __templateColumns: string;

  static getType(): string {
    return "layout-container";
  }

  static clone(node: LayoutContainerNode): LayoutContainerNode {
    return new LayoutContainerNode(node.__templateColumns, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedLayoutContainerNode>
  ): LayoutContainerNode {
    return new LayoutContainerNode().updateFromJSON(serializedNode);
  }

  constructor(templateColumns = DEFAULT_COLUMNS, key?: NodeKey) {
    super(key);
    this.__templateColumns = templateColumns;
  }

  updateFromJSON(
    serializedNode: LexicalParseJSON<SerializedLayoutContainerNode>
  ): this {
    const { templateColumns } = serializedNode;
    return super
      .updateFromJSON(serializedNode)
      .setTemplateColumns(
        typeof templateColumns === "string" ? templateColumns : DEFAULT_COLUMNS
      );
  }

  exportJSON(): SerializedLayoutContainerNode {
    return {
      ...super.exportJSON(),
      templateColumns: this.getTemplateColumns(),
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    element.style.gridTemplateColumns = this.__templateColumns;
    addClassNamesToElement(element, config.theme.layoutContainer);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      dom.style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }

  getTemplateColumns(): string {
    return this.getLatest().__templateColumns;
  }

  setTemplateColumns(templateColumns: string): this {
    const writable = this.getWritable();
    writable.__templateColumns = templateColumns;
    return writable;
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }
}

export class LayoutItemNode extends ElementNode {
  static getType(): string {
    return "layout-item";
  }

  static clone(node: LayoutItemNode): LayoutItemNode {
    return new LayoutItemNode(node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedElementNode>
  ): LayoutItemNode {
    return new LayoutItemNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.layoutItem);
    return element;
  }

  updateDOM(): false {
    return false;
  }

  // Backspace at the start of an empty layout removes the whole layout
  collapseAtStart(): boolean {
    const parent = this.getParentOrThrow();
    const isEmptyLayout = parent
      .getChildren()
      .every(
        (child) => $isLayoutItemNode(child) && child.getTextContentSize() === 0
      );
    if (this.is(parent.getFirstChild()) && isEmptyLayout) {
      parent.remove();
      return true;
    }
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }
}

export const $createLayoutContainerNode = (
  templateColumns = DEFAULT_COLUMNS
): LayoutContainerNode => new LayoutContainerNode(templateColumns);

export const $createLayoutItemNode = (): LayoutItemNode => new LayoutItemNode();

export const $isLayoutContainerNode = (
  node: LexicalNode | null | undefined
): node is LayoutContainerNode => node instanceof LayoutContainerNode;

export const $isLayoutItemNode = (
  node: LexicalNode | null | undefined
): node is LayoutItemNode => node instanceof LayoutItemNode;
