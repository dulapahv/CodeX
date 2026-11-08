/**
 * Markdown import and export for the notepad. Covers GitHub flavoured
 * markdown and the `:::kind` callouts notes saved by the previous notepad
 * contain. Blocks markdown has no syntax for (alignment, columns, sticky
 * notes, collapsible sections, embeds) are written as HTML, equations as
 * `$$`, and polls and drawings as fenced blocks of JSON.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/extension";
import {
  $convertToMarkdownString,
  $generateNodesFromMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  type ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  type MultilineElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  type Transformer,
} from "@lexical/markdown";
import { $isHeadingNode } from "@lexical/rich-text";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import {
  $createParagraphNode,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  type ElementFormatType,
  type ElementNode,
  type LexicalNode,
} from "lexical";

import {
  DATE,
  IMAGE,
  INLINE_EQUATION,
  parseAttributes,
  RUBY,
  STYLED_TEXT,
} from "./markdown-inline";
import {
  $createCalloutNode,
  $isCalloutNode,
  CalloutNode,
  isCalloutKind,
} from "./nodes/callout-node";
import {
  $createCollapsibleContainerNode,
  $createCollapsibleContentNode,
  $createCollapsibleTitleNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
} from "./nodes/collapsible-nodes";
import {
  $createEmbedNode,
  $isEmbedNode,
  EMBED_PROVIDERS,
  EmbedNode,
  getEmbedFromSource,
  getEmbedSource,
} from "./nodes/embed-node";
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from "./nodes/equation-node";
import {
  $createExcalidrawNode,
  $isExcalidrawNode,
  ExcalidrawNode,
} from "./nodes/excalidraw-node";
import {
  $createLayoutContainerNode,
  $createLayoutItemNode,
  $isLayoutContainerNode,
  DEFAULT_COLUMNS,
  LayoutContainerNode,
  LayoutItemNode,
} from "./nodes/layout-nodes";
import {
  $createPollNode,
  $isPollNode,
  PollNode,
  parsePollOptions,
} from "./nodes/poll-node";
import {
  $createStickyNode,
  $isStickyNode,
  isStickyColor,
  StickyNode,
} from "./nodes/sticky-node";

// Nested content is parsed apart from the document so the selection stays put
const $generateBlocks = (markdown: string): LexicalNode[] => {
  const nodes = $generateNodesFromMarkdownString(
    markdown,
    NOTEPAD_TRANSFORMERS
  );
  return nodes.length > 0 ? nodes : [$createParagraphNode()];
};

const $generateInline = (markdown: string): LexicalNode[] => {
  const [first] = $generateNodesFromMarkdownString(
    markdown,
    NOTEPAD_TRANSFORMERS
  );
  return $isElementNode(first) ? first.getChildren() : [];
};

const $exportBlocks = (node: ElementNode) =>
  $convertToMarkdownString(NOTEPAD_TRANSFORMERS, node);

const parseJson = (source: string): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(source);
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => ($isHorizontalRuleNode(node) ? "---" : null),
  regExp: /^(?:---|\*\*\*|___)\s?$/u,
  replace: (parentNode, _children, _match, isImport) => {
    const line = $createHorizontalRuleNode();
    if (isImport || parentNode.getNextSibling() !== null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }
    if (!isImport) {
      line.selectNext();
    }
  },
  triggerOnEnter: true,
  type: "element",
};

const CALLOUT: MultilineElementTransformer = {
  dependencies: [CalloutNode],
  export: (node) =>
    $isCalloutNode(node)
      ? `:::${node.getKind()}\n${$exportBlocks(node)}\n:::`
      : null,
  regExpEnd: { optional: true, regExp: /^[ \t]*:::[ \t]*$/u },
  regExpStart: /^[ \t]*:::(?<kind>[a-z]+)[ \t]*$/u,
  replace: (rootNode, children, [, kind], _endMatch, linesInBetween) => {
    if (!isCalloutKind(kind)) {
      return false;
    }
    const callout = $createCalloutNode(kind);

    if (children) {
      if (!$isParagraphNode(rootNode)) {
        return false;
      }
      const paragraph = $createParagraphNode();
      paragraph.append(...children);
      callout.append(paragraph);
      rootNode.replace(callout);
      paragraph.select(0, 0);
      return;
    }

    callout.append(
      ...$generateBlocks((linesInBetween ?? []).join("\n").trim())
    );
    rootNode.append(callout);
  },
  type: "multiline-element",
};

const DIV_OPEN = /^\s*<div(?<attributes>(?:\s[^>]*)?)>\s*$/u;
const DIV_CLOSE = /^\s*<\/div>\s*$/u;
const DETAILS_OPEN = /^\s*<details(?<open>\s+open)?\s*>\s*$/u;
const DETAILS_CLOSE = /^\s*<\/details>\s*$/u;
const SUMMARY = /^\s*<summary>(?<title>.*)<\/summary>\s*$/u;
const HTML_ALIGNMENTS = new Set(["center", "justify", "left", "right"]);
const ALIGNMENTS = new Set<string>([...HTML_ALIGNMENTS, "end", "start"]);

const isAlignment = (value: string | undefined): value is ElementFormatType =>
  value !== undefined && ALIGNMENTS.has(value);

// The line closing the block opened at `start`, counting nested blocks
const findClosingLine = (
  lines: string[],
  start: number,
  open: RegExp,
  close: RegExp
) => {
  let depth = 0;
  for (let index = start; index < lines.length; index += 1) {
    if (open.test(lines[index])) {
      depth += 1;
    } else if (close.test(lines[index])) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
};

const getAlignmentAttributes = (node: ElementNode) => {
  const format = node.getFormatType();
  const indent = node.getIndent();
  const attributes: string[] = [];
  if (format) {
    attributes.push(
      HTML_ALIGNMENTS.has(format)
        ? `align="${format}"`
        : `data-align="${format}"`
    );
  }
  if (indent > 0) {
    attributes.push(`data-indent="${indent}"`);
  }
  return attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
};

const exportColumns = (node: LayoutContainerNode) => {
  const columns = node
    .getChildren()
    .filter($isElementNode)
    .map((column) => `<div data-column>\n\n${$exportBlocks(column)}\n\n</div>`);
  return `<div data-columns="${node.getTemplateColumns()}">\n${columns.join("\n")}\n</div>`;
};

const $importColumns = (template: string, lines: string[]) => {
  const container = $createLayoutContainerNode(template || DEFAULT_COLUMNS);
  let index = 0;
  while (index < lines.length) {
    const end = DIV_OPEN.test(lines[index])
      ? findClosingLine(lines, index, DIV_OPEN, DIV_CLOSE)
      : -1;
    if (end === -1) {
      index += 1;
      continue;
    }
    const blocks = $generateBlocks(
      lines
        .slice(index + 1, end)
        .join("\n")
        .trim()
    );
    container.append($createLayoutItemNode().append(...blocks));
    index = end + 1;
  }
  if (container.isEmpty()) {
    container.append($createLayoutItemNode().append($createParagraphNode()));
  }
  return container;
};

const $importHtmlBlock = (
  attributes: Record<string, string>,
  lines: string[]
): LexicalNode[] => {
  if ("data-columns" in attributes) {
    return [$importColumns(attributes["data-columns"], lines)];
  }
  const blocks = $generateBlocks(lines.join("\n").trim());
  if ("data-sticky" in attributes) {
    const color = attributes["data-sticky"];
    return [
      $createStickyNode(isStickyColor(color) ? color : "yellow").append(
        ...blocks
      ),
    ];
  }
  const alignment = attributes.align ?? attributes["data-align"];
  const indent = Number.parseInt(attributes["data-indent"] ?? "0", 10) || 0;
  for (const block of blocks) {
    if (!$isElementNode(block)) {
      continue;
    }
    if (isAlignment(alignment)) {
      block.setFormat(alignment);
    }
    if (indent > 0) {
      block.setIndent(indent);
    }
  }
  return blocks;
};

const $exportAlignedBlock = (
  node: LexicalNode,
  traverseChildren: (node: ElementNode) => string
) => {
  const isAlignable = $isParagraphNode(node) || $isHeadingNode(node);
  if (
    !isAlignable ||
    node.isEmpty() ||
    !(node.getFormatType() || node.getIndent())
  ) {
    return null;
  }
  const prefix = $isHeadingNode(node)
    ? `${"#".repeat(Number(node.getTag().slice(1)))} `
    : "";
  return `<div${getAlignmentAttributes(node)}>\n\n${prefix}${traverseChildren(node)}\n\n</div>`;
};

// `<div>` blocks carry alignment, sticky notes and columns
const HTML_BLOCK: MultilineElementTransformer = {
  dependencies: [LayoutContainerNode, LayoutItemNode, StickyNode],
  export: (node, traverseChildren) => {
    if ($isLayoutContainerNode(node)) {
      return exportColumns(node);
    }
    if ($isStickyNode(node)) {
      return `<div data-sticky="${node.getColor()}">\n\n${$exportBlocks(node)}\n\n</div>`;
    }
    return $exportAlignedBlock(node, traverseChildren);
  },
  handleImportAfterStartMatch: ({
    lines,
    rootNode,
    startLineIndex,
    startMatch,
  }) => {
    const end = findClosingLine(lines, startLineIndex, DIV_OPEN, DIV_CLOSE);
    if (end === -1) {
      return null;
    }
    const attributes = parseAttributes(startMatch.groups?.attributes ?? "");
    rootNode.append(
      ...$importHtmlBlock(attributes, lines.slice(startLineIndex + 1, end))
    );
    return [true, end];
  },
  regExpEnd: DIV_CLOSE,
  regExpStart: DIV_OPEN,
  replace: () => false,
  type: "multiline-element",
};

const DETAILS: MultilineElementTransformer = {
  dependencies: [
    CollapsibleContainerNode,
    CollapsibleTitleNode,
    CollapsibleContentNode,
  ],
  export: (node, traverseChildren) => {
    if (!$isCollapsibleContainerNode(node)) {
      return null;
    }
    const [title, content] = node.getChildren();
    const summary = $isElementNode(title) ? traverseChildren(title) : "";
    const body = $isElementNode(content) ? $exportBlocks(content) : "";
    const open = node.getOpen() ? " open" : "";
    return `<details${open}>\n<summary>${summary}</summary>\n\n${body}\n\n</details>`;
  },
  handleImportAfterStartMatch: ({
    lines,
    rootNode,
    startLineIndex,
    startMatch,
  }) => {
    const end = findClosingLine(
      lines,
      startLineIndex,
      DETAILS_OPEN,
      DETAILS_CLOSE
    );
    if (end === -1) {
      return null;
    }
    const title = $createCollapsibleTitleNode();
    let bodyStart = startLineIndex + 1;
    const summary = lines[bodyStart]?.match(SUMMARY);
    if (summary) {
      title.append(...$generateInline(summary.groups?.title ?? ""));
      bodyStart += 1;
    }
    const content = $createCollapsibleContentNode().append(
      ...$generateBlocks(lines.slice(bodyStart, end).join("\n").trim())
    );
    rootNode.append(
      $createCollapsibleContainerNode(Boolean(startMatch.groups?.open)).append(
        title,
        content
      )
    );
    return [true, end];
  },
  regExpEnd: DETAILS_CLOSE,
  regExpStart: DETAILS_OPEN,
  replace: () => false,
  type: "multiline-element",
};

const BLOCK_EQUATION: MultilineElementTransformer = {
  dependencies: [EquationNode],
  export: (node) =>
    $isEquationNode(node) && !node.isInline()
      ? `$$\n${node.getEquation()}\n$$`
      : null,
  regExpEnd: /^\s*\$\$\s*$/u,
  regExpStart: /^\s*\$\$\s*$/u,
  replace: (rootNode, children, _startMatch, _endMatch, linesInBetween) => {
    if (children) {
      return false;
    }
    const equation = (linesInBetween ?? []).join("\n").trim();
    rootNode.append($createEquationNode({ equation, inline: false }));
  },
  type: "multiline-element",
};

// Polls and drawings keep their data as JSON in a fenced block
const DATA_BLOCK: MultilineElementTransformer = {
  dependencies: [PollNode, ExcalidrawNode],
  export: (node) => {
    if ($isPollNode(node)) {
      const poll = { options: node.getOptions(), question: node.getQuestion() };
      return `\`\`\`poll\n${JSON.stringify(poll, null, 2)}\n\`\`\``;
    }
    if ($isExcalidrawNode(node)) {
      const { data, svg } = node.getDrawing();
      return `\`\`\`excalidraw\n${JSON.stringify({ ...parseJson(data), svg })}\n\`\`\``;
    }
    return null;
  },
  regExpEnd: /^\s*```\s*$/u,
  regExpStart: /^\s*```(?<kind>poll|excalidraw)\s*$/u,
  replace: (rootNode, children, [, kind], _endMatch, linesInBetween) => {
    if (children) {
      return false;
    }
    const value = parseJson((linesInBetween ?? []).join("\n"));
    if (kind === "poll") {
      const question = typeof value.question === "string" ? value.question : "";
      rootNode.append(
        $createPollNode(question, parsePollOptions(value.options))
      );
      return;
    }
    const { svg, ...scene } = value;
    rootNode.append(
      $createExcalidrawNode({
        data: JSON.stringify(scene),
        svg: typeof svg === "string" ? svg : "",
      })
    );
  },
  type: "multiline-element",
};

const IFRAME = /^\s*<iframe\s[^>]*src="(?<src>[^"]+)"[^>]*>\s*<\/iframe>\s*$/u;

const EMBED: ElementTransformer = {
  dependencies: [EmbedNode],
  export: (node) => {
    if (!$isEmbedNode(node)) {
      return null;
    }
    const provider = node.getProvider();
    const source = getEmbedSource(provider, node.getUrl());
    if (!source) {
      return "";
    }
    return `<iframe src="${source}" title="${EMBED_PROVIDERS[provider]}"></iframe>`;
  },
  regExp: IFRAME,
  replace: (parentNode, _children, match) => {
    const embed = getEmbedFromSource(match[1] ?? "");
    if (!embed) {
      return false;
    }
    parentNode.replace($createEmbedNode(embed.provider, embed.url));
  },
  type: "element",
};

const TABLE_ROW_REG_EXP = /^\|(?<cells>.+)\|\s?$/u;
// Lexical's own check also takes a row of empty cells for a divider
const TABLE_DIVIDER = /^\|(?:\s*:?-+:?\s*\|)+\s*$/u;
const UNESCAPED_PIPE = /(?<!\\)\|/u;
const ESCAPED_PIPE = /\\\|/gu;
const PIPE = /\|/gu;
const LINE_BREAK = /\n/gu;
const ESCAPED_LINE_BREAK = /\\n/gu;

const $createTableCell = (markdown: string): TableCellNode =>
  $createTableCellNode(TableCellHeaderStates.NO_STATUS).append(
    ...$generateBlocks(
      markdown.replace(ESCAPED_LINE_BREAK, "\n").replace(ESCAPED_PIPE, "|")
    )
  );

const mapToTableCells = (line: string): TableCellNode[] | null => {
  const match = line.match(TABLE_ROW_REG_EXP);
  if (!match?.[1]) {
    return null;
  }
  return match[1]
    .split(UNESCAPED_PIPE)
    .map((text) => $createTableCell(text.trim()));
};

const getTableColumnCount = (table: TableNode) => {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
};

const exportTableRow = (row: TableRowNode) =>
  row
    .getChildren()
    .filter($isTableCellNode)
    .map((cell) =>
      $exportBlocks(cell).replace(LINE_BREAK, "\\n").replace(PIPE, "\\|").trim()
    );

const $markLastRowAsHeader = (dividerLine: ElementNode) => {
  const table = dividerLine.getPreviousSibling();
  const lastRow = $isTableNode(table) ? table.getLastChild() : null;
  if (!$isTableRowNode(lastRow)) {
    return;
  }
  for (const cell of lastRow.getChildren()) {
    if ($isTableCellNode(cell)) {
      cell.setHeaderStyles(
        TableCellHeaderStates.ROW,
        TableCellHeaderStates.ROW
      );
    }
  }
  dividerLine.remove();
};

// Rows typed as separate lines above this one join the same table
const $takePreviousRows = (line: ElementNode, cells: TableCellNode[]) => {
  const rows = [cells];
  let maxCells = cells.length;
  let sibling = line.getPreviousSibling();

  while ($isParagraphNode(sibling) && sibling.getChildrenSize() === 1) {
    const firstChild = sibling.getFirstChild();
    const siblingCells = $isTextNode(firstChild)
      ? mapToTableCells(firstChild.getTextContent())
      : null;
    if (!siblingCells) {
      break;
    }
    maxCells = Math.max(maxCells, siblingCells.length);
    rows.unshift(siblingCells);
    const previousSibling = sibling.getPreviousSibling();
    sibling.remove();
    sibling = previousSibling;
  }
  return { maxCells, rows };
};

const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  // Markdown tables always have a header row, so the first row becomes one
  export: (node: LexicalNode) => {
    if (!$isTableNode(node)) {
      return null;
    }
    const rows = node.getChildren().filter($isTableRowNode);
    const output: string[] = [];
    for (const [index, row] of rows.entries()) {
      const cells = exportTableRow(row);
      output.push(`| ${cells.join(" | ")} |`);
      if (index === 0) {
        output.push(`| ${cells.map(() => "---").join(" | ")} |`);
      }
    }
    return output.join("\n");
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _children, match, isImport) => {
    if (TABLE_DIVIDER.test(match[0])) {
      $markLastRowAsHeader(parentNode);
      return;
    }
    const cells = mapToTableCells(match[0]);
    if (!cells) {
      return;
    }

    const { maxCells, rows } = $takePreviousRows(parentNode, cells);
    const table = $createTableNode();
    for (const rowCells of rows) {
      const row = $createTableRowNode();
      table.append(row);
      for (let index = 0; index < maxCells; index += 1) {
        row.append(rowCells[index] ?? $createTableCell(""));
      }
    }

    const previousSibling = parentNode.getPreviousSibling();
    const isContinuation =
      $isTableNode(previousSibling) &&
      getTableColumnCount(previousSibling) === maxCells;
    if (isContinuation) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }
    // Moving the caret during an import would point it at nodes that the
    // next lines merge away
    if (!isImport) {
      (isContinuation ? previousSibling : table).selectEnd();
    }
  },
  type: "element",
};

export const NOTEPAD_TRANSFORMERS: Transformer[] = [
  HTML_BLOCK,
  DETAILS,
  BLOCK_EQUATION,
  DATA_BLOCK,
  CALLOUT,
  TABLE,
  HR,
  EMBED,
  RUBY,
  IMAGE,
  DATE,
  INLINE_EQUATION,
  STYLED_TEXT,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];
