/**
 * An inline date chip. Clicking it picks another date. Written to markdown
 * as `<time datetime="2026-01-31">Jan 31, 2026</time>`.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import {
  $getNodeByKey,
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
import type { JSX } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { restoreEditorFocus } from "../utils";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeZone: "UTC",
});

export const isIsoDate = (value: string) =>
  ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));

export const todayIsoDate = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const formatIsoDate = (date: string) =>
  isIsoDate(date) ? DATE_FORMAT.format(new Date(date)) : date;

export type SerializedDateNode = Spread<
  { date: string },
  SerializedLexicalNode
>;

const DateView = ({ date, nodeKey }: { date: string; nodeKey: NodeKey }) => {
  const [editor] = useLexicalComposerContext();

  const setDate = (value: string) => {
    if (!isIsoDate(value)) {
      return;
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isDateNode(node)) {
        node.setDate(value);
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button className="notepad-date" title="Change date" type="button">
            <CalendarBlankIcon aria-hidden="true" />
            {formatIsoDate(date)}
          </button>
        }
      />
      <PopoverContent
        align="start"
        className="w-56"
        finalFocus={() => restoreEditorFocus(editor)}
      >
        <Input
          aria-label="Date"
          onChange={(event) => setDate(event.target.value)}
          type="date"
          value={date}
        />
        <Button
          onClick={() => setDate(todayIsoDate())}
          size="sm"
          variant="secondary"
        >
          Today
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export class DateNode extends DecoratorNode<JSX.Element> {
  __date: string;

  static getType(): string {
    return "date";
  }

  static clone(node: DateNode): DateNode {
    return new DateNode(node.__date, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedDateNode>
  ): DateNode {
    return new DateNode().updateFromJSON(serializedNode);
  }

  constructor(date = todayIsoDate(), key?: NodeKey) {
    super(key);
    this.__date = date;
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedDateNode>): this {
    const { date } = serializedNode;
    return super
      .updateFromJSON(serializedNode)
      .setDate(
        typeof date === "string" && isIsoDate(date) ? date : todayIsoDate()
      );
  }

  exportJSON(): SerializedDateNode {
    return { ...super.exportJSON(), date: this.getDate() };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("time");
    element.dateTime = this.__date;
    element.textContent = formatIsoDate(this.__date);
    return { element };
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return formatIsoDate(this.getDate());
  }

  getDate(): string {
    return this.getLatest().__date;
  }

  setDate(date: string): this {
    const writable = this.getWritable();
    writable.__date = date;
    return writable;
  }

  isInline(): true {
    return true;
  }

  decorate(_editor: unknown, _config: EditorConfig): JSX.Element {
    return <DateView date={this.__date} nodeKey={this.getKey()} />;
  }
}

export const $createDateNode = (date = todayIsoDate()): DateNode =>
  new DateNode(date);

export const $isDateNode = (
  node: LexicalNode | null | undefined
): node is DateNode => node instanceof DateNode;
