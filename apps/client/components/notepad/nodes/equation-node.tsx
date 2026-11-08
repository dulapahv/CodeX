/**
 * A math equation rendered with KaTeX, inline (`$x$`) or as its own block
 * (`$$x$$`). Double-click to edit it.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import "katex/dist/katex.min.css";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import katex from "katex";
import {
  DecoratorNode,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedPartial,
  type Spread,
} from "lexical";
import { type JSX, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import {
  type EquationPayload,
  OPEN_EQUATION_DIALOG_COMMAND,
} from "../commands";
import { BlockFrame } from "../components/block-frame";
import { ToolbarButton } from "../components/toolbar-button";

export type SerializedEquationNode = Spread<
  EquationPayload,
  SerializedLexicalNode
>;

export const renderEquation = (
  element: HTMLElement,
  { equation, inline }: EquationPayload
) => {
  katex.render(equation, element, {
    displayMode: !inline,
    output: "html",
    strict: "ignore",
    throwOnError: false,
    trust: false,
  });
};

const EquationView = ({
  equation,
  inline,
  nodeKey,
}: EquationPayload & { nodeKey: NodeKey }) => {
  const [editor] = useLexicalComposerContext();
  const [isSelected] = useLexicalNodeSelection(nodeKey);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      renderEquation(ref.current, { equation, inline });
    }
  }, [equation, inline]);

  const edit = () =>
    editor.dispatchCommand(OPEN_EQUATION_DIALOG_COMMAND, {
      equation,
      inline,
      nodeKey,
    });

  if (inline) {
    return (
      <button
        className={cn(
          "notepad-equation-inline",
          isSelected && "outline-primary outline-2 outline-offset-1"
        )}
        data-selectable
        onDoubleClick={edit}
        title="Double-click to edit"
        type="button"
      >
        <span ref={ref} />
      </button>
    );
  }

  return (
    <BlockFrame
      actions={
        <ToolbarButton className="size-6" label="Edit equation" onClick={edit}>
          <PencilSimpleIcon />
        </ToolbarButton>
      }
      nodeKey={nodeKey}
    >
      <button
        className="block w-full cursor-default overflow-x-auto py-1"
        data-selectable
        onDoubleClick={edit}
        title="Double-click to edit"
        type="button"
      >
        <span ref={ref} />
      </button>
    </BlockFrame>
  );
};

export class EquationNode extends DecoratorNode<JSX.Element> {
  __equation: string;
  __inline: boolean;

  static getType(): string {
    return "equation";
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedEquationNode>
  ): EquationNode {
    return new EquationNode().updateFromJSON(serializedNode);
  }

  constructor(equation = "", inline = false, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  updateFromJSON(
    serializedNode: LexicalParseJSON<SerializedEquationNode>
  ): this {
    const { equation, inline } = serializedNode;
    const writable = super.updateFromJSON(serializedNode).getWritable();
    writable.__equation = typeof equation === "string" ? equation : "";
    writable.__inline = inline === true;
    return writable;
  }

  exportJSON(): SerializedEquationNode {
    return {
      ...super.exportJSON(),
      equation: this.getEquation(),
      inline: this.isInline(),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.__inline ? "span" : "div");
    renderEquation(element, {
      equation: this.__equation,
      inline: this.__inline,
    });
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement(this.__inline ? "span" : "div");
    element.className = config.theme.equation ?? "";
    return element;
  }

  updateDOM(prevNode: this): boolean {
    return prevNode.__inline !== this.__inline;
  }

  getTextContent(): string {
    return this.getEquation();
  }

  getEquation(): string {
    return this.getLatest().__equation;
  }

  setEquation(equation: string): this {
    const writable = this.getWritable();
    writable.__equation = equation;
    return writable;
  }

  isInline(): boolean {
    return this.getLatest().__inline;
  }

  decorate(): JSX.Element {
    return (
      <EquationView
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.getKey()}
      />
    );
  }
}

export const $createEquationNode = ({
  equation,
  inline,
}: EquationPayload): EquationNode => new EquationNode(equation, inline);

export const $isEquationNode = (
  node: LexicalNode | null | undefined
): node is EquationNode => node instanceof EquationNode;
