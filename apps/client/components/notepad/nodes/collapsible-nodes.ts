/**
 * A collapsible section with a title line and a body of blocks, written to
 * markdown as `<details>` and `<summary>`. Whether it is open is kept per
 * person, so folding a section doesn't fold it for everyone.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { addClassNamesToElement } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type EditorConfig,
  ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedElementNode,
  type SerializedPartial,
  type Spread,
} from "lexical";

// Width of the chevron that toggles the section
const TOGGLE_AREA = 24;

export type SerializedCollapsibleContainerNode = Spread<
  { open: boolean },
  SerializedElementNode
>;

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  static getType(): string {
    return "collapsible-container";
  }

  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedCollapsibleContainerNode>
  ): CollapsibleContainerNode {
    return new CollapsibleContainerNode().updateFromJSON(serializedNode);
  }

  constructor(open = true, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  updateFromJSON(
    serializedNode: LexicalParseJSON<SerializedCollapsibleContainerNode>
  ): this {
    const { open } = serializedNode;
    return super.updateFromJSON(serializedNode).setOpen(open !== false);
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return { ...super.exportJSON(), open: this.getOpen() };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.collapsible);
    element.toggleAttribute("data-open", this.__open);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__open !== this.__open) {
      dom.toggleAttribute("data-open", this.__open);
    }
    return false;
  }

  getOpen(): boolean {
    return this.getLatest().__open;
  }

  setOpen(open: boolean): this {
    const writable = this.getWritable();
    writable.__open = open;
    return writable;
  }

  // Closing a section with the caret inside its body moves the caret to the title
  toggleOpen(): this {
    const open = !this.getOpen();
    const content = this.getLastChild();
    const selection = $getSelection();
    if (
      !open &&
      $isRangeSelection(selection) &&
      $isElementNode(content) &&
      content.isParentOf(selection.anchor.getNode())
    ) {
      this.getFirstChild()?.selectEnd();
    }
    return this.setOpen(open);
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }
}

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return "collapsible-title";
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedElementNode>
  ): CollapsibleTitleNode {
    return new CollapsibleTitleNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.collapsibleTitle);
    element.addEventListener("click", (event) => {
      const { left } = element.getBoundingClientRect();
      if (event.clientX - left > TOGGLE_AREA) {
        return;
      }
      event.preventDefault();
      editor.update(() => {
        const container = this.getLatest().getParent();
        if ($isCollapsibleContainerNode(container)) {
          container.toggleOpen();
        }
      });
    });
    return element;
  }

  updateDOM(): false {
    return false;
  }

  // Enter in the title moves into the body, or below the section when closed
  insertNewAfter(): ElementNode {
    const container = this.getParentOrThrow();
    const content = this.getNextSibling();
    if (
      $isCollapsibleContainerNode(container) &&
      container.getOpen() &&
      $isElementNode(content)
    ) {
      const first = content.getFirstChild();
      if ($isElementNode(first)) {
        return first;
      }
      const paragraph = $createParagraphNode();
      content.append(paragraph);
      return paragraph;
    }
    const paragraph = $createParagraphNode();
    container.insertAfter(paragraph);
    return paragraph;
  }

  // Backspace at the start of the title turns the section back into blocks
  collapseAtStart(): boolean {
    const container = this.getParent();
    if (!$isCollapsibleContainerNode(container)) {
      return false;
    }
    const title = $createParagraphNode().append(...this.getChildren());
    container.insertBefore(title);
    const content = container.getLastChild();
    if ($isElementNode(content)) {
      for (const child of content.getChildren()) {
        container.insertBefore(child);
      }
    }
    container.remove();
    title.selectStart();
    return true;
  }
}

export class CollapsibleContentNode extends ElementNode {
  static getType(): string {
    return "collapsible-content";
  }

  static clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedElementNode>
  ): CollapsibleContentNode {
    return new CollapsibleContentNode().updateFromJSON(serializedNode);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.collapsibleContent);
    return element;
  }

  updateDOM(): false {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): false {
    return false;
  }
}

export const $createCollapsibleContainerNode = (
  open = true
): CollapsibleContainerNode => new CollapsibleContainerNode(open);

export const $createCollapsibleTitleNode = (): CollapsibleTitleNode =>
  new CollapsibleTitleNode();

export const $createCollapsibleContentNode = (): CollapsibleContentNode =>
  new CollapsibleContentNode();

export const $isCollapsibleContainerNode = (
  node: LexicalNode | null | undefined
): node is CollapsibleContainerNode => node instanceof CollapsibleContainerNode;

export const $isCollapsibleTitleNode = (
  node: LexicalNode | null | undefined
): node is CollapsibleTitleNode => node instanceof CollapsibleTitleNode;

export const $isCollapsibleContentNode = (
  node: LexicalNode | null | undefined
): node is CollapsibleContentNode => node instanceof CollapsibleContentNode;
