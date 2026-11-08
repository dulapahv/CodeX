/**
 * Monaco editor service functions for editor lifecycle and configuration.
 * Features:
 * - Theme management
 * - Editor initialization
 * - Event handling
 * - Socket integration
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Cursor } from "@codex/types/operation";
import type { Presence } from "@codex/types/realtime";
import type { Scroll } from "@codex/types/scroll";
import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import themeList from "monaco-themes/themes/themelist.json";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { loadEditorOptions } from "@/components/settings-sheet/storage";
import type { StatusBarCursorPosition } from "@/components/status-bar";
import { storage } from "@/lib/services/storage";

const SCROLL_EMIT_INTERVAL = 50;

// Piston runs JavaScript and TypeScript on Node, so these exist at runtime
const NODE_GLOBALS = `declare var process: any;
declare var Buffer: any;
declare var __dirname: string;
declare var __filename: string;
declare var module: any;
declare var exports: any;
declare function require(id: string): any;
`;

// ts.ModuleDetectionKind.Force, which Monaco doesn't export
const MODULE_DETECTION_FORCE = 3;

// The editor holds a single file, so imports and their types never resolve
const SINGLE_FILE_DIAGNOSTICS = [
  2307, // Cannot find module or its type declarations
  2792, // Cannot find module
  7016, // Could not find a declaration file for module
  80_001, // File is a CommonJS module; it may be converted to an ES module
  80_005, // 'require' call may be converted to an import
];

// Without annotations these are type opinions, not errors JavaScript hits
const UNTYPED_JAVASCRIPT_DIAGNOSTICS = [
  2322, // Type is not assignable to type
  2339, // Property does not exist on type
  2345, // Argument is not assignable to parameter
  2362, // Left-hand side of an arithmetic operation must be a number
  2363, // Right-hand side of an arithmetic operation must be a number
];

/**
 * Tune diagnostics for a lone file: hide errors that only come from having no
 * project around it, keep the ones the code would really fail on.
 * @param monaco Monaco instance.
 */
const configureDiagnostics = (monaco: Monaco): void => {
  const { css, typescript } = monaco;
  const scriptLanguages = [
    {
      checkJs: false,
      defaults: typescript.typescriptDefaults,
      ignored: SINGLE_FILE_DIAGNOSTICS,
    },
    {
      // Catches undeclared names and typos before the code is run
      checkJs: true,
      defaults: typescript.javascriptDefaults,
      ignored: [...SINGLE_FILE_DIAGNOSTICS, ...UNTYPED_JAVASCRIPT_DIAGNOSTICS],
    },
  ];

  for (const { checkJs, defaults, ignored } of scriptLanguages) {
    defaults.setCompilerOptions({
      ...defaults.getCompilerOptions(),
      checkJs,
      module: typescript.ModuleKind.ESNext,
      // As a module the file allows top-level await, and names like `name`
      // stop clashing with DOM globals
      moduleDetection: MODULE_DETECTION_FORCE,
    });
    defaults.addExtraLib(NODE_GLOBALS, "ts:codex/node-globals.d.ts");
    defaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: ignored,
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  }

  // Live Preview loads Tailwind, whose directives such as @apply aren't CSS.
  // The language service supports this lint rule; Monaco's types omit it.
  for (const defaults of [
    css.cssDefaults,
    css.scssDefaults,
    css.lessDefaults,
  ]) {
    defaults.setOptions({
      ...defaults.options,
      lint: {
        ...defaults.options.lint,
        unknownAtRules: "ignore",
      } as typeof defaults.options.lint,
    });
  }
};

/**
 * Handle the Monaco editor before mounting.
 * @param monaco Monaco instance.
 */
export const handleBeforeMount = (monaco: Monaco): void => {
  for (const [key, value] of Object.entries(themeList)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const themeData = require(`monaco-themes/themes/${value}.json`);
    monaco.editor.defineTheme(key, themeData);
  }
  configureDiagnostics(monaco);
};

/**
 * Handle the Monaco editor after mounting.
 * @param editor Monaco editor instance
 * @param monaco Monaco instance
 * @param disposablesRef Collected Monaco disposables to clean up on unmount
 * @param setCursorPosition Status bar cursor position setter
 * @param publish Shares this user's cursor and scroll with the room
 *
 * @remarks
 * Initial content is not set here. The CRDT binding owns the model's text.
 */
export const handleOnMount = (
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: Monaco,
  disposablesRef: RefObject<monacoEditor.IDisposable[]>,
  setCursorPosition: Dispatch<SetStateAction<StatusBarCursorPosition>>,
  publish: (patch: Partial<Presence>) => void
): void => {
  editor.focus();

  editor.updateOptions(loadEditorOptions(monaco, editor));

  editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF);

  const cursorSelectionDisposable = editor.onDidChangeCursorSelection((e) => {
    setCursorPosition({
      column: e.selection.positionColumn,
      line: e.selection.positionLineNumber,
      selected: editor.getModel()?.getValueLengthInRange(e.selection) || 0,
    });

    // Remote edits shift this cursor too; peers already track that through
    // their own decorations, so echoing it back would only multiply traffic.
    if (e.reason === monaco.editor.CursorChangeReason.RecoverFromMarkers) {
      return;
    }

    // If the selection is empty, send only the cursor position
    if (
      e.selection.startLineNumber === e.selection.endLineNumber &&
      e.selection.startColumn === e.selection.endColumn
    ) {
      publish({
        cursor: [
          e.selection.positionLineNumber,
          e.selection.positionColumn,
        ] as Cursor,
      });
    } else {
      publish({
        cursor: [
          e.selection.positionLineNumber,
          e.selection.positionColumn,
          e.selection.startLineNumber,
          e.selection.startColumn,
          e.selection.endLineNumber,
          e.selection.endColumn,
        ] as Cursor,
      });
    }
  });

  let pendingScroll: Scroll | null = null;
  let scrollTimer: ReturnType<typeof setTimeout> | undefined;

  const scrollDisposable = editor.onDidScrollChange((e) => {
    if (!(e.scrollTopChanged || e.scrollLeftChanged)) {
      return;
    }
    if (storage.getFollowUserId()) {
      return; // If following another user, do not emit scroll events
    }

    pendingScroll = [e.scrollLeft, e.scrollTop];
    scrollTimer ??= setTimeout(() => {
      scrollTimer = undefined;
      if (pendingScroll) {
        publish({ scroll: pendingScroll });
      }
    }, SCROLL_EMIT_INTERVAL);
  });

  disposablesRef.current.push(cursorSelectionDisposable);
  disposablesRef.current.push(scrollDisposable);
  disposablesRef.current.push({ dispose: () => clearTimeout(scrollTimer) });
};
