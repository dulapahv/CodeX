import { useEffect, useState } from "react";
import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface ToolbarProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

export function Toolbar({ monaco, editor }: ToolbarProps) {
  const [miniMap, setMiniMap] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  useEffect(() => {
    if (editor && monaco) {
      setMiniMap(editor.getOption(monaco.editor.EditorOption.minimap).enabled);
      setWordWrap(
        editor.getOption(monaco.editor.EditorOption.wordWrap) === "on",
      );
    }
  }, [editor, monaco]);

  if (!monaco || !editor) return null;

  function handleNewFile() {
    // Implement new file logic
    console.log("New file");
  }

  function handleOpenFile() {
    // Implement open file logic
    console.log("Open file");
  }

  function handleSaveFile() {
    // Open save file dialog
    console.log("Save file");
  }

  return (
    <Menubar className="border-none bg-transparent">
      <MenubarMenu>
        <MenubarTrigger className="font-normal">File</MenubarTrigger>
        <MenubarContent loop>
          <MenubarItem onSelect={handleNewFile}>
            New File <MenubarShortcut>Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={handleOpenFile}>
            Open File... <MenubarShortcut>Ctrl+O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={handleSaveFile}>
            Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onSelect={() => {
              editor.focus();
              setTimeout(() => window.print(), 1);
            }}
          >
            Print <MenubarShortcut>Ctrl+P</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Settings <MenubarShortcut>Ctrl+,</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Close File <MenubarShortcut>Ctrl+W</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Leave Room <MenubarShortcut>Ctrl+Q</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="font-normal">Edit</MenubarTrigger>
        <MenubarContent loop>
          <MenubarItem
            onSelect={() => editor.trigger("keyboard", "undo", null)}
          >
            Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() => editor.trigger("keyboard", "redo", null)}
          >
            Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.clipboardCutAction",
                null,
              )
            }
          >
            Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.clipboardCopyAction",
                null,
              )
            }
          >
            Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.clipboardPasteAction",
                null,
              )
            }
          >
            Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onSelect={() => editor.trigger("keyboard", "actions.find", null)}
          >
            Find <MenubarShortcut>Ctrl+F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.startFindReplaceAction",
                null,
              )
            }
          >
            Replace <MenubarShortcut>Ctrl+H</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="font-normal">Selection</MenubarTrigger>
        <MenubarContent loop>
          <MenubarItem
            onSelect={() =>
              editor.trigger("keyboard", "editor.action.selectAll", null)
            }
          >
            Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.copyLinesUpAction",
                null,
              )
            }
          >
            Copy Line Up <MenubarShortcut>Shift+Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.copyLinesDownAction",
                null,
              )
            }
          >
            Copy Line Down <MenubarShortcut>Shift+Alt+↓</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.moveLinesUpAction",
                null,
              )
            }
          >
            Move Line Up <MenubarShortcut>Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.moveLinesDownAction",
                null,
              )
            }
          >
            Move Line Down <MenubarShortcut>Alt+↓</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.duplicateSelection",
                null,
              )
            }
          >
            Duplicate Selection
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.insertCursorAbove",
                null,
              )
            }
          >
            Add Cursor Above <MenubarShortcut>Ctrl+Alt+↑</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            onSelect={() =>
              editor.trigger(
                "keyboard",
                "editor.action.insertCursorBelow",
                null,
              )
            }
          >
            Add Cursor Below <MenubarShortcut>Ctrl+Alt+↓</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="font-normal">View</MenubarTrigger>
        <MenubarContent loop>
          <MenubarItem
            onSelect={() => {
              editor.focus();
              editor.trigger("anyString", "editor.action.quickCommand", {});
            }}
          >
            Command Palette <MenubarShortcut>F1</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked>Status Bar</MenubarCheckboxItem>
          <MenubarCheckboxItem
            onCheckedChange={() => {
              editor.updateOptions({ minimap: { enabled: !miniMap } });
              setMiniMap(!miniMap);
            }}
            checked={miniMap}
          >
            Minimap
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            onCheckedChange={() => {
              editor.updateOptions({ wordWrap: wordWrap ? "off" : "on" });
              setWordWrap(!wordWrap);
            }}
            checked={wordWrap}
          >
            Word Wrap <MenubarShortcut>Alt+Z</MenubarShortcut>
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="font-normal">Help</MenubarTrigger>
        <MenubarContent loop>
          <MenubarItem>Documentation</MenubarItem>
          <MenubarItem>About</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
