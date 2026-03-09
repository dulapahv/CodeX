"use server";

import { PISTON_API_URL } from "@/lib/constants";

const PISTON_API_KEY = process.env.PISTON_API_KEY;

interface ExecuteInput {
  args?: string[];
  code: string;
  language: string;
  stdin?: string;
}

export async function executeCode(input: ExecuteInput) {
  if (!input.code) {
    throw new Error("Code is required");
  }

  if (!input.language) {
    throw new Error("Language is required");
  }

  const response = await fetch(PISTON_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PISTON_API_KEY && { Authorization: PISTON_API_KEY }),
    },
    body: JSON.stringify({
      language: input.language.toLowerCase(),
      version: "*",
      files: [{ content: input.code }],
      stdin: input.stdin || "",
      args: Array.isArray(input.args) ? input.args : [],
      run_timeout: 30_000,
      compile_timeout: 30_000,
    }),
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

    const message = [
      response.status,
      detail,
      "",
      "This language is not supported or the execution server is down.",
      "To change language, select language via the dropdown in the bottom right corner.",
    ].join("\n");

    return {
      language: input.language,
      version: "*",
      run: {
        stdout: "",
        stderr: message,
        code: 1,
        signal: null,
        output: message,
      },
      metadata: {
        args: input.args || [],
        stdin: input.stdin || "",
        timestamp: new Date().toISOString(),
      },
    };
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
