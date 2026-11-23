/**
 * The inline box for naming a file, as when renaming or creating one in
 * VS Code. It starts with the name selected up to its extension.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { getFileNameError } from "./file-name";

interface NameBoxProps {
  className?: string;
  label: string;
  name: string;
  onCancel: () => void;
  /** Returns why the name couldn't be used, if it couldn't */
  onSubmit: (name: string) => string | null;
}

export const NameBox = ({
  className,
  label,
  name: startName,
  onCancel,
  onSubmit,
}: NameBoxProps) => {
  const [value, setValue] = useState(startName);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  // Leaving moves focus elsewhere, which blurs the box once more
  const isDoneRef = useRef(false);
  const name = value.trim();
  // An empty box isn't an error until someone tries to use it
  const error = (name ? getFileNameError(name) : null) ?? submitError;

  // A frame later, so the menu or palette that opened the box has handed
  // focus back by then instead of taking it from the box, which cancels it
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const dot = startName.lastIndexOf(".");
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, dot > 0 ? dot : startName.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [startName]);

  const finish = (shouldSubmit: boolean, keepOpenOnError: boolean) => {
    if (isDoneRef.current) {
      return;
    }
    if (!shouldSubmit || name === startName || getFileNameError(name)) {
      isDoneRef.current = true;
      onCancel();
      return;
    }
    const problem = onSubmit(name);
    if (problem && keepOpenOnError) {
      setSubmitError(problem);
      return;
    }
    isDoneRef.current = true;
    if (problem) {
      onCancel();
    }
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error !== null}
        aria-label={label}
        className={cn(
          "bg-wb-editor text-wb-fg h-6 w-full border px-1 text-[13px] outline-none",
          error ? "border-red-500" : "border-wb-accent"
        )}
        onBlur={() => finish(true, false)}
        onChange={(event) => {
          setValue(event.target.value);
          setSubmitError(null);
        }}
        onKeyDown={(event) => {
          // Keeps keys like Delete and F2 from reaching the list around it
          event.stopPropagation();
          if (event.key === "Enter" && !error) {
            event.preventDefault();
            finish(true, true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            finish(false, false);
          }
        }}
        ref={inputRef}
        spellCheck={false}
        value={value}
      />
      {error && (
        <p
          className="absolute top-full left-0 z-20 mt-1 w-max max-w-64 border border-red-500 bg-red-950 px-2 py-1 text-xs text-white"
          id={errorId}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
