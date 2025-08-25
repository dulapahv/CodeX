/**
 * Live preview component that renders HTML with Sandpack.
 * Features:
 * - Real-time preview updates
 * - Tailwind CSS support
 * - Theme-aware rendering
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from '@codesandbox/sandpack-react';
import { useTheme } from 'next-themes';

import { DISABLE_TAILWIND_CDN_WARN, SANDPACK_CDN } from '@/lib/constants';

import { HelpPopover } from './components/help-popover';

interface LivePreviewProps {
  value: string;
}

const LivePreview = ({ value }: LivePreviewProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <SandpackProvider
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      template="static"
      className="!h-full"
      files={{
        'index.html': `<!DOCTYPE html><html><head>${DISABLE_TAILWIND_CDN_WARN}${SANDPACK_CDN}</head><body class="h-screen">${value}</body></html>`,
      }}
      options={{
        initMode: 'user-visible',
      }}
    >
      <SandpackLayout className="!h-full !rounded-none !border-none">
        <SandpackPreview
          className="!h-full"
          showOpenInCodeSandbox={false}
          actionsChildren={<HelpPopover />}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
};

export { LivePreview };
