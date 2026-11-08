/**
 * Text with a small reading guide above it (ruby annotation), written to
 * markdown as `<ruby>base<rt>annotation</rt></ruby>`.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { addClassNamesToElement } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type EditorConfig,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedPartial,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from "lexical";

export type SerializedRubyNode = Spread<
  { annotation: string },
  SerializedTextNode
>;

export class RubyNode extends TextNode {
  __annotation: string;

  static getType(): string {
    return "ruby";
  }

  static clone(node: RubyNode): RubyNode {
    return new RubyNode(node.__text, node.__annotation, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedRubyNode>
  ): RubyNode {
    return new RubyNode().updateFromJSON(serializedNode);
  }

  constructor(text = "", annotation = "", key?: NodeKey) {
    super(text, key);
    this.__annotation = annotation;
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedRubyNode>): this {
    const { annotation } = serializedNode;
    return super
      .updateFromJSON(serializedNode)
      .setAnnotation(typeof annotation === "string" ? annotation : "");
  }

  exportJSON(): SerializedRubyNode {
    return { ...super.exportJSON(), annotation: this.getAnnotation() };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    addClassNamesToElement(element, config.theme.ruby);
    element.dataset.annotation = this.__annotation;
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const shouldRecreate = super.updateDOM(prevNode, dom, config);
    if (prevNode.__annotation !== this.__annotation) {
      dom.dataset.annotation = this.__annotation;
    }
    return shouldRecreate;
  }

  getAnnotation(): string {
    return this.getLatest().__annotation;
  }

  setAnnotation(annotation: string): this {
    const writable = this.getWritable();
    writable.__annotation = annotation;
    return writable;
  }

  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }
}

export const $createRubyNode = (text: string, annotation: string): RubyNode =>
  new RubyNode(text, annotation).setMode("token");

export const $isRubyNode = (
  node: LexicalNode | null | undefined
): node is RubyNode => node instanceof RubyNode;

// Annotates the selected text, or removes annotations when `annotation` is null
export const $toggleRuby = (annotation: string | null) => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }
  if (annotation === null) {
    for (const node of selection.getNodes()) {
      if ($isRubyNode(node)) {
        const text = $createTextNode(node.getTextContent())
          .setFormat(node.getFormat())
          .setStyle(node.getStyle());
        node.replace(text);
      }
    }
    return;
  }
  if (selection.isCollapsed()) {
    return;
  }
  const first = selection.getNodes().find($isTextNode);
  const ruby = $createRubyNode(selection.getTextContent(), annotation);
  if (first) {
    ruby.setFormat(first.getFormat()).setStyle(first.getStyle());
  }
  selection.insertNodes([ruby]);
};
