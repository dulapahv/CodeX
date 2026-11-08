/**
 * The notepad toolbar's dropdown menus for block type, font, text styles,
 * alignment, inserts and code language.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  ArrowFatDownIcon,
  ArrowFatUpIcon,
  CaretCircleRightIcon,
  CaretDownIcon,
  ColumnsIcon,
  EraserIcon,
  HighlighterIcon,
  type Icon,
  NoteBlankIcon,
  PlusIcon,
  ShareNetworkIcon,
  TextAaIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextIndentIcon,
  TextOutdentIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon,
  TranslateIcon,
} from "@phosphor-icons/react";
import {
  $getNodeByKey,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  type LexicalEditor,
  type NodeKey,
  OUTDENT_CONTENT_COMMAND,
  type TextFormatType,
} from "lexical";
import { type ReactNode, type RefObject, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { BLOCK_OPTIONS, getBlockOption } from "../blocks";
import { OPEN_RUBY_DIALOG_COMMAND, TOGGLE_RUBY_COMMAND } from "../commands";
import { type BlockType, clearFormatting, setBlockType } from "../formatting";
import {
  BLOCK_INSERT_OPTIONS,
  CALLOUT_OPTIONS,
  EMBED_OPTIONS,
  type InsertOption,
  LAYOUT_OPTIONS,
  MEDIA_OPTIONS,
  STICKY_OPTIONS,
  STICKY_SWATCHES,
} from "../inserts";
import { CODE_LANGUAGES, PLAIN_TEXT } from "../languages";
import { STICKY_COLORS, type StickyColor } from "../nodes/sticky-node";
import { applyTextStyle, FONT_FAMILIES } from "../text-styles";
import { restoreEditorFocus } from "../utils";
import { openFromToolbar } from "./insert-popover";

const TRIGGER_CLASS = "text-inherit hover:bg-foreground/10";
const LANGUAGE_ITEMS = Object.entries(CODE_LANGUAGES).map(([value, label]) => ({
  label,
  value,
}));

interface MenuTriggerProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  size?: "sm" | "icon-sm";
  triggerRef?: RefObject<HTMLButtonElement | null>;
}

const MenuTrigger = ({
  children,
  className,
  disabled,
  label,
  size = "sm",
  triggerRef,
}: MenuTriggerProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <Button
              aria-label={label}
              className={cn(TRIGGER_CLASS, className)}
              ref={triggerRef}
              size={size}
              variant="ghost"
            >
              {children}
            </Button>
          }
        />
      }
    />
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const useFinalFocus = () => {
  const [editor] = useLexicalComposerContext();
  return () => restoreEditorFocus(editor);
};

interface BlockTypeMenuProps {
  blockType: BlockType;
  disabled: boolean;
}

export const BlockTypeMenu = ({ blockType, disabled }: BlockTypeMenuProps) => {
  const [editor] = useLexicalComposerContext();
  const finalFocus = useFinalFocus();
  const current = getBlockOption(blockType);

  return (
    <DropdownMenu>
      <MenuTrigger
        className="w-34 justify-start"
        disabled={disabled}
        label="Block type"
      >
        <current.icon />
        <span className="truncate">{current.label}</span>
        <CaretDownIcon className="ml-auto size-3" />
      </MenuTrigger>
      <DropdownMenuContent className="w-56" finalFocus={finalFocus}>
        {BLOCK_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            checked={option.type === blockType}
            key={option.type}
            onClick={() => setBlockType(editor, option.type, blockType)}
          >
            <option.icon />
            {option.label}
            {option.markdown && (
              <DropdownMenuShortcut>{option.markdown}</DropdownMenuShortcut>
            )}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface FontFamilyMenuProps {
  disabled: boolean;
  value: string;
}

export const FontFamilyMenu = ({ disabled, value }: FontFamilyMenuProps) => {
  const [editor] = useLexicalComposerContext();
  const finalFocus = useFinalFocus();
  const current = FONT_FAMILIES.find((font) => font.value === value);

  return (
    <DropdownMenu>
      <MenuTrigger
        className="w-28 justify-start"
        disabled={disabled}
        label="Font"
      >
        <span className="truncate" style={{ fontFamily: value || undefined }}>
          {current?.label ?? (value || "Default font")}
        </span>
        <CaretDownIcon className="ml-auto size-3" />
      </MenuTrigger>
      <DropdownMenuContent className="w-48" finalFocus={finalFocus}>
        <DropdownMenuCheckboxItem
          checked={!value}
          onClick={() => applyTextStyle(editor, { "font-family": null })}
        >
          Default font
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {FONT_FAMILIES.map((font) => (
          <DropdownMenuCheckboxItem
            checked={font.value === value}
            key={font.value}
            onClick={() =>
              applyTextStyle(editor, { "font-family": font.value })
            }
            style={{ fontFamily: font.value }}
          >
            {font.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CASE_FORMATS = [
  { format: "uppercase", icon: ArrowFatUpIcon, label: "Uppercase" },
  { format: "lowercase", icon: ArrowFatDownIcon, label: "Lowercase" },
  { format: "capitalize", icon: TextAaIcon, label: "Capitalize" },
] as const satisfies { format: TextFormatType; icon: Icon; label: string }[];

export type TextStyleFormat =
  | (typeof CASE_FORMATS)[number]["format"]
  | "highlight"
  | "subscript"
  | "superscript";

interface TextStyleMenuProps {
  disabled: boolean;
  formats: Record<TextStyleFormat, boolean>;
  hasSelection: boolean;
  isRuby: boolean;
  mod: string;
}

export const TextStyleMenu = ({
  disabled,
  formats,
  hasSelection,
  isRuby,
  mod,
}: TextStyleMenuProps) => {
  const [editor] = useLexicalComposerContext();
  const finalFocus = useFinalFocus();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const format = (name: TextFormatType) =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, name);

  return (
    <DropdownMenu>
      <MenuTrigger
        disabled={disabled}
        label="More text styles"
        triggerRef={triggerRef}
      >
        <TextAaIcon />
        <CaretDownIcon className="size-3" />
      </MenuTrigger>
      <DropdownMenuContent className="w-56" finalFocus={finalFocus}>
        <DropdownMenuGroup>
          {CASE_FORMATS.map(({ format: name, icon: CaseIcon, label }) => (
            <DropdownMenuCheckboxItem
              checked={formats[name]}
              key={name}
              onClick={() => format(name)}
            >
              <CaseIcon />
              {label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={formats.superscript}
            onClick={() => format("superscript")}
          >
            <TextSuperscriptIcon />
            Superscript
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={formats.subscript}
            onClick={() => format("subscript")}
          >
            <TextSubscriptIcon />
            Subscript
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={formats.highlight}
            onClick={() => format("highlight")}
          >
            <HighlighterIcon />
            Highlight
            <DropdownMenuShortcut>{mod}+Shift+H</DropdownMenuShortcut>
          </DropdownMenuCheckboxItem>
          {isRuby ? (
            <DropdownMenuItem
              onClick={() => editor.dispatchCommand(TOGGLE_RUBY_COMMAND, null)}
            >
              <TranslateIcon />
              Remove ruby annotation
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={!hasSelection}
              onClick={() =>
                openFromToolbar(editor, triggerRef.current, () =>
                  editor.dispatchCommand(OPEN_RUBY_DIALOG_COMMAND, undefined)
                )
              }
            >
              <TranslateIcon />
              Ruby annotation…
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => clearFormatting(editor)}>
          <EraserIcon />
          Clear formatting
          <DropdownMenuShortcut>{mod}+\</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ALIGNMENTS: {
  format: Exclude<ElementFormatType, "">;
  icon: Icon;
  label: string;
}[] = [
  { format: "left", icon: TextAlignLeftIcon, label: "Left" },
  { format: "center", icon: TextAlignCenterIcon, label: "Center" },
  { format: "right", icon: TextAlignRightIcon, label: "Right" },
  { format: "justify", icon: TextAlignJustifyIcon, label: "Justify" },
  { format: "start", icon: TextAlignLeftIcon, label: "Start" },
  { format: "end", icon: TextAlignRightIcon, label: "End" },
];

interface AlignMenuProps {
  disabled: boolean;
  format: ElementFormatType;
}

export const AlignMenu = ({ disabled, format }: AlignMenuProps) => {
  const [editor] = useLexicalComposerContext();
  const finalFocus = useFinalFocus();
  const current =
    ALIGNMENTS.find((alignment) => alignment.format === format) ??
    ALIGNMENTS[0];

  return (
    <DropdownMenu>
      <MenuTrigger disabled={disabled} label="Align">
        <current.icon />
        <CaretDownIcon className="size-3" />
      </MenuTrigger>
      <DropdownMenuContent className="w-48" finalFocus={finalFocus}>
        <DropdownMenuGroup>
          {ALIGNMENTS.map((alignment) => (
            <DropdownMenuCheckboxItem
              checked={(format || "left") === alignment.format}
              key={alignment.format}
              onClick={() =>
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment.format)
              }
            >
              <alignment.icon />
              {alignment.label} align
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
          }
        >
          <TextOutdentIcon />
          Outdent
          <DropdownMenuShortcut>Shift+Tab</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          }
        >
          <TextIndentIcon />
          Indent
          <DropdownMenuShortcut>Tab</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const InsertItem = ({
  editor,
  option,
  origin,
}: {
  editor: LexicalEditor;
  option: InsertOption;
  origin: RefObject<HTMLButtonElement | null>;
}) => (
  <DropdownMenuItem
    onClick={() =>
      openFromToolbar(editor, origin.current, () => option.run(editor))
    }
  >
    <option.icon />
    {option.label}
  </DropdownMenuItem>
);

const InsertSubmenu = ({
  children,
  icon: SubmenuIcon,
  label,
}: {
  children: ReactNode;
  icon: Icon;
  label: string;
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>
      <SubmenuIcon />
      {label}
    </DropdownMenuSubTrigger>
    <DropdownMenuSubContent className="w-56">{children}</DropdownMenuSubContent>
  </DropdownMenuSub>
);

export const InsertMenu = ({ disabled }: { disabled: boolean }) => {
  const [editor] = useLexicalComposerContext();
  const finalFocus = useFinalFocus();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownMenu>
      <MenuTrigger disabled={disabled} label="Insert" triggerRef={triggerRef}>
        <PlusIcon />
        Insert
        <CaretDownIcon className="size-3" />
      </MenuTrigger>
      <DropdownMenuContent className="w-56" finalFocus={finalFocus}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Media</DropdownMenuLabel>
          {MEDIA_OPTIONS.map((option) => (
            <InsertItem
              editor={editor}
              key={option.label}
              option={option}
              origin={triggerRef}
            />
          ))}
          <InsertSubmenu icon={ShareNetworkIcon} label="Embed">
            {EMBED_OPTIONS.map((option) => (
              <InsertItem
                editor={editor}
                key={option.label}
                option={option}
                origin={triggerRef}
              />
            ))}
          </InsertSubmenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Blocks</DropdownMenuLabel>
          {BLOCK_INSERT_OPTIONS.map((option) => (
            <InsertItem
              editor={editor}
              key={option.label}
              option={option}
              origin={triggerRef}
            />
          ))}
          <InsertSubmenu icon={ColumnsIcon} label="Columns layout">
            {LAYOUT_OPTIONS.map((option) => (
              <InsertItem
                editor={editor}
                key={option.label}
                option={option}
                origin={triggerRef}
              />
            ))}
          </InsertSubmenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notes</DropdownMenuLabel>
          <InsertSubmenu icon={CaretCircleRightIcon} label="Callout">
            {CALLOUT_OPTIONS.map((option) => (
              <InsertItem
                editor={editor}
                key={option.label}
                option={option}
                origin={triggerRef}
              />
            ))}
          </InsertSubmenu>
          <InsertSubmenu icon={NoteBlankIcon} label="Sticky note">
            {STICKY_OPTIONS.map((option, index) => {
              const color = Object.keys(STICKY_COLORS)[index] as StickyColor;
              return (
                <DropdownMenuItem
                  key={option.label}
                  onClick={() => option.run(editor)}
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-4 shrink-0", STICKY_SWATCHES[color])}
                  />
                  {STICKY_COLORS[color]}
                </DropdownMenuItem>
              );
            })}
          </InsertSubmenu>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface CodeLanguageSelectProps {
  codeKey: NodeKey;
  language: string;
}

export const CodeLanguageSelect = ({
  codeKey,
  language,
}: CodeLanguageSelectProps) => {
  const [editor] = useLexicalComposerContext();

  const setLanguage = (next: string | null) =>
    editor.update(() => {
      const node = $getNodeByKey(codeKey);
      if ($isCodeNode(node)) {
        node.setLanguage(!next || next === PLAIN_TEXT ? undefined : next);
      }
    });

  return (
    <Select items={LANGUAGE_ITEMS} onValueChange={setLanguage} value={language}>
      <SelectTrigger
        aria-label="Code language"
        className="border-foreground/20 h-7 w-36 bg-transparent text-inherit"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className="max-h-72"
        finalFocus={() => restoreEditorFocus(editor)}
      >
        {LANGUAGE_ITEMS.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
