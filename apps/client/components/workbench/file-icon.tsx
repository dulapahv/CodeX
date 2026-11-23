/**
 * A file's icon, picked and coloured by its language.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  FileCIcon,
  FileCodeIcon,
  FileCppIcon,
  FileCSharpIcon,
  FileCssIcon,
  FileHtmlIcon,
  FileJsIcon,
  FileMdIcon,
  FilePyIcon,
  FileRsIcon,
  FileSqlIcon,
  FileTsIcon,
  FileTxtIcon,
  FileVueIcon,
  type Icon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const FILE_ICONS: Record<string, { className: string; icon: Icon }> = {
  c: { className: "text-sky-600", icon: FileCIcon },
  cpp: { className: "text-sky-600", icon: FileCppIcon },
  csharp: { className: "text-violet-500", icon: FileCSharpIcon },
  css: { className: "text-blue-500", icon: FileCssIcon },
  html: { className: "text-orange-500", icon: FileHtmlIcon },
  javascript: { className: "text-yellow-500", icon: FileJsIcon },
  markdown: { className: "text-sky-500", icon: FileMdIcon },
  plaintext: { className: "text-wb-muted", icon: FileTxtIcon },
  python: { className: "text-sky-500", icon: FilePyIcon },
  rust: { className: "text-orange-600", icon: FileRsIcon },
  sql: { className: "text-pink-500", icon: FileSqlIcon },
  typescript: { className: "text-blue-500", icon: FileTsIcon },
  vue: { className: "text-emerald-500", icon: FileVueIcon },
};

const DEFAULT_ICON = { className: "text-wb-muted", icon: FileCodeIcon };

export const FileIcon = ({
  className,
  languageId,
}: {
  className?: string;
  languageId: string;
}) => {
  const { className: colorClass, icon: LanguageIcon } =
    FILE_ICONS[languageId] ?? DEFAULT_ICON;
  return (
    <LanguageIcon
      aria-hidden="true"
      className={cn("size-4 shrink-0", colorClass, className)}
    />
  );
};
