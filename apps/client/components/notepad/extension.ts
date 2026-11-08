/**
 * The notepad editor with rich text, lists, links, tables, highlighted code,
 * columns, collapsible sections, callouts, sticky notes, equations, polls,
 * embeds, drawings and markdown shortcuts. History comes from the Yjs
 * binding instead of Lexical's, so each user undoes only their own edits.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isCodeNode } from "@lexical/code";
import { CodePrismExtension, PrismTokenizer } from "@lexical/code-prism";
import {
  $defaultShouldInsertAfter,
  ClickAfterLastBlockExtension,
  HorizontalRuleExtension,
  TabIndentationExtension,
} from "@lexical/extension";
import {
  $isLinkNode,
  AutoLinkExtension,
  autoLinkEmailMatcher,
  autoLinkUrlMatcher,
  LinkExtension,
} from "@lexical/link";
import { CheckListExtension, ListExtension } from "@lexical/list";
import { registerMarkdownShortcuts } from "@lexical/markdown";
import { RichTextExtension } from "@lexical/rich-text";
import { TableExtension } from "@lexical/table";
import { $findMatchingParent } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  configExtension,
  defineExtension,
  type LexicalNode,
} from "lexical";

import {
  CalloutExtension,
  CollapsibleExtension,
  DateExtension,
  DecoratorSelectionExtension,
  EmbedExtension,
  EquationExtension,
  ExcalidrawExtension,
  ImageExtension,
  LayoutExtension,
  PollExtension,
  RubyExtension,
  StickyExtension,
} from "./block-extensions";
import { NOTEPAD_TRANSFORMERS } from "./markdown";
import { notepadTheme } from "./theme";
import { validateUrl } from "./utils";

// A plain click places the caret in a link, Ctrl or Cmd click opens it
const OpenLinkExtension = defineExtension({
  dependencies: [LinkExtension],
  name: "codex/notepad/open-link",
  register: (editor) =>
    editor.registerCommand(
      CLICK_COMMAND,
      (event) => {
        if (!(event.ctrlKey || event.metaKey)) {
          return false;
        }
        const node =
          event.target instanceof Node
            ? $getNearestNodeFromDOMNode(event.target)
            : null;
        const link = node ? $findMatchingParent(node, $isLinkNode) : null;
        if (!link) {
          return false;
        }
        event.preventDefault();
        window.open(link.sanitizeUrl(link.getURL()), "_blank", "noopener");
        return true;
      },
      COMMAND_PRIORITY_LOW
    ),
});

const MarkdownShortcutsExtension = defineExtension({
  name: "codex/notepad/markdown-shortcuts",
  register: (editor) => registerMarkdownShortcuts(editor, NOTEPAD_TRANSFORMERS),
});

// Unlabelled code blocks stay unlabelled so markdown round trips keep ```
const tokenizer = { ...PrismTokenizer, defaultLanguage: null };

export const NotepadExtension = defineExtension({
  $initialEditorState: null,
  dependencies: [
    RichTextExtension,
    configExtension(ListExtension, { shouldPreserveNumbering: false }),
    CheckListExtension,
    configExtension(LinkExtension, { validateUrl }),
    configExtension(AutoLinkExtension, {
      matchers: [autoLinkUrlMatcher, autoLinkEmailMatcher],
    }),
    OpenLinkExtension,
    configExtension(TableExtension, {
      hasCellBackgroundColor: false,
      hasCellMerge: false,
      hasHorizontalScroll: true,
    }),
    HorizontalRuleExtension,
    configExtension(CodePrismExtension, { tokenizer }),
    configExtension(TabIndentationExtension, { maxIndent: 7 }),
    configExtension(ClickAfterLastBlockExtension, {
      $shouldInsertAfter: (node: LexicalNode) =>
        $defaultShouldInsertAfter(node) || $isCodeNode(node),
    }),
    DecoratorSelectionExtension,
    ImageExtension,
    CalloutExtension,
    StickyExtension,
    LayoutExtension,
    CollapsibleExtension,
    EquationExtension,
    DateExtension,
    PollExtension,
    EmbedExtension,
    ExcalidrawExtension,
    RubyExtension,
    MarkdownShortcutsExtension,
  ],
  name: "codex/notepad",
  namespace: "Notepad",
  theme: notepadTheme,
});
