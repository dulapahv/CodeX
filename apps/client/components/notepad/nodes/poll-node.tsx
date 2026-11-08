/**
 * A poll everyone in the room can vote on and add options to. Votes are kept
 * by name. Written to markdown as a `poll` fenced block of JSON.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CheckIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import {
  $getNodeByKey,
  DecoratorNode,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedPartial,
  type Spread,
} from "lexical";
import { type FormEvent, type JSX, useState } from "react";

import { Input } from "@/components/ui/input";
import { useRoom } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { BlockFrame } from "../components/block-frame";
import { ToolbarButton } from "../components/toolbar-button";

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export type SerializedPollNode = Spread<
  { options: PollOption[]; question: string },
  SerializedLexicalNode
>;

export const createPollOption = (text: string, votes: string[] = []) => ({
  id: crypto.randomUUID(),
  text,
  votes,
});

const isPollOption = (value: unknown): value is PollOption => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { id, text, votes } = value as Record<string, unknown>;
  return (
    typeof id === "string" &&
    typeof text === "string" &&
    Array.isArray(votes) &&
    votes.every((vote) => typeof vote === "string")
  );
};

export const parsePollOptions = (value: unknown): PollOption[] =>
  Array.isArray(value) ? value.filter(isPollOption) : [];

const PollView = ({
  nodeKey,
  options,
  question,
}: {
  nodeKey: NodeKey;
  options: PollOption[];
  question: string;
}) => {
  const [editor] = useLexicalComposerContext();
  const room = useRoom();
  const [draft, setDraft] = useState("");
  const voter = room.getPresence().get(room.clientId)?.user.name ?? "";
  const totalVotes = options.reduce(
    (total, option) => total + option.votes.length,
    0
  );

  const updateOptions = (update: (current: PollOption[]) => PollOption[]) =>
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isPollNode(node)) {
        node.setOptions(update(node.getOptions()));
      }
    });

  const toggleVote = (id: string) =>
    updateOptions((current) =>
      current.map((option) => {
        if (option.id !== id) {
          return option;
        }
        const votes = option.votes.includes(voter)
          ? option.votes.filter((name) => name !== voter)
          : [...option.votes, voter];
        return { ...option, votes };
      })
    );

  const addOption = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    updateOptions((current) => [...current, createPollOption(text)]);
    setDraft("");
  };

  return (
    <BlockFrame
      className="border-foreground/15 bg-foreground/5 border p-3"
      nodeKey={nodeKey}
    >
      <p className="mb-2 pr-10 font-semibold">{question || "Poll"}</p>
      <ul className="grid gap-1.5">
        {options.map((option) => {
          const hasVoted = option.votes.includes(voter);
          const share = totalVotes ? option.votes.length / totalVotes : 0;
          return (
            <li className="flex items-center gap-1" key={option.id}>
              <button
                aria-pressed={hasVoted}
                className={cn(
                  "border-foreground/20 hover:border-primary relative flex min-h-8 flex-1 items-center gap-2 overflow-hidden border px-2 text-left text-sm",
                  hasVoted && "border-primary"
                )}
                onClick={() => toggleVote(option.id)}
                title={option.votes.join(", ") || "No votes yet"}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="bg-primary/15 absolute inset-y-0 left-0 transition-[width]"
                  style={{ width: `${share * 100}%` }}
                />
                <span
                  className={cn(
                    "border-foreground/40 relative flex size-4 shrink-0 items-center justify-center border",
                    hasVoted &&
                      "border-primary bg-primary text-primary-foreground"
                  )}
                >
                  {hasVoted && <CheckIcon className="size-3" />}
                </span>
                <span className="relative flex-1 truncate">{option.text}</span>
                <span className="text-muted-foreground relative text-xs">
                  {option.votes.length}
                </span>
              </button>
              <ToolbarButton
                className="size-7"
                label={`Remove ${option.text}`}
                onClick={() =>
                  updateOptions((current) =>
                    current.filter(({ id }) => id !== option.id)
                  )
                }
              >
                <XIcon />
              </ToolbarButton>
            </li>
          );
        })}
      </ul>
      <form className="mt-2 flex gap-1" onSubmit={addOption}>
        <Input
          aria-label="New option"
          className="h-8 flex-1"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an option"
          value={draft}
        />
        <ToolbarButton
          className="size-8"
          disabled={!draft.trim()}
          label="Add option"
          type="submit"
        >
          <PlusIcon />
        </ToolbarButton>
      </form>
      <p className="text-muted-foreground mt-2 text-xs">
        {totalVotes === 1 ? "1 vote" : `${totalVotes} votes`}
      </p>
    </BlockFrame>
  );
};

export class PollNode extends DecoratorNode<JSX.Element> {
  __question: string;
  __options: PollOption[];

  static getType(): string {
    return "poll";
  }

  static clone(node: PollNode): PollNode {
    return new PollNode(node.__question, node.__options, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedPollNode>
  ): PollNode {
    return new PollNode().updateFromJSON(serializedNode);
  }

  constructor(question = "", options: PollOption[] = [], key?: NodeKey) {
    super(key);
    this.__question = question;
    this.__options = options;
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedPollNode>): this {
    const { options, question } = serializedNode;
    const writable = super.updateFromJSON(serializedNode).getWritable();
    writable.__question = typeof question === "string" ? question : "";
    writable.__options = parsePollOptions(options);
    return writable;
  }

  exportJSON(): SerializedPollNode {
    return {
      ...super.exportJSON(),
      options: this.getOptions(),
      question: this.getQuestion(),
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return this.getQuestion();
  }

  getQuestion(): string {
    return this.getLatest().__question;
  }

  getOptions(): PollOption[] {
    return this.getLatest().__options;
  }

  setOptions(options: PollOption[]): this {
    const writable = this.getWritable();
    writable.__options = options;
    return writable;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <PollView
        nodeKey={this.getKey()}
        options={this.__options}
        question={this.__question}
      />
    );
  }
}

export const $createPollNode = (
  question: string,
  options: PollOption[]
): PollNode => new PollNode(question, options);

export const $isPollNode = (
  node: LexicalNode | null | undefined
): node is PollNode => node instanceof PollNode;
