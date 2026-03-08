/**
 * Welcome message component displayed in shared terminal.
 * Features:
 * - App logo and branding
 * - Usage instructions
 * - Terminal formatting
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Image from "next/image";

import { SITE_NAME } from "@/lib/constants";

const WelcomeMsg = () => (
  <div className="mb-4 space-y-2">
    <div className="flex items-center gap-2 text-green-500">
      <Image
        alt="CodeX Logo"
        className="size-5"
        height="16"
        loading="eager"
        src="/images/codex-logo.svg"
        width="16"
      />
      <span>Welcome to {SITE_NAME}</span>
    </div>
    <div className="text-green-500">---------------------------------</div>
    <div>
      This is a shared terminal. All participants can view the output here.
      {"\n"}
      {"\n"}
      Type your code in the editor and click run.
      {"\n"}
      Select language via the dropdown in the bottom right corner.
    </div>
  </div>
);

export { WelcomeMsg };
