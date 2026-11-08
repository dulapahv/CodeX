/**
 * Formats a run for the shared terminal and its downloaded log. A run is a
 * header naming the language and who ran it, the program's output, and a
 * footer with how it ended, how long it took and the memory it used.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type ExecutionResult,
  ExecutionResultType,
} from "@codex/types/terminal";

const formatExecutionTime = (ms: number) => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatMemory = (bytes: number) => {
  if (bytes < 1_000_000) {
    return `${Math.round(bytes / 1000)} KB`;
  }
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
};

// Piston runs programs from a Bash script, which reports a crash as exit
// code 128 plus the signal number
const SIGNALS_BY_EXIT_CODE = new Map([
  [132, "SIGILL"],
  [134, "SIGABRT"],
  [135, "SIGBUS"],
  [136, "SIGFPE"],
  [137, "SIGKILL"],
  [139, "SIGSEGV"],
]);

// Piston skips the run stage when compiling fails
const didCompileFail = (result: ExecutionResult) =>
  result.compile !== undefined && result.compile.code !== 0;

export const getRunDetails = (result: ExecutionResult): string[] => {
  if (didCompileFail(result)) {
    return [];
  }

  const details: string[] = [];
  const compileTime = result.compile?.wall_time;
  if (typeof compileTime === "number") {
    details.push(`compiled in ${formatExecutionTime(compileTime)}`);
  }

  const { memory, wall_time: runTime } = result.run;
  if (typeof runTime === "number") {
    details.push(`ran in ${formatExecutionTime(runTime)}`);
  }
  if (typeof memory === "number") {
    details.push(formatMemory(memory));
  }
  return details;
};

export const describeExit = (result: ExecutionResult) => {
  const { code, signal, status } = result.run;
  const compileFailed = didCompileFail(result);
  const stage = compileFailed ? "Compilation" : "Process";

  switch (status) {
    case "TO":
      return `${stage} timed out`;
    case "OL":
      return `${stage} stopped because its output was too long`;
    case "EL":
      return `${stage} stopped because its error output was too long`;
    case "XX":
      return "The execution server failed to run the code";
    default:
      break;
  }

  const crashSignal =
    code === null ? undefined : SIGNALS_BY_EXIT_CODE.get(code);
  const killedBy = signal ?? crashSignal;
  if (killedBy) {
    return `${stage} was killed by ${killedBy}`;
  }
  if (code === null || code === 0) {
    return null;
  }
  return compileFailed
    ? `Compilation failed with code ${code}`
    : `Process exited with code ${code}`;
};

export const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    fractionalSecondDigits: 3,
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  });

const SEPARATOR = " · ";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export const isRunOutput = (result: ExecutionResult) =>
  result.type === ExecutionResultType.OUTPUT;

export const isRunError = (result: ExecutionResult) =>
  result.type === ExecutionResultType.ERROR;

// Who ran it is left out of entries saved before names were added
export const getRunTitle = (result: ExecutionResult) => {
  let title = result.run.stdout;
  if (isRunOutput(result)) {
    title = `${capitalize(String(result.language))} ${result.version}`;
  } else if (isRunError(result)) {
    title = "Couldn't run the code";
  }
  return result.runBy ? `${title}${SEPARATOR}${result.runBy}` : title;
};

export const getRunFooter = (result: ExecutionResult) => {
  const exit =
    describeExit(result) ??
    (result.run.code === 0 ? "Process exited with code 0" : "Process finished");
  return [exit, ...getRunDetails(result)].join(SEPARATOR);
};

const formatLogEntry = (result: ExecutionResult): string => {
  const timestamp = formatTimestamp(new Date(result.timestamp ?? Date.now()));
  const lines = [`[${timestamp}] ${getRunTitle(result)}`];

  if (isRunError(result)) {
    lines.push(result.run.stderr);
  } else if (isRunOutput(result)) {
    const { stderr, stdout } = result.run;
    if (stdout.trimEnd() || stderr.trimEnd()) {
      lines.push(...[stdout.trimEnd(), stderr.trimEnd()].filter(Boolean));
    } else {
      lines.push("No output");
    }
    lines.push(getRunFooter(result));
  }

  return lines.join("\n");
};

export const handleDownloadLogs = (results: ExecutionResult[]) => {
  const logs = results.map(formatLogEntry).join("\n\n");

  const blob = new Blob([logs], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const now = new Date();
  const datePart = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
  a.download = `codex-terminal-${datePart}--${timePart}.txt`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
