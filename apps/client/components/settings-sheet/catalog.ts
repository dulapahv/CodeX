/**
 * The editor settings shown in the settings panel. They're read from Monaco's
 * own option registry, so each gets the right control, description and
 * default. Only the Common list and the section rules are written by hand,
 * and an option Monaco adds later lands in Other.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";

export type SettingType = "boolean" | "enum" | "number" | "string";

// Choices are mostly names, but a few mix in true and false
export type EnumValue = boolean | number | string;

export interface SettingDefinition {
  defaultValue: unknown;
  description: string;
  enumDescriptions?: string[];
  integer?: boolean;
  key: string;
  maximum?: number;
  minimum?: number;
  options?: EnumValue[];
  title: string;
  type: SettingType;
}

export interface SettingSection {
  id: string;
  settings: SettingDefinition[];
  title: string;
}

interface PropertySchema {
  anyOf?: PropertySchema[];
  default?: unknown;
  deprecated?: boolean;
  deprecationMessage?: string;
  description?: string;
  enum?: unknown[];
  enumDescriptions?: string[];
  markdownDeprecationMessage?: string;
  markdownDescription?: string;
  markdownEnumDescriptions?: string[];
  maximum?: number;
  minimum?: number;
  type?: string | string[];
}

interface RegisteredOption {
  defaultValue: unknown;
  name: string;
  schema?: Record<string, unknown>;
}

// The app sets these itself, so a reset goes back to them
export const APP_DEFAULTS: Record<string, unknown> = {
  cursorSmoothCaretAnimation: "on",
  fontFamily: "GeistMono, Consolas, 'Courier New', monospace",
};

// Indentation belongs to the document rather than the editor, so Monaco's
// registry doesn't describe it
const DOCUMENT_SETTINGS: SettingDefinition[] = [
  {
    defaultValue: 4,
    description: "How many spaces a tab is shown as and indents by.",
    integer: true,
    key: "tabSize",
    maximum: 16,
    minimum: 1,
    title: "Tab size",
    type: "number",
  },
  {
    defaultValue: true,
    description: "Insert spaces instead of a tab character when pressing Tab.",
    key: "insertSpaces",
    title: "Insert spaces",
    type: "boolean",
  },
  {
    defaultValue: true,
    description:
      "Use the indentation found in the file. When it finds some, it wins over `Tab size` and `Insert spaces`.",
    key: "detectIndentation",
    title: "Detect indentation",
    type: "boolean",
  },
  {
    defaultValue: true,
    description:
      "Remove whitespace the editor added at the end of a line once you move on.",
    key: "trimAutoWhitespace",
    title: "Trim auto whitespace",
    type: "boolean",
  },
];

export const COMMON_SETTINGS = [
  "fontSize",
  "fontFamily",
  "lineHeight",
  "fontLigatures",
  "tabSize",
  "insertSpaces",
  "detectIndentation",
  "wordWrap",
  "lineNumbers",
  "minimap.enabled",
  "renderWhitespace",
  "bracketPairColorization.enabled",
  "guides.indentation",
  "stickyScroll.enabled",
  "cursorStyle",
  "cursorBlinking",
  "cursorSmoothCaretAnimation",
  "smoothScrolling",
  "autoClosingBrackets",
  "formatOnPaste",
  "mouseWheelZoom",
];

// The first matching rule picks a setting's section, shown in this order
const SECTION_RULES = [
  {
    id: "font",
    pattern: /^(?:font|letterSpacing|lineHeight|allowVariable|fullwidth)/u,
    title: "Font",
  },
  { id: "cursor", pattern: /^(?:cursor|overtypeCursor)/u, title: "Cursor" },
  {
    id: "indentation",
    pattern:
      /^(?:tabSize|insertSpaces|detectIndentation|trimAutoWhitespace|autoIndent|formatOn|useTabStops|stickyTabStops|trimWhitespaceOnDelete)/u,
    title: "Indentation and formatting",
  },
  {
    id: "editing",
    pattern:
      /^(?:dragAndDrop|dropIntoEditor|pasteAs|linkedEditing|renameOnType|overtypeOnPaste|comments|wordSeparators|emptySelectionClipboard|copyWithSyntaxHighlighting|selectionClipboard|wordSegmenterLocales|mouseStyle|mouseMiddleClick|contextmenu)/u,
    title: "Editing",
  },
  {
    id: "brackets",
    pattern:
      /^(?:autoClosing|autoSurround|matchBrackets|bracketPairColorization|guides\.bracketPair|guides\.highlightActiveBracketPair)/u,
    title: "Brackets and auto closing",
  },
  {
    id: "suggestions",
    pattern:
      /^(?:suggest|quickSuggestions|acceptSuggestion|snippetSuggestions|tabCompletion|wordBasedSuggestions|inlineSuggest|parameterHints|inlayHints)/u,
    title: "Suggestions",
  },
  {
    id: "wrapping",
    pattern: /^(?:wordWrap|wrapping|wrapOn|wordBreak)/u,
    title: "Word wrap",
  },
  {
    id: "gutter",
    pattern:
      /^(?:lineNumbers|glyphMargin|lineDecorations|folding|showFolding|unfold)/u,
    title: "Line numbers and folding",
  },
  { id: "minimap", pattern: /^minimap\./u, title: "Minimap" },
  {
    id: "scrolling",
    pattern:
      /^(?:scroll|smoothScrolling|mouseWheel|fastScroll|stickyScroll|inertialScroll|revealHorizontal)/u,
    title: "Scrolling",
  },
  {
    id: "selection",
    pattern:
      /^(?:multiCursor|selection|columnSelection|doubleClick|smartSelect|selectOnLineNumbers|roundedSelection|occurrencesHighlight)/u,
    title: "Selection and multiple cursors",
  },
  {
    id: "display",
    pattern:
      /^(?:render(?!RichScreenReader)|guides|rulers|padding|overviewRuler|hideCursorInOverviewRuler|showUnused|showDeprecated|colorDecorator|defaultColorDecorators|unicodeHighlight|unusualLineTerminators|experimental)/u,
    title: "Display",
  },
  { id: "find", pattern: /^find\./u, title: "Find" },
  {
    id: "navigation",
    pattern:
      /^(?:hover|gotoLocation|definitionLink|peekWidget|links|lightbulb|codeLens)/u,
    title: "Hover and navigation",
  },
  {
    id: "accessibility",
    pattern:
      /^(?:accessibility|screenReader|renderRichScreenReader|inlineCompletionsAccessibility|tabFocusMode)/u,
    title: "Accessibility",
  },
];

const OTHER_SECTION = { id: "other", title: "Other" };

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const getSettingValue = (settings: unknown, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (value, part) => (isRecord(value) ? value[part] : undefined),
      settings
    );

export const isSameValue = (a: unknown, b: unknown) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

export const isValidValue = (
  setting: Omit<SettingDefinition, "defaultValue">,
  value: unknown
) => {
  switch (setting.type) {
    case "boolean":
      return typeof value === "boolean";
    case "enum":
      return Boolean(setting.options?.includes(value as EnumValue));
    case "number":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        (!setting.integer || Number.isInteger(value)) &&
        value >= (setting.minimum ?? Number.NEGATIVE_INFINITY) &&
        value <= (setting.maximum ?? Number.POSITIVE_INFINITY)
      );
    default:
      return typeof value === "string";
  }
};

const WORD_BOUNDARY = /(?<=[a-z0-9])(?=[A-Z])/u;
const EDITOR_PREFIX = /^editor\./u;
const SETTING_REFERENCE = /#(?<key>[\w.]+)#/gu;
const MARKDOWN_LINK = /\[(?<text>[^\]]+)\]\([^)]*\)/gu;
const MARKDOWN_BOLD = /\*\*(?<text>[^*]+)\*\*/gu;

const formatWord = (word: string) =>
  word.length > 1 && word === word.toUpperCase() ? word : word.toLowerCase();

// "minimap.renderCharacters" becomes "Minimap: Render characters"
export const formatTitle = (key: string) =>
  key
    .split(".")
    .map((part) => {
      const text = part.split(WORD_BOUNDARY).map(formatWord).join(" ");
      return text.charAt(0).toUpperCase() + text.slice(1);
    })
    .join(": ");

const cleanMarkdown = (text: string) =>
  text
    .replace(SETTING_REFERENCE, (_match, key: string) =>
      key.startsWith("editor.")
        ? `\`${formatTitle(key.replace(EDITOR_PREFIX, ""))}\``
        : `\`${key}\``
    )
    .replace(MARKDOWN_LINK, "$<text>")
    .replace(MARKDOWN_BOLD, "$<text>");

const isPropertySchema = (schema: Record<string, unknown>) =>
  ["type", "enum", "anyOf", "description", "markdownDescription"].some(
    (field) => field in schema
  );

const isDeprecated = (schema: PropertySchema) =>
  Boolean(
    schema.deprecated ||
      schema.deprecationMessage ||
      schema.markdownDeprecationMessage
  );

const getTypes = (schema: PropertySchema): string[] => {
  if (schema.anyOf) {
    return schema.anyOf.flatMap(getTypes);
  }
  if (schema.enum) {
    return ["string"];
  }
  return [schema.type ?? []].flat();
};

type SettingShape = Omit<SettingDefinition, "defaultValue">;

const getShape = (key: string, schema: PropertySchema): SettingShape | null => {
  const base = {
    description: cleanMarkdown(
      schema.markdownDescription ?? schema.description ?? ""
    ),
    key,
    title: formatTitle(key),
  };

  const isEnum = schema.enum?.every((value) =>
    ["boolean", "number", "string"].includes(typeof value)
  );
  if (schema.enum && isEnum) {
    return {
      ...base,
      enumDescriptions: (
        schema.markdownEnumDescriptions ?? schema.enumDescriptions
      )?.map(cleanMarkdown),
      options: schema.enum as EnumValue[],
      type: "enum",
    };
  }

  const types = getTypes(schema);
  if (types.includes("boolean")) {
    return { ...base, type: "boolean" };
  }
  if (types.includes("string")) {
    return { ...base, type: "string" };
  }
  if (types.includes("number") || types.includes("integer")) {
    const numberSchema =
      schema.anyOf?.find((option) =>
        getTypes(option).some((type) => type === "number" || type === "integer")
      ) ?? schema;
    return {
      ...base,
      integer: types.includes("integer"),
      maximum: numberSchema.maximum,
      minimum: numberSchema.minimum,
      type: "number",
    };
  }
  // Lists and maps, such as rulers, need an editor of their own
  return null;
};

const toDefinition = (
  key: string,
  schema: PropertySchema,
  registeredDefault: unknown
): SettingDefinition | null => {
  const shape = isDeprecated(schema) ? null : getShape(key, schema);
  if (!shape) {
    return null;
  }
  // The registry holds the defaults Monaco really uses in the browser, which
  // can differ from its schema, but some are kept there as internal numbers
  const defaultValue =
    [APP_DEFAULTS[key], registeredDefault, schema.default].find(
      (candidate) => candidate !== undefined && isValidValue(shape, candidate)
    ) ?? schema.default;
  return defaultValue === undefined ? null : { ...shape, defaultValue };
};

const definitionsCache = new WeakMap<Monaco, SettingDefinition[]>();

export const getSettingDefinitions = (monaco: Monaco) => {
  const cached = definitionsCache.get(monaco);
  if (cached) {
    return cached;
  }
  const definitions = [...DOCUMENT_SETTINGS];
  const options = Object.values(
    monaco.editor.EditorOptions
  ) as unknown as RegisteredOption[];

  for (const option of options) {
    const { schema } = option;
    if (!schema) {
      continue;
    }
    // Options made of several values describe each one under its own key
    const entries: [string, PropertySchema, unknown][] = isPropertySchema(
      schema
    )
      ? [[option.name, schema as PropertySchema, option.defaultValue]]
      : Object.entries(schema).map(([schemaKey, value]) => {
          const key = schemaKey.replace(EDITOR_PREFIX, "");
          const prefix = `${option.name}.`;
          return [
            key,
            value as PropertySchema,
            key.startsWith(prefix)
              ? getSettingValue(option.defaultValue, key.slice(prefix.length))
              : undefined,
          ];
        });

    for (const [key, propertySchema, registeredDefault] of entries) {
      if (EDITOR_PREFIX.test(key)) {
        continue;
      }
      const definition = toDefinition(key, propertySchema, registeredDefault);
      if (definition) {
        definitions.push(definition);
      }
    }
  }

  definitionsCache.set(monaco, definitions);
  return definitions;
};

export const getSections = (
  definitions: SettingDefinition[]
): SettingSection[] => {
  const byKey = new Map(definitions.map((setting) => [setting.key, setting]));
  const common = COMMON_SETTINGS.flatMap((key) => byKey.get(key) ?? []);

  const sections = [...SECTION_RULES, OTHER_SECTION].map(({ id, title }) => ({
    id,
    settings: [] as SettingDefinition[],
    title,
  }));
  const other = sections.at(-1);

  for (const setting of definitions) {
    const index = SECTION_RULES.findIndex(({ pattern }) =>
      pattern.test(setting.key)
    );
    (index === -1 ? other : sections[index])?.settings.push(setting);
  }

  for (const section of sections) {
    section.settings.sort((a, b) => a.title.localeCompare(b.title));
  }

  return [
    { id: "common", settings: common, title: "Common" },
    ...sections.filter((section) => section.settings.length > 0),
  ];
};
