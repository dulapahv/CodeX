/**
 * Option values for Monaco editor configuration settings.
 * Provides type-safe enum values for editor configuration like:
 * - Auto-closing behavior
 * - Cursor animations
 * - Line highlighting
 * - Multi-cursor options
 *
 * From: https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export const SELECT_OPTIONS: Record<string, string[]> = {
  acceptSuggestionOnEnter: ['on', 'off', 'smart'],
  autoClosingBrackets: [
    'always',
    'languageDefined',
    'beforeWhitespace',
    'never',
  ],
  autoClosingComments: [
    'always',
    'languageDefined',
    'beforeWhitespace',
    'never',
  ],
  autoClosingDelete: ['auto', 'always', 'never'],
  autoClosingOvertype: ['auto', 'always', 'never'],
  autoClosingQuotes: ['always', 'languageDefined', 'beforeWhitespace', 'never'],
  autoSurround: ['languageDefined', 'never', 'quotes', 'brackets'],
  colorDecoratorActivatedOn: ['hover', 'clickAndHover', 'click'],
  cursorSmoothCaretAnimation: ['on', 'off', 'explicit'],
  cursorSurroundingLinesStyle: ['default', 'all'],
  experimentalWhitespaceRendering: ['off', 'svg', 'font'],
  foldingStrategy: ['auto', 'indentation'],
  matchBrackets: ['always', 'never', 'near'],
  mouseStyle: ['default', 'text', 'copy'],
  multiCursorModifier: ['altKey', 'metaKey', 'ctrlKey'],
  multiCursorPaste: ['spread', 'full'],
  occurrencesHighlight: ['off', 'singleFile', 'multiFile'],
  peekWidgetDefaultFocus: ['tree', 'editor'],
  renderFinalNewline: ['on', 'off', 'dimmed'],
  renderLineHighlight: ['all', 'line', 'none', 'gutter'],
  renderValidationDecorations: ['on', 'off', 'editable'],
  renderWhitespace: ['all', 'none', 'boundary', 'selection', 'trailing'],
  showFoldingControls: ['always', 'never', 'mouseover'],
  snippetSuggestions: ['none', 'top', 'bottom', 'inline'],
  suggestSelection: ['first', 'recentlyUsed', 'recentlyUsedByPrefix'],
  tabCompletion: ['on', 'off', 'onlySnippets'],
  unusualLineTerminators: ['off', 'auto', 'prompt'],
  wordBreak: ['normal', 'keepAll'],
  wordWrap: ['wordWrapColumn', 'on', 'off', 'bounded'],
  wordWrapOverride1: ['on', 'off', 'inherit'],
  wordWrapOverride2: ['on', 'off', 'inherit'],
  wrappingStrategy: ['simple', 'advanced'],
};
