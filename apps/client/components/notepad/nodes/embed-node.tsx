/**
 * An embedded YouTube video, X post or Figma file, shown in an iframe and
 * written to markdown as that `<iframe>`.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalNode,
  type LexicalParseJSON,
  type NodeKey,
  type SerializedLexicalNode,
  type SerializedPartial,
  type Spread,
} from "lexical";
import { useTheme } from "next-themes";
import { type JSX, useEffect, useState } from "react";

import { BlockFrame } from "../components/block-frame";
import { ToolbarButton } from "../components/toolbar-button";

export const EMBED_PROVIDERS = {
  figma: "Figma file",
  x: "X post",
  youtube: "YouTube video",
} as const;

export type EmbedProvider = keyof typeof EMBED_PROVIDERS;

const YOUTUBE_URL =
  /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)(?<id>[\w-]{11})/u;
const X_URL =
  /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/\w+\/status(?:es)?\/(?<id>\d+)/u;
const FIGMA_URL =
  /^https:\/\/(?:[\w-]+\.)?figma\.com\/(?:file|proto|design|board|slides)\/[\w-]{22,128}(?:\/.*)?$/u;
const X_EMBED_ORIGIN = "https://platform.twitter.com";
const DEFAULT_X_HEIGHT = 400;

// The id each provider's embed is built from, or null for a URL it can't embed
export const getEmbedId = (provider: EmbedProvider, url: string) => {
  const trimmed = url.trim();
  if (provider === "youtube") {
    return trimmed.match(YOUTUBE_URL)?.groups?.id ?? null;
  }
  if (provider === "x") {
    return trimmed.match(X_URL)?.groups?.id ?? null;
  }
  return FIGMA_URL.test(trimmed) ? trimmed : null;
};

export const getEmbedSource = (
  provider: EmbedProvider,
  url: string,
  theme?: string
) => {
  const id = getEmbedId(provider, url);
  if (!id) {
    return null;
  }
  if (provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (provider === "x") {
    const themeParam = theme ? `&theme=${theme}` : "";
    return `${X_EMBED_ORIGIN}/embed/Tweet.html?id=${id}&dnt=true${themeParam}`;
  }
  return `https://www.figma.com/embed?embed_host=codex&url=${encodeURIComponent(id)}`;
};

const YOUTUBE_EMBED =
  /^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/(?<id>[\w-]{11})/u;
const X_EMBED =
  /^https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?(?:.*&)?id=(?<id>\d+)/u;
const FIGMA_EMBED =
  /^https:\/\/www\.figma\.com\/embed\?(?:.*&)?url=(?<url>[^&]+)/u;

// The provider and original link behind an embed's frame address
export const getEmbedFromSource = (
  source: string
): { provider: EmbedProvider; url: string } | null => {
  const youtube = source.match(YOUTUBE_EMBED)?.groups?.id;
  if (youtube) {
    return {
      provider: "youtube",
      url: `https://www.youtube.com/watch?v=${youtube}`,
    };
  }
  const post = source.match(X_EMBED)?.groups?.id;
  if (post) {
    return { provider: "x", url: `https://x.com/i/status/${post}` };
  }
  const figma = source.match(FIGMA_EMBED)?.groups?.url;
  if (figma) {
    const url = decodeURIComponent(figma);
    return getEmbedId("figma", url) ? { provider: "figma", url } : null;
  }
  return null;
};

// X's embed reports its height in a message, so the frame can fit the post
const useXHeight = (frame: HTMLIFrameElement | null) => {
  const [height, setHeight] = useState(DEFAULT_X_HEIGHT);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== X_EMBED_ORIGIN ||
        event.source !== frame?.contentWindow
      ) {
        return;
      }
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        const reported = data?.["twttr.embed"]?.params?.[0]?.height;
        if (typeof reported === "number" && reported > 0) {
          setHeight(Math.ceil(reported));
        }
      } catch {
        // Other messages from the frame aren't JSON
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frame]);

  return height;
};

const EmbedView = ({
  nodeKey,
  provider,
  url,
}: {
  nodeKey: NodeKey;
  provider: EmbedProvider;
  url: string;
}) => {
  const { resolvedTheme } = useTheme();
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const xHeight = useXHeight(provider === "x" ? frame : null);
  const source = getEmbedSource(provider, url, resolvedTheme);
  // Peers can write any url into the shared note, so only open known links
  const canOpen = getEmbedId(provider, url) !== null;

  return (
    <BlockFrame
      actions={
        <ToolbarButton
          className="size-6"
          disabled={!canOpen}
          label="Open original"
          onClick={() => {
            if (canOpen) {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }}
        >
          <ArrowSquareOutIcon />
        </ToolbarButton>
      }
      className={provider === "x" ? "max-w-[550px]" : undefined}
      nodeKey={nodeKey}
    >
      {source ? (
        <iframe
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="border-foreground/15 block w-full border"
          ref={setFrame}
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
          src={source}
          style={
            provider === "x"
              ? { height: xHeight }
              : { aspectRatio: provider === "youtube" ? "16 / 9" : "4 / 3" }
          }
          title={EMBED_PROVIDERS[provider]}
        />
      ) : (
        <p className="border-foreground/15 text-muted-foreground border p-3">
          This link can't be embedded.
        </p>
      )}
    </BlockFrame>
  );
};

export type SerializedEmbedNode = Spread<
  { provider: EmbedProvider; url: string },
  SerializedLexicalNode
>;

const isEmbedProvider = (value: unknown): value is EmbedProvider =>
  typeof value === "string" && Object.hasOwn(EMBED_PROVIDERS, value);

export class EmbedNode extends DecoratorNode<JSX.Element> {
  __provider: EmbedProvider;
  __url: string;

  static getType(): string {
    return "embed";
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(node.__provider, node.__url, node.__key);
  }

  static importJSON(
    serializedNode: SerializedPartial<SerializedEmbedNode>
  ): EmbedNode {
    return new EmbedNode().updateFromJSON(serializedNode);
  }

  constructor(provider: EmbedProvider = "youtube", url = "", key?: NodeKey) {
    super(key);
    this.__provider = provider;
    this.__url = url;
  }

  updateFromJSON(serializedNode: LexicalParseJSON<SerializedEmbedNode>): this {
    const { provider, url } = serializedNode;
    const writable = super.updateFromJSON(serializedNode).getWritable();
    writable.__provider = isEmbedProvider(provider) ? provider : "youtube";
    writable.__url =
      typeof url === "string" && getEmbedId(writable.__provider, url)
        ? url
        : "";
    return writable;
  }

  exportJSON(): SerializedEmbedNode {
    return {
      ...super.exportJSON(),
      provider: this.getProvider(),
      url: this.getUrl(),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("iframe");
    const source = getEmbedSource(this.__provider, this.__url);
    if (source) {
      element.src = source;
    }
    return { element };
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  getTextContent(): string {
    return this.getUrl();
  }

  getProvider(): EmbedProvider {
    return this.getLatest().__provider;
  }

  getUrl(): string {
    return this.getLatest().__url;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <EmbedView
        nodeKey={this.getKey()}
        provider={this.__provider}
        url={this.__url}
      />
    );
  }
}

export const $createEmbedNode = (
  provider: EmbedProvider,
  url: string
): EmbedNode => new EmbedNode(provider, url.trim());

export const $isEmbedNode = (
  node: LexicalNode | null | undefined
): node is EmbedNode => node instanceof EmbedNode;
