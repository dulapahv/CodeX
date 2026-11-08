/**
 * Insert commands and editing behaviour for the notepad's richer blocks,
 * from columns and collapsible sections to equations, polls and drawings.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isHorizontalRuleNode } from "@lexical/extension";
import {
  $insertNodeToNearestRoot,
  $onEscapeDown,
  $onEscapeUp,
  $wrapNodeInElement,
  mergeRegister,
} from "@lexical/utils";
import {
  $createNodeSelection,
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $insertNodes,
  $isDecoratorNode,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  defineExtension,
  type ElementNode,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

import {
  INSERT_CALLOUT_COMMAND,
  INSERT_COLLAPSIBLE_COMMAND,
  INSERT_DATE_COMMAND,
  INSERT_EMBED_COMMAND,
  INSERT_EQUATION_COMMAND,
  INSERT_EXCALIDRAW_COMMAND,
  INSERT_IMAGE_COMMAND,
  INSERT_LAYOUT_COMMAND,
  INSERT_POLL_COMMAND,
  INSERT_STICKY_COMMAND,
  TOGGLE_RUBY_COMMAND,
} from "./commands";
import {
  $createCalloutNode,
  $isCalloutNode,
  type CalloutKind,
  CalloutNode,
} from "./nodes/callout-node";
import {
  $createCollapsibleContainerNode,
  $createCollapsibleContentNode,
  $createCollapsibleTitleNode,
  $isCollapsibleContainerNode,
  $isCollapsibleContentNode,
  $isCollapsibleTitleNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
} from "./nodes/collapsible-nodes";
import { $createDateNode, DateNode } from "./nodes/date-node";
import { $createEmbedNode, EmbedNode } from "./nodes/embed-node";
import { $createEquationNode, EquationNode } from "./nodes/equation-node";
import { $createExcalidrawNode, ExcalidrawNode } from "./nodes/excalidraw-node";
import { $createImageNode, ImageNode } from "./nodes/image-node";
import {
  $createLayoutContainerNode,
  $createLayoutItemNode,
  $isLayoutContainerNode,
  $isLayoutItemNode,
  LayoutContainerNode,
  LayoutItemNode,
} from "./nodes/layout-nodes";
import { $createPollNode, createPollOption, PollNode } from "./nodes/poll-node";
import { $toggleRuby, RubyNode } from "./nodes/ruby-node";
import {
  $createStickyNode,
  $isStickyNode,
  StickyNode,
} from "./nodes/sticky-node";

const INTERACTIVE_TARGETS = "a, button, input, textarea, select, iframe";
const WHITESPACE = /\s+/u;

// Puts a block at the caret, in place of an empty line when there is one
export const $insertBlockNode = <T extends LexicalNode>(node: T): T => {
  const selection = $getSelection();
  const block = $isRangeSelection(selection)
    ? selection.anchor.getNode().getTopLevelElement()
    : null;
  if ($isParagraphNode(block) && block.isEmpty()) {
    block.replace(node);
  } else {
    $insertNodeToNearestRoot(node);
  }
  return node;
};

// A block that isn't text gets a line after it to keep typing on
const $insertBlockAndContinue = (node: LexicalNode) => {
  $insertBlockNode(node);
  const next = node.getNextSibling();
  if ($isElementNode(next)) {
    next.selectStart();
  } else {
    const paragraph = $createParagraphNode();
    node.insertAfter(paragraph);
    paragraph.select();
  }
};

const registerInsert = <T>(
  editor: LexicalEditor,
  command: LexicalCommand<T>,
  $insert: (payload: T) => void
) =>
  editor.registerCommand(
    command,
    (payload) => {
      $insert(payload);
      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );

// Arrow keys at the edge of a container add a line outside it to move to
const registerContainerEscape = (
  editor: LexicalEditor,
  $isContainer: (node?: LexicalNode | null) => node is ElementNode
) =>
  mergeRegister(
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => $onEscapeDown($isContainer, event),
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => $onEscapeDown($isContainer, event),
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => $onEscapeUp($isContainer, event),
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      (event) => $onEscapeUp($isContainer, event),
      COMMAND_PRIORITY_LOW
    )
  );

// Unwraps a container whose structure was broken by an edit or a merge
const $unwrap = (node: ElementNode) => {
  for (const child of node.getChildren()) {
    node.insertBefore(child);
  }
  node.remove();
};

// Clicking an image, drawing or embed selects it, so it can be deleted
export const DecoratorSelectionExtension = defineExtension({
  name: "codex/notepad/decorator-selection",
  register: (editor) =>
    editor.registerCommand(
      CLICK_COMMAND,
      (event) => {
        const { target } = event;
        if (!(target instanceof Element)) {
          return false;
        }
        const control = target.closest(INTERACTIVE_TARGETS);
        if (control && !control.hasAttribute("data-selectable")) {
          return false;
        }
        const node = $getNearestNodeFromDOMNode(target);
        if (!$isDecoratorNode(node) || $isHorizontalRuleNode(node)) {
          return false;
        }
        const selection = $createNodeSelection();
        selection.add(node.getKey());
        $setSelection(selection);
        return true;
      },
      COMMAND_PRIORITY_LOW
    ),
});

export const ImageExtension = defineExtension({
  name: "codex/notepad/image",
  nodes: () => [ImageNode],
  register: (editor) =>
    registerInsert(editor, INSERT_IMAGE_COMMAND, (payload) => {
      const image = $createImageNode(payload);
      $insertNodes([image]);
      if ($isRootOrShadowRoot(image.getParentOrThrow())) {
        $wrapNodeInElement(image, $createParagraphNode).selectEnd();
      }
    }),
});

export const LayoutExtension = defineExtension({
  name: "codex/notepad/layout",
  nodes: () => [LayoutContainerNode, LayoutItemNode],
  register: (editor) =>
    mergeRegister(
      registerInsert(editor, INSERT_LAYOUT_COMMAND, (template) => {
        const container = $createLayoutContainerNode(template);
        for (const _column of template.trim().split(WHITESPACE)) {
          container.append(
            $createLayoutItemNode().append($createParagraphNode())
          );
        }
        $insertBlockNode(container);
        container.selectStart();
      }),
      registerContainerEscape(editor, $isLayoutContainerNode),
      editor.registerNodeTransform(LayoutItemNode, (node) => {
        if (!$isLayoutContainerNode(node.getParent())) {
          $unwrap(node);
        } else if (node.isEmpty()) {
          node.append($createParagraphNode());
        }
      }),
      editor.registerNodeTransform(LayoutContainerNode, (node) => {
        if (!node.getChildren().every($isLayoutItemNode)) {
          $unwrap(node);
        }
      })
    ),
});

export const CollapsibleExtension = defineExtension({
  name: "codex/notepad/collapsible",
  nodes: () => [
    CollapsibleContainerNode,
    CollapsibleTitleNode,
    CollapsibleContentNode,
  ],
  register: (editor) =>
    mergeRegister(
      registerInsert(editor, INSERT_COLLAPSIBLE_COMMAND, () => {
        const title = $createCollapsibleTitleNode();
        $insertBlockNode(
          $createCollapsibleContainerNode().append(
            title,
            $createCollapsibleContentNode().append($createParagraphNode())
          )
        );
        title.select();
      }),
      registerContainerEscape(editor, $isCollapsibleContainerNode),
      editor.registerNodeTransform(CollapsibleContentNode, (node) => {
        if (!$isCollapsibleContainerNode(node.getParent())) {
          $unwrap(node);
        } else if (node.isEmpty()) {
          node.append($createParagraphNode());
        }
      }),
      editor.registerNodeTransform(CollapsibleTitleNode, (node) => {
        if (!$isCollapsibleContainerNode(node.getParent())) {
          node.replace($createParagraphNode().append(...node.getChildren()));
        }
      }),
      editor.registerNodeTransform(CollapsibleContainerNode, (node) => {
        const [title, content, ...rest] = node.getChildren();
        if (
          rest.length > 0 ||
          !$isCollapsibleTitleNode(title) ||
          !$isCollapsibleContentNode(content)
        ) {
          $unwrap(node);
        }
      })
    ),
});

export const StickyExtension = defineExtension({
  name: "codex/notepad/sticky",
  nodes: () => [StickyNode],
  register: (editor) =>
    mergeRegister(
      registerInsert(editor, INSERT_STICKY_COMMAND, (color) => {
        const paragraph = $createParagraphNode();
        $insertBlockNode($createStickyNode(color).append(paragraph));
        paragraph.select();
      }),
      registerContainerEscape(editor, $isStickyNode)
    ),
});

export const EquationExtension = defineExtension({
  name: "codex/notepad/equation",
  nodes: () => [EquationNode],
  register: (editor) =>
    registerInsert(editor, INSERT_EQUATION_COMMAND, (payload) => {
      const equation = $createEquationNode(payload);
      if (payload.inline) {
        $insertNodes([equation]);
        if ($isRootOrShadowRoot(equation.getParentOrThrow())) {
          $wrapNodeInElement(equation, $createParagraphNode).selectEnd();
        }
      } else {
        $insertBlockAndContinue(equation);
      }
    }),
});

export const DateExtension = defineExtension({
  name: "codex/notepad/date",
  nodes: () => [DateNode],
  register: (editor) =>
    registerInsert(editor, INSERT_DATE_COMMAND, (date) => {
      const node = $createDateNode(date);
      $insertNodes([node]);
      if ($isRootOrShadowRoot(node.getParentOrThrow())) {
        $wrapNodeInElement(node, $createParagraphNode);
      }
      node.selectNext();
    }),
});

export const PollExtension = defineExtension({
  name: "codex/notepad/poll",
  nodes: () => [PollNode],
  register: (editor) =>
    registerInsert(editor, INSERT_POLL_COMMAND, ({ options, question }) => {
      $insertBlockAndContinue(
        $createPollNode(
          question,
          options.map((text) => createPollOption(text))
        )
      );
    }),
});

export const EmbedExtension = defineExtension({
  name: "codex/notepad/embed",
  nodes: () => [EmbedNode],
  register: (editor) =>
    registerInsert(editor, INSERT_EMBED_COMMAND, ({ provider, url }) => {
      $insertBlockAndContinue($createEmbedNode(provider, url));
    }),
});

export const ExcalidrawExtension = defineExtension({
  name: "codex/notepad/excalidraw",
  nodes: () => [ExcalidrawNode],
  register: (editor) =>
    registerInsert(editor, INSERT_EXCALIDRAW_COMMAND, (drawing) => {
      $insertBlockAndContinue($createExcalidrawNode(drawing));
    }),
});

export const RubyExtension = defineExtension({
  name: "codex/notepad/ruby",
  nodes: () => [RubyNode],
  register: (editor) =>
    registerInsert(editor, TOGGLE_RUBY_COMMAND, $toggleRuby),
});

// Enter on the empty last line of a note or collapsible body leaves it, and
// Backspace at the very start of a note unwraps it
const $isNoteContainer = (
  node?: LexicalNode | null
): node is CalloutNode | StickyNode =>
  $isCalloutNode(node) || $isStickyNode(node);

const $getContainedBlock = () => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) && selection.isCollapsed())) {
    return null;
  }
  const anchorNode = selection.anchor.getNode();
  const block = anchorNode.getTopLevelElement();
  const container = block?.getParent();
  if (!(block && container)) {
    return null;
  }
  return { anchorNode, block, container, offset: selection.anchor.offset };
};

const $getExitTarget = (container: ElementNode) => {
  if ($isNoteContainer(container)) {
    return container;
  }
  return $isCollapsibleContentNode(container) ? container.getParent() : null;
};

const isAtBlockStart = (
  block: ElementNode,
  anchorNode: LexicalNode,
  offset: number
) =>
  offset === 0 &&
  (anchorNode === block || block.getFirstDescendant() === anchorNode);

// The block holding the caret, or its callout so callouts never nest
const $insertCallout = (kind: CalloutKind) => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }
  const block = selection.anchor.getNode().getTopLevelElement();
  const parent = block?.getParent();
  const target = $isCalloutNode(parent) ? parent : block;
  const paragraph = $createParagraphNode();
  const callout = $createCalloutNode(kind).append(paragraph);
  if ($isParagraphNode(target) && target.isEmpty()) {
    target.replace(callout);
  } else if (target) {
    target.insertAfter(callout);
  } else {
    $insertNodeToNearestRoot(callout);
  }
  paragraph.select();
};

export const CalloutExtension = defineExtension({
  name: "codex/notepad/callout",
  nodes: () => [CalloutNode],
  register: (editor) =>
    mergeRegister(
      registerInsert(editor, INSERT_CALLOUT_COMMAND, $insertCallout),
      registerContainerEscape(editor, $isCalloutNode),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const target = $getContainedBlock();
          const exitTarget = target && $getExitTarget(target.container);
          if (
            !(target && exitTarget) ||
            event?.shiftKey ||
            !$isParagraphNode(target.block) ||
            !target.block.isEmpty() ||
            target.container.getLastChild() !== target.block ||
            target.container.getChildrenSize() < 2
          ) {
            return false;
          }
          event?.preventDefault();
          exitTarget.insertAfter(target.block);
          target.block.select();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const target = $getContainedBlock();
          if (
            !(target && $isNoteContainer(target.container)) ||
            target.container.getFirstChild() !== target.block ||
            !isAtBlockStart(target.block, target.anchorNode, target.offset)
          ) {
            return false;
          }
          event.preventDefault();
          $unwrap(target.container);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    ),
});
