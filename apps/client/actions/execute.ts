"use server";

import { PISTON_API_URL } from "@/lib/constants";

const { PISTON_API_KEY } = process.env;

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
    body: JSON.stringify({
      args: Array.isArray(input.args) ? input.args : [],
      compile_timeout: 30_000,
      files: [{ content: input.code }],
      language: input.language.toLowerCase(),
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

    const message = [
      response.status,
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
