/**
 * Typing "/" opens a searchable menu of everything that can be inserted,
 * from headings and lists to tables, drawings, embeds and polls.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuRenderFn,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { FunctionIcon, type Icon, TableIcon } from "@phosphor-icons/react";
import type { LexicalEditor, TextNode } from "lexical";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { BLOCK_OPTIONS } from "../blocks";
import { OPEN_EQUATION_DIALOG_COMMAND } from "../commands";
import { setBlockType } from "../formatting";
import { ALL_INSERT_OPTIONS } from "../inserts";
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "../popovers/table-popover";

const TABLE_SIZE = /^(?<rows>\d{1,2})x(?<columns>\d{1,2})$/u;

class SlashOption extends MenuOption {
  Icon: Icon;
  keywords: string[];
  label: string;
  onSelect: () => void;

  constructor(
    label: string,
    options: { icon: Icon; keywords?: string[]; onSelect: () => void }
  ) {
    super(label);
    this.label = label;
    this.Icon = options.icon;
    this.keywords = options.keywords ?? [];
    this.onSelect = options.onSelect;
  }
}

const getBaseOptions = (editor: LexicalEditor) => [
  ...BLOCK_OPTIONS.map(
    (block) =>
      new SlashOption(block.label, {
        icon: block.icon,
        keywords: block.keywords,
        onSelect: () => setBlockType(editor, block.type, "paragraph"),
      })
  ),
  // Code block is both a block type and an insert, so it's listed once
  ...ALL_INSERT_OPTIONS.filter(
    (option) => !BLOCK_OPTIONS.some((block) => block.label === option.label)
  ).map(
    (option) =>
      new SlashOption(option.label, {
        icon: option.icon,
        keywords: option.keywords,
        onSelect: () => option.run(editor),
      })
  ),
  new SlashOption("Inline equation", {
    icon: FunctionIcon,
    keywords: ["equation", "math", "latex", "inline", "formula"],
    onSelect: () =>
      editor.dispatchCommand(OPEN_EQUATION_DIALOG_COMMAND, { inline: true }),
  }),
];

// "/3x4" offers a 3 by 4 table straight away
const getTableOption = (editor: LexicalEditor, query: string) => {
  const match = query.match(TABLE_SIZE);
  if (!match) {
    return null;
  }
  const rows = Math.min(Number(match[1]), MAX_TABLE_ROWS);
  const columns = Math.min(Number(match[2]), MAX_TABLE_COLUMNS);
  if (rows < 1 || columns < 1) {
    return null;
  }
  return new SlashOption(`${rows} × ${columns} table`, {
    icon: TableIcon,
    onSelect: () =>
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        columns: String(columns),
        includeHeaders: { columns: false, rows: true },
        rows: String(rows),
      }),
  });
};

const renderMenu: MenuRenderFn<SlashOption> = (
  anchorElementRef,
  { options, selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
) => {
  if (!anchorElementRef.current || options.length === 0) {
    return null;
  }
  return createPortal(
    <div className="bg-popover text-popover-foreground ring-foreground/10 mt-1 max-h-72 w-60 overflow-y-auto p-1 shadow-md ring-1">
      <div aria-label="Insert block" role="listbox">
        {options.map((option, index) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: the editor keeps focus and drives the menu with arrow keys and Enter
          <div
            aria-selected={selectedIndex === index}
            className={cn(
              "flex cursor-default items-center gap-2 px-2 py-1.5 text-xs [&_svg]:size-4 [&_svg]:shrink-0",
              selectedIndex === index && "bg-accent text-accent-foreground"
            )}
            id={`notepad-slash-option-${index}`}
            key={option.key}
            onClick={() => {
              setHighlightedIndex(index);
              selectOptionAndCleanUp(option);
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
            ref={(element) => option.setRefElement(element)}
            role="option"
            tabIndex={-1}
          >
            <option.Icon />
            {option.label}
          </div>
        ))}
      </div>
    </div>,
    anchorElementRef.current
  );
};

const SlashMenuPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    allowWhitespace: true,
    minLength: 0,
  });

  const baseOptions = useMemo(() => getBaseOptions(editor), [editor]);

  const options = useMemo(() => {
    if (!query) {
      return baseOptions;
    }
    const search = query.toLowerCase();
    const tableOption = getTableOption(editor, search);
    const matches = baseOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(search) ||
        option.keywords.some((keyword) => keyword.includes(search))
    );
    return tableOption ? [tableOption, ...matches] : matches;
  }, [baseOptions, editor, query]);

  const onSelectOption = useCallback(
    (
      option: SlashOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
      });
      option.onSelect();
      closeMenu();
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      menuRenderFn={renderMenu}
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      options={options}
      triggerFn={checkForTriggerMatch}
    />
  );
};

export { SlashMenuPlugin };
