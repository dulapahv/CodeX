/**
 * Live preview component that renders HTML in a lightweight iframe.
 * Features:
 * - Real-time preview updates
 * - Tailwind CSS support
 * - Theme-aware rendering
 * - Pre-installed CDN libraries cached by the browser
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */
import { DISABLE_TAILWIND_CDN_WARN, PREVIEW_CDN } from "@/lib/constants";

import { HelpPopover } from "./components/help-popover";

interface LivePreviewProps {
  value: string;
}

const LivePreview = ({ value }: LivePreviewProps) => {
  const srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${DISABLE_TAILWIND_CDN_WARN}${PREVIEW_CDN}</head><body class="h-screen">${value}</body></html>`;

  return (
    <div className="relative size-full bg-white">
      <iframe
        className="size-full border-none"
        sandbox="allow-scripts allow-same-origin"
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
