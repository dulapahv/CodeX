/**
 * The Excalidraw canvas used to draw or edit a notepad drawing. Loaded only
 * when a drawing is opened, since Excalidraw is large.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import "@excalidraw/excalidraw/index.css";

import { Excalidraw, exportToSvg } from "@excalidraw/excalidraw";
import type {
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import type { ExcalidrawPayload } from "../commands";

interface Scene {
  elements: NonNullable<ExcalidrawInitialDataState["elements"]>;
  files: BinaryFiles;
}

const parseScene = (data: string): Scene => {
  try {
    const scene = JSON.parse(data) as Partial<Scene>;
    return {
      elements: Array.isArray(scene.elements) ? scene.elements : [],
      files: scene.files ?? {},
    };
  } catch {
    return { elements: [], files: {} };
  }
};

interface ExcalidrawEditorProps {
  data: string;
  onCancel: () => void;
  onSave: (drawing: ExcalidrawPayload | null) => void;
}

const ExcalidrawEditor = ({
  data,
  onCancel,
  onSave,
}: ExcalidrawEditorProps) => {
  const { resolvedTheme } = useTheme();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const initialData = useMemo<ExcalidrawInitialDataState>(
    () => ({ ...parseScene(data), scrollToContent: true }),
    [data]
  );

  // An emptied drawing is removed rather than kept as a blank block
  const save = async () => {
    if (!api) {
      return;
    }
    const elements = api.getSceneElements();
    if (elements.length === 0) {
      onSave(null);
      return;
    }
    setIsSaving(true);
    const files = api.getFiles();
    const svg = await exportToSvg({
      appState: {
        ...api.getAppState(),
        exportBackground: false,
        exportWithDarkMode: false,
      },
      elements,
      files,
    });
    onSave({ data: JSON.stringify({ elements, files }), svg: svg.outerHTML });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="border-foreground/15 min-h-0 flex-1 border">
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={initialData}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button disabled={!api || isSaving} onClick={save}>
          Save drawing
        </Button>
      </div>
    </div>
  );
};

export default ExcalidrawEditor;
