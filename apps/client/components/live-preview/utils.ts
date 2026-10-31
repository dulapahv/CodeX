/**
 * Build the live preview head with the pre-installed libraries the code uses.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { PREVIEW_LIBS, type PreviewFile } from "@/lib/constants";

const MIME_TYPES = {
  script: "text/javascript;charset=utf-8",
  style: "text/css;charset=utf-8",
} as const;

// The sandboxed iframe has an opaque origin and its requests are never
// cached, so each file is fetched here once and passed in as a data URL
const sources = new Map<string, Promise<string>>();

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const fetchAsDataUrl = async ({ kind, url }: PreviewFile) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`);
  }
  const blob = await response.blob();
  return readAsDataUrl(new Blob([blob], { type: MIME_TYPES[kind] }));
};

const fetchSource = async (file: PreviewFile) => {
  try {
    return await fetchAsDataUrl(file);
  } catch {
    return file.url;
  }
};

const loadSource = (file: PreviewFile) => {
  const cached = sources.get(file.url);
  if (cached) {
    return cached;
  }
  const source = fetchSource(file);
  sources.set(file.url, source);
  return source;
};

const toTag = ({ defer, kind }: PreviewFile, src: string) =>
  kind === "style"
    ? `<link rel="stylesheet" href="${src}" crossorigin="anonymous">`
    : `<script src="${src}" crossorigin="anonymous"${defer ? " defer" : ""}></script>`;

/**
 * Build the head tags for the libraries the code mentions.
 * @param code - HTML shown in the preview
 * @returns Stylesheets then scripts, each as a data URL or its CDN URL if it failed to load
 */
export const buildPreviewHead = async (code: string) => {
  const files = PREVIEW_LIBS.filter(
    (lib) => !lib.usage || lib.usage.test(code)
  ).flatMap((lib) => lib.files);
  const ordered = [
    ...files.filter((file) => file.kind === "style"),
    ...files.filter((file) => file.kind === "script"),
  ];
  const srcs = await Promise.all(ordered.map(loadSource));
  return ordered.map((file, index) => toTag(file, srcs[index])).join("");
};
