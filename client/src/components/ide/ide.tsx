"use client";

import Editor from "@monaco-editor/react";
import { Braces } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function Ide() {
  return (
    <Editor
      defaultLanguage="javascript"
      defaultValue="// Write your code here"
      loading={
        <Alert className="max-w-md">
          <Braces className="size-4" />
          <AlertTitle>Loading Editor</AlertTitle>
          <AlertDescription>
            Setting up the editor, please wait...
          </AlertDescription>
        </Alert>
      }
    />
  );
}
