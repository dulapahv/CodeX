import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from '@codesandbox/sandpack-react';
import { useTheme } from 'next-themes';

import { SANDPACK_CDN } from '@/lib/constants';

import { HelpPopover } from './components/help-popover';

interface SandpackProps {
  value: string;
}

const Sandpack = ({ value }: SandpackProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <SandpackProvider
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      template="static"
      className="!h-full"
      files={{
        'index.html': `<!DOCTYPE html><html><head>${SANDPACK_CDN}</head><body class="h-screen">${value}</body></html>`,
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

export { Sandpack };
