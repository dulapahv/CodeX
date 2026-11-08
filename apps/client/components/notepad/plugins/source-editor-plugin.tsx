/**
 * The note as raw markdown. Typing applies the markdown to the shared note
 * after a short pause, and other people's edits show up here while nothing
 * is waiting to be applied.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState } from "lexical";
import { COLLABORATION_TAG, HISTORIC_TAG } from "lexical";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { NOTEPAD_TRANSFORMERS } from "../markdown";
import { $replaceWithMarkdown } from "../markdown-diff";

const APPLY_DELAY_MS = 400;

const readMarkdown = (editorState: EditorState) =>
  editorState.read(() => $convertToMarkdownString(NOTEPAD_TRANSFORMERS));

const SourceEditorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<[number, number] | null>(null);
  const [value, setValue] = useState(() =>
    readMarkdown(editor.getEditorState())
  );

  const apply = useDebouncedCallback(
    (markdown: string) => {
      editor.update(() => $replaceWithMarkdown(markdown));
    },
    APPLY_DELAY_MS,
    { flushOnExit: true }
  );

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, tags }) => {
        const isRemote = tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG);
        if (!isRemote || apply.isPending()) {
          return;
        }
        const textarea = textareaRef.current;
        caretRef.current = textarea
          ? [textarea.selectionStart, textarea.selectionEnd]
          : null;
        setValue(readMarkdown(editorState));
      }),
    [apply, editor]
  );

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const caret = caretRef.current;
    if (textarea && caret && value) {
      textarea.setSelectionRange(caret[0], caret[1]);
      caretRef.current = null;
    }
  }, [value]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <textarea
      aria-label="Markdown source"
      className="absolute inset-0 size-full resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-6 outline-none"
      onBlur={() => apply.flush()}
      onChange={(event) => {
        setValue(event.target.value);
        apply(event.target.value);
      }}
      ref={textareaRef}
      spellCheck={false}
      value={value}
    />
  );
};

export { SourceEditorPlugin };
