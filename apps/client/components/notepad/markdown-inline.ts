/**
 * Inline markdown for the notepad beyond standard markdown. Text styles,
 * underline, superscript, subscript and ruby are written as HTML tags, inline
 * equations as `$x$`, and dates as `<time>`.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { TextMatchTransformer } from "@lexical/markdown";
import {
  getCSSFromStyleObject,
  getStyleObjectFromCSS,
} from "@lexical/selection";
import { $isTextNode, type TextFormatType, type TextNode } from "lexical";

import {
  $createDateNode,
  $isDateNode,
  DateNode,
  formatIsoDate,
  isIsoDate,
} from "./nodes/date-node";
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from "./nodes/equation-node";
import { $createImageNode, $isImageNode, ImageNode } from "./nodes/image-node";
import { $createRubyNode, $isRubyNode, RubyNode } from "./nodes/ruby-node";

const HTML_FORMAT_TAGS = {
  sub: "subscript",
  sup: "superscript",
  u: "underline",
} as const satisfies Record<string, TextFormatType>;

const TEXT_TRANSFORM_FORMATS = {
  capitalize: "capitalize",
  lowercase: "lowercase",
  uppercase: "uppercase",
} as const satisfies Record<string, TextFormatType>;

// Only these come back from a style attribute, so a note can't restyle the page
const STYLE_PROPERTIES = new Set([
  "background-color",
  "color",
  "font-family",
  "font-size",
]);

const DOUBLE_QUOTE = /"/gu;
const ATTRIBUTE = /(?<name>[\w-]+)(?:="(?<value>[^"]*)")?/gu;
const ATTRIBUTE_SPECIAL_CHARACTER = /[&"<>]/gu;
const ATTRIBUTE_ENTITY = /&(?<entity>amp|quot|lt|gt);/gu;

const ATTRIBUTE_ENTITIES: Record<string, string> = {
  '"': "quot",
  "&": "amp",
  "<": "lt",
  ">": "gt",
};

const ENTITY_CHARACTERS = Object.fromEntries(
  Object.entries(ATTRIBUTE_ENTITIES).map(([character, entity]) => [
    entity,
    character,
  ])
);

const escapeAttribute = (value: string) =>
  value.replace(
    ATTRIBUTE_SPECIAL_CHARACTER,
    (character) => `&${ATTRIBUTE_ENTITIES[character]};`
  );

const unescapeAttribute = (value: string) =>
  value.replace(
    ATTRIBUTE_ENTITY,
    (entity, name: string) => ENTITY_CHARACTERS[name] ?? entity
  );

export const parseAttributes = (source: string) =>
  Object.fromEntries(
    [...source.matchAll(ATTRIBUTE)].map(({ groups }) => [
      groups?.name ?? "",
      groups?.value ?? "",
    ])
  );

const isHtmlFormatTag = (tag: string): tag is keyof typeof HTML_FORMAT_TAGS =>
  Object.hasOwn(HTML_FORMAT_TAGS, tag);

const isTextTransform = (
  value: string
): value is keyof typeof TEXT_TRANSFORM_FORMATS =>
  Object.hasOwn(TEXT_TRANSFORM_FORMATS, value);

export const sanitizeTextStyle = (css: string) => {
  const style: Record<string, string> = {};
  for (const [property, value] of Object.entries(getStyleObjectFromCSS(css))) {
    if (STYLE_PROPERTIES.has(property) && value) {
      style[property] = value.replace(DOUBLE_QUOTE, "'");
    }
  }
  return getCSSFromStyleObject(style);
};

const getExportStyle = (node: TextNode) => {
  const style = getStyleObjectFromCSS(sanitizeTextStyle(node.getStyle()));
  const transform = Object.keys(TEXT_TRANSFORM_FORMATS).find((format) =>
    node.hasFormat(format as TextFormatType)
  );
  return getCSSFromStyleObject(
    transform ? { ...style, "text-transform": transform } : style
  );
};

const $applyImportedStyle = (node: TextNode, css: string) => {
  const { "text-transform": transform, ...style } = getStyleObjectFromCSS(css);
  node.setStyle(sanitizeTextStyle(getCSSFromStyleObject(style)));
  if (transform && isTextTransform(transform) && !node.hasFormat(transform)) {
    node.toggleFormat(transform);
  }
};

// Wraps styled text in a span, then underline, superscript and subscript tags
export const STYLED_TEXT: TextMatchTransformer = {
  dependencies: [],
  export: (node, _exportChildren, exportFormat) => {
    if (!$isTextNode(node) || node.getType() !== "text") {
      return null;
    }
    const tags = Object.entries(HTML_FORMAT_TAGS)
      .filter(([, format]) => node.hasFormat(format))
      .map(([tag]) => tag);
    const style = getExportStyle(node);
    if (tags.length === 0 && !style) {
      return null;
    }
    const opening = tags.map((tag) => `<${tag}>`).join("");
    const closing = tags
      .toReversed()
      .map((tag) => `</${tag}>`)
      .join("");
    const inner = `${opening}${exportFormat(node, node.getTextContent())}${closing}`;
    return style ? `<span style="${style}">${inner}</span>` : inner;
  },
  importRegExp:
    /<(?:span style="(?<style>[^"]*)"|(?<tag>u|sup|sub))>(?<text>.+?)<\/(?:span|\k<tag>)>/u,
  regExp:
    /<(?:span style="(?<style>[^"]*)"|(?<tag>u|sup|sub))>(?<text>.+?)<\/(?:span|\k<tag>)>$/u,
  replace: (textNode, match) => {
    const { style, tag, text } = match.groups ?? {};
    if (!text) {
      return;
    }
    textNode.setTextContent(text);
    if (style !== undefined) {
      $applyImportedStyle(textNode, style);
    } else if (tag && isHtmlFormatTag(tag)) {
      const format = HTML_FORMAT_TAGS[tag];
      if (!textNode.hasFormat(format)) {
        textNode.toggleFormat(format);
      }
    }
    return textNode;
  },
  trigger: ">",
  type: "text-match",
};

export const RUBY: TextMatchTransformer = {
  dependencies: [RubyNode],
  export: (node, _exportChildren, exportFormat) =>
    $isRubyNode(node)
      ? `<ruby>${exportFormat(node, node.getTextContent())}<rt>${node.getAnnotation()}</rt></ruby>`
      : null,
  importRegExp: /<ruby>(?<base>[^<]+)<rt>(?<annotation>[^<]*)<\/rt><\/ruby>/u,
  regExp: /<ruby>(?<base>[^<]+)<rt>(?<annotation>[^<]*)<\/rt><\/ruby>$/u,
  replace: (textNode, match) => {
    const { annotation = "", base = "" } = match.groups ?? {};
    textNode.replace(
      $createRubyNode(base, annotation)
        .setFormat(textNode.getFormat())
        .setStyle(textNode.getStyle())
    );
  },
  trigger: ">",
  type: "text-match",
};

const exportImage = (node: ImageNode) => {
  const width = node.getWidth();
  const caption = node.getCaption();
  if (!(width || caption)) {
    return `![${node.getAltText()}](${node.getSrc()})`;
  }
  const attributes = [
    `src="${escapeAttribute(node.getSrc())}"`,
    `alt="${escapeAttribute(node.getAltText())}"`,
    width ? `width="${width}"` : "",
    caption ? `data-caption="${escapeAttribute(caption)}"` : "",
  ];
  return `<img ${attributes.filter(Boolean).join(" ")}>`;
};

// Sized or captioned images are written as img tags
export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => ($isImageNode(node) ? exportImage(node) : null),
  importRegExp:
    /!\[(?<alt>[^[\]]*)\]\((?<src>[^()\s]+)\)|<img(?<attributes>(?:\s+[\w-]+="[^"]*")*)\s*\/?>/u,
  regExp: /!\[(?<alt>[^[\]]*)\]\((?<src>[^()\s]+)\)$/u,
  replace: (textNode, match) => {
    const { alt = "", attributes, src = "" } = match.groups ?? {};
    if (attributes === undefined) {
      textNode.replace($createImageNode({ altText: alt, src }));
      return;
    }
    const image = parseAttributes(attributes);
    const imageSrc = unescapeAttribute(image.src ?? "");
    if (!imageSrc) {
      return;
    }
    const width = Number.parseInt(image.width ?? "", 10);
    textNode.replace(
      $createImageNode({
        altText: unescapeAttribute(image.alt ?? ""),
        caption: unescapeAttribute(image["data-caption"] ?? ""),
        src: imageSrc,
        width: width > 0 ? width : null,
      })
    );
  },
  trigger: ")",
  type: "text-match",
};

// Like GitHub, `$` must hug the equation, so "$5 and $10" stays text
export const INLINE_EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) =>
    $isEquationNode(node) && node.isInline() ? `$${node.getEquation()}$` : null,
  importRegExp: /(?<!\$)\$(?=[^\s$])(?<equation>[^$\n]*?[^\s$\\])\$(?!\$)/u,
  regExp: /(?<!\$)\$(?=[^\s$])(?<equation>[^$\n]*?[^\s$\\])\$$/u,
  replace: (textNode, match) => {
    const equation = match.groups?.equation ?? "";
    textNode.replace($createEquationNode({ equation, inline: true }));
  },
  trigger: "$",
  type: "text-match",
};

export const DATE: TextMatchTransformer = {
  dependencies: [DateNode],
  export: (node) =>
    $isDateNode(node)
      ? `<time datetime="${node.getDate()}">${formatIsoDate(node.getDate())}</time>`
      : null,
  importRegExp: /<time datetime="(?<date>\d{4}-\d{2}-\d{2})">[^<]*<\/time>/u,
  regExp: /<time datetime="(?<date>\d{4}-\d{2}-\d{2})">[^<]*<\/time>$/u,
  replace: (textNode, match) => {
    const date = match.groups?.date ?? "";
    if (isIsoDate(date)) {
      textNode.replace($createDateNode(date));
    }
  },
  trigger: ">",
  type: "text-match",
};
