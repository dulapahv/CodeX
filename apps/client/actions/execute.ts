"use server";

import { PISTON_API_URL } from "@/lib/constants";

const { PISTON_API_KEY } = process.env;

// Monaco and Piston name some languages differently
const PISTON_LANGUAGES = new Map([["shell", "bash"]]);

// Piston would run Monaco's Structured Text as Smalltalk
const UNSUPPORTED_LANGUAGES = new Set(["st"]);

interface ExecuteInput {
  args?: string[];
  code: string;
  language: string;
  stdin?: string;
}

const failedResult = (input: ExecuteInput, detail: string) => {
  const message = [
    detail,
    "",
    "This language is not supported or the execution server is down.",
    "To change language, select language via the dropdown in the bottom right corner.",
  ].join("\n");

  return {
    language: input.language,
    metadata: {
      args: input.args || [],
      stdin: input.stdin || "",
      timestamp: new Date().toISOString(),
    },
    run: {
      code: 1,
      output: message,
      signal: null,
      stderr: message,
      stdout: "",
    },
    version: "*",
  };
};

export async function executeCode(input: ExecuteInput) {
  if (!input.code) {
    throw new Error("Code is required");
  }

  if (!input.language) {
    throw new Error("Language is required");
  }

  const language = input.language.toLowerCase();
  if (UNSUPPORTED_LANGUAGES.has(language)) {
    return failedResult(input, `${language} runtime is unknown`);
  }

  const response = await fetch(PISTON_API_URL, {
    body: JSON.stringify({
      args: Array.isArray(input.args) ? input.args : [],
      compile_timeout: 30_000,
      files: [{ content: input.code }],
      language: PISTON_LANGUAGES.get(language) ?? language,
      run_timeout: 30_000,
      stdin: input.stdin || "",
      version: "*",
    }),
    headers: {
      "Content-Type": "application/json",
      ...(PISTON_API_KEY && { Authorization: PISTON_API_KEY }),
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message || JSON.stringify(parsed, null, 2);
    } catch {
      // body is not JSON, use as-is
    }

    return failedResult(input, `${response.status}\n${detail}`);
  }

  const data = await response.json();

  return {
    ...data,
    metadata: {
      args: input.args || [],
      stdin: input.stdin || "",
      timestamp: new Date().toISOString(),
    },
  };
}
