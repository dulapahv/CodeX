/**
 * Utility functions for code execution control.
 * Features:
 * - Execution cancellation
 * - Output formatting
 * - Socket messaging
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type ExecutionResult,
  ExecutionResultType,
} from "@codex/types/terminal";
import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import type { RefObject } from "react";

import { executeCode as executeCodeAction } from "@/actions/execute";
import { parseError } from "@/lib/utils";

// Where a run's results and running state go, this terminal and the room
export interface RunReporter {
  report: (result: ExecutionResult) => void;
  setRunning: (isRunning: boolean) => void;
}

export const cancelExecution = (
  abortControllerRef: RefObject<AbortController | null>,
  reporter: RunReporter
) => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    const endTime = new Date();

    const res = {
      language: "system",
      run: {
        code: 0,
        output: "",
        signal: null,
        stderr: "",
        stdout: "Run stopped",
      },
      timestamp: endTime,
      type: ExecutionResultType.WARNING,
      version: "1.0.0",
    };

    reporter.report(res);
    reporter.setRunning(false);
  }
};

export const executeCode = async (
  monaco: Monaco | null,
  editor: monacoEditor.editor.IStandaloneCodeEditor | null,
  reporter: RunReporter,
  abortControllerRef: RefObject<AbortController | null>,
  args: string[],
  stdin: string
) => {
  if (!(monaco && editor)) {
    return;
  }

  reporter.setRunning(true);

  // Create new AbortController for this execution
  abortControllerRef.current = new AbortController();

  try {
    const code = editor.getValue();

    // The run button is disabled while the editor is empty
    if (!code.trim()) {
      return;
    }

    const model = editor.getModel();
    const currentLanguageId = model?.getLanguageId();
    const language = monaco.languages
      .getLanguages()
      .find((lang) => lang.id === currentLanguageId);

    const abortPromise = new Promise<never>((_, reject) => {
      abortControllerRef.current?.signal.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });

    const result: ExecutionResult = await Promise.race([
      executeCodeAction({
        args,
        code,
        language: language?.id ?? "",
        stdin,
      }),
      abortPromise,
    ]);

    const resultWithTimestamp: ExecutionResult = {
      ...result,
      timestamp: new Date(),
      type: ExecutionResultType.OUTPUT,
    };
    reporter.report(resultWithTimestamp);
  } catch (error) {
    // Don't show error message if the request was cancelled
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    const res = {
      language: "error",
      run: {
        code: 1,
        output: parseError(error),
        signal: null,
        stderr: parseError(error),
        stdout: "",
      },
      timestamp: new Date(),
      type: ExecutionResultType.ERROR,
      version: "1.0.0",
    };
    reporter.report(res);
  } finally {
    abortControllerRef.current = null;
    reporter.setRunning(false);
  }
};
