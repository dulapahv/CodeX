"use client";

import Editor from "@monaco-editor/react";

export function Ide() {
  return (
    <div>
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        defaultValue="// Write your code here"
      />
    </div>
  );
}
