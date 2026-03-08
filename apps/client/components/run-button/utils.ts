/**
 * Utility functions for code execution control.
 * Features:
 * - Execution cancellation
 * - Output formatting
 * - Socket messaging
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CodeServiceMsg } from "@codex/types/message";
import {
  type ExecutionResult,
  ExecutionResultType,
} from "@codex/types/terminal";
import type { Monaco } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { executeCode as executeCodeAction } from "@/actions/execute";
import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";

export const cancelExecution = (
  abortControllerRef: RefObject<AbortController | null>,
  setIsRunning: Dispatch<SetStateAction<boolean>>,
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>
) => {
  const socket = getSocket();
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    const endTime = new Date();

    const res = {
      language: "system",
      version: "1.0.0",
      run: {
        stdout: "🛑 Code execution cancelled",
        stderr: "",
        code: 0,
        signal: null,
        output: "",
      },
      timestamp: endTime,
      type: ExecutionResultType.WARNING,
    };

    setOutput((currentOutput) => [...currentOutput, res]);
    socket.emit(CodeServiceMsg.UPDATE_TERM, res);
    setIsRunning(false);
    socket.emit(CodeServiceMsg.EXEC, false);
  }
};

export const executeCode = async (
  monaco: Monaco | null,
  editor: monaco.editor.IStandaloneCodeEditor | null,
  setOutput: Dispatch<SetStateAction<ExecutionResult[]>>,
  setIsRunning: Dispatch<SetStateAction<boolean>>,
  abortControllerRef: RefObject<AbortController | null>,
  args: string[],
  stdin: string
) => {
  if (!(monaco && editor)) {
    return;
  }

  const socket = getSocket();

  const startTime = new Date();
  setIsRunning(true);
  socket.emit(CodeServiceMsg.EXEC, true);

  // Create new AbortController for this execution
  abortControllerRef.current = new AbortController();

  try {
    const code = editor.getValue();

    if (!code.trim()) {
      const res = {
        language: "system",
        version: "1.0.0",
        run: {
          stdout: "⚠️ No code to execute",
          stderr: "",
          code: 0,
          signal: null,
          output: "",
        },
        timestamp: new Date(),
        type: ExecutionResultType.WARNING,
      };
      setOutput((currentOutput) => [...currentOutput, res]);
      socket.emit(CodeServiceMsg.UPDATE_TERM, res);
      return;
    }

    const res = {
      language: "system",
      version: "1.0.0",
      run: {
        stdout: "🚀 Executing code...",
        stderr: "",
        code: 0,
        signal: null,
        output: "",
      },
      timestamp: startTime,
      type: ExecutionResultType.INFO,
    };

    setOutput((currentOutput) => [...currentOutput, res]);
    socket.emit(CodeServiceMsg.UPDATE_TERM, res);

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
        code,
        language: language?.id ?? "",
        args,
        stdin,
      }),
      abortPromise,
    ]);

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    const resultWithTimestamp: ExecutionResult = {
      ...result,
      timestamp: endTime,
      executionTime,
      type: ExecutionResultType.OUTPUT,
    };
    setOutput((currentOutput) => [...currentOutput, resultWithTimestamp]);
    socket.emit(CodeServiceMsg.UPDATE_TERM, resultWithTimestamp);
  } catch (error) {
    // Don't show error message if the request was cancelled
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    const res = {
      language: "error",
      version: "1.0.0",
      run: {
        stdout: "",
        stderr: parseError(error),
        code: 1,
        signal: null,
        output: parseError(error),
      },
      timestamp: endTime,
      executionTime,
      type: ExecutionResultType.ERROR,
    };
    setOutput((currentOutput) => [...currentOutput, res]);
    socket.emit(CodeServiceMsg.UPDATE_TERM, res);
  } finally {
    abortControllerRef.current = null;
    setIsRunning(false);
    socket.emit(CodeServiceMsg.EXEC, false);
  }
};
