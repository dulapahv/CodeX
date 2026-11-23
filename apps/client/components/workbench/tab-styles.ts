/**
 * Classes that restyle shadcn tabs as VS Code's, overriding each base class
 * with the same variant prefix so they win.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

// Panel tabs such as TERMINAL and PROBLEMS, used with the "line" variant
export const PANEL_TAB_LIST_CLASS =
  "h-full gap-4 p-0 group-data-horizontal/tabs:h-full";

export const PANEL_TAB_CLASS =
  "h-full flex-none px-0 text-[11px] font-normal tracking-wide uppercase text-wb-muted hover:text-wb-fg dark:text-wb-muted dark:hover:text-wb-fg data-active:text-wb-fg dark:data-active:text-wb-fg focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-wb-accent after:bg-wb-accent group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-px";

// Editor tabs, the open one in the editor's colour with an accent line on top
export const EDITOR_TAB_LIST_CLASS =
  "min-w-0 justify-start gap-0 overflow-x-auto bg-transparent p-0 group-data-horizontal/tabs:h-full";

export const EDITOR_TAB_CLASS =
  "h-full flex-none border-0 border-r border-wb-border px-3 text-[13px] font-normal text-wb-muted hover:text-wb-fg dark:text-wb-muted dark:hover:text-wb-fg data-active:bg-wb-editor data-active:text-wb-fg dark:data-active:border-wb-border dark:data-active:bg-wb-editor dark:data-active:text-wb-fg focus-visible:border-wb-border focus-visible:ring-0 focus-visible:outline-wb-accent after:bg-wb-accent group-data-horizontal/tabs:after:top-0 group-data-horizontal/tabs:after:bottom-auto group-data-horizontal/tabs:after:h-px data-active:after:opacity-100";
