/**
 * Shown in the editor once every tab is closed, with ways to get going like
 * VS Code's empty editor.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useWorkbench } from "./workbench-provider";

export const EditorEmptyState = () => {
  const { actions, platform, showView } = useWorkbench();
  const modKey = platform === "mac" ? "⌘" : "Ctrl";

  const entries = [
    {
      label: "Show All Commands",
      onClick: actions?.commandPalette,
      shortcut: `${modKey}+Shift+P`,
    },
    { label: "Show Explorer", onClick: () => showView("explorer") },
    { label: "New File", onClick: actions?.newFile },
    {
      label: "Open from Local",
      onClick: actions?.openLocal,
      shortcut: `${modKey}+O`,
    },
  ];

  return (
    <div className="bg-wb-editor text-wb-muted absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 text-[13px]">
      <p>No file is open</p>
      <ul className="flex flex-col gap-1">
        {entries.map(({ label, onClick, shortcut }) => (
          <li key={label}>
            <button
              className="hover:text-wb-fg focus-visible:text-wb-fg grid w-72 grid-cols-2 gap-4 px-2 py-0.5 text-left outline-none disabled:opacity-50"
              disabled={!onClick}
              onClick={onClick}
              type="button"
            >
              <span className="text-right">{label}</span>
              <span className="text-wb-fg/70 font-mono text-xs">
                {shortcut ?? ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
