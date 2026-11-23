/**
 * File names: which language a name suggests, the name a language starts
 * with, and which names are allowed.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";

const BASE_NAMES: Record<string, string> = {
  css: "styles",
  html: "index",
  markdown: "README",
};

const MAX_FILE_NAME_LENGTH = 128;
const INVALID_CHARACTERS = /[\\/:*?"<>|\p{Cc}]/u;

const getExtension = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
};

// Matches a whole name first, such as Dockerfile, then the extension
export const getLanguageForFileName = (monaco: Monaco, name: string) => {
  const lowerName = name.toLowerCase();
  const extension = getExtension(name);
  const languages = monaco.languages.getLanguages();
  const byName = languages.find(({ filenames }) =>
    filenames?.some((filename) => filename.toLowerCase() === lowerName)
  );
  const byExtension = extension
    ? languages.find(({ extensions }) =>
        extensions?.some((known) => known.toLowerCase() === extension)
      )
    : undefined;
  return (byName ?? byExtension)?.id ?? null;
};

export const getDefaultFileName = (monaco: Monaco, languageId: string) => {
  const extension = monaco.languages
    .getLanguages()
    .find(({ id }) => id === languageId)?.extensions?.[0];
  return `${BASE_NAMES[languageId] ?? "main"}${extension ?? ".txt"}`;
};

// The language for a name, Plain Text when nothing matches
export const getFileLanguage = (monaco: Monaco, name: string) =>
  getLanguageForFileName(monaco, name) ?? "plaintext";

export const getFileNameError = (name: string) => {
  if (!name) {
    return "A file name is required";
  }
  if (name.length > MAX_FILE_NAME_LENGTH) {
    return `Keep the name to ${MAX_FILE_NAME_LENGTH} characters or fewer`;
  }
  if (name === "." || name === ".." || INVALID_CHARACTERS.test(name)) {
    return "A file name can't contain \\ / : * ? \" < > |";
  }
  return null;
};

// Swaps the extension for the language's own, when the name has one that
// belongs to a different language
export const renameForLanguage = (
  monaco: Monaco,
  name: string,
  languageId: string
) => {
  const extension = monaco.languages
    .getLanguages()
    .find(({ id }) => id === languageId)?.extensions?.[0];
  const namedLanguage = getLanguageForFileName(monaco, name);
  if (!extension || namedLanguage === null || namedLanguage === languageId) {
    return name;
  }
  const dot = name.lastIndexOf(".");
  return `${dot > 0 ? name.slice(0, dot) : name}${extension}`;
};
