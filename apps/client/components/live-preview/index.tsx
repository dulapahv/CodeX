/**
 * Live preview component that renders HTML in a lightweight iframe.
 * Features:
 * - Real-time preview updates
 * - Tailwind CSS support
 * - Theme-aware rendering
 * - Pre-installed CDN libraries loaded when the code uses them
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */
import { useEffect, useState } from "react";

import { DISABLE_TAILWIND_CDN_WARN } from "@/lib/constants";

import { HelpPopover } from "./components/help-popover";
import { buildPreviewHead } from "./utils";

interface LivePreviewProps {
  value: string;
}

const LivePreview = ({ value }: LivePreviewProps) => {
  const [srcdoc, setSrcdoc] = useState<string>();

  useEffect(() => {
    let isCurrent = true;
    const render = async () => {
      const head = await buildPreviewHead(value);
      if (isCurrent) {
        setSrcdoc(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${DISABLE_TAILWIND_CDN_WARN}${head}</head><body class="h-screen">${value}</body></html>`
        );
      }
    };
    render();
    return () => {
      isCurrent = false;
    };
  }, [value]);

  return (
    <div className="relative size-full bg-white">
      <iframe
        className="size-full border-none"
        sandbox="allow-scripts"
        srcDoc={srcdoc}
        title="Live Preview"
      />
      <div className="absolute right-2 bottom-2 z-10">
        <HelpPopover />
      </div>
    </div>
  );
};

export { LivePreview };
