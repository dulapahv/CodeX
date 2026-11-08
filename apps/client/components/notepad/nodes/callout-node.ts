/**
 * A callout block (note, tip, info, caution, danger) that holds other
 * blocks. It reads and writes the `:::kind` directive syntax the previous
 * notepad used, so older notes open unchanged.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { addClassNamesToElement } from "@lexical/utils";
import {
  $applyNodeReplacement,
  type EditorConfig,
  ElementNode,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedElementNode,
  type SerializedPartial,
  type Spread,
} from "lexical";

export const CALLOUT_KINDS = {
  caution: "Caution",
  danger: "Danger",
  info: "Info",
  note: "Note",
  tip: "Tip",
} as const;

export type CalloutKind = keyof typeof CALLOUT_KINDS;

export const isCalloutKind = (value: string): value is CalloutKind =>
  Object.hasOwn(CALLOUT_KINDS, value);

export type SerializedCalloutNode = Spread<
  { kind: CalloutKind },
  SerializedElementNode
>;

const applyKind = (element: HTMLElement, kind: CalloutKind) => {
  element.dataset.kind = kind;
  element.dataset.label = CALLOUT_KINDS[kind];
};

export class CalloutNode extends ElementNode {
  __kind: CalloutKind;

  static getType(): string {
    return "callout";
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__kind, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedCalloutNode>
  ): CalloutNode {
    return new CalloutNode().updateFromJSON(serializedNode);
  }

  constructor(kind: CalloutKind = "note", key?: NodeKey) {
    super(key);
    this.__kind = kind;
  }

  updateFromJSON(
    serializedNode: LexicalParseJSON<SerializedCalloutNode>
  ): this {
    const { kind } = serializedNode;
    return super
      .updateFromJSON(serializedNode)
      .setKind(typeof kind === "string" && isCalloutKind(kind) ? kind : "note");
  }

  exportJSON(): SerializedCalloutNode {
    return { ...super.exportJSON(), kind: this.getKind() };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.callout);
    applyKind(element, this.__kind);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__kind !== this.__kind) {
      applyKind(dom, this.__kind);
    }
    return false;
  }

  getKind(): CalloutKind {
    return this.getLatest().__kind;
  }

  setKind(kind: CalloutKind): this {
    const writable = this.getWritable();
    writable.__kind = kind;
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

export const $createCalloutNode = (kind: CalloutKind = "note"): CalloutNode =>
  $applyNodeReplacement(new CalloutNode(kind));

export const $isCalloutNode = (
  node: LexicalNode | null | undefined
): node is CalloutNode => node instanceof CalloutNode;
