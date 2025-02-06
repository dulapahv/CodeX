/**
 * External link component that renders navigation buttons to portfolio, GitHub, etc.
 * Features:
 * - Link buttons with icons
 * - External URL handling
 * - Accessibility support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Image from 'next/image';

import { Send } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  CONTACT_URL,
  GITHUB_URL,
  PORTFOLIO_URL,
  REPO_URL,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface ExternalLinkProps {
  forceDark?: boolean;
}

const ExternalLink = ({ forceDark = false }: ExternalLinkProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <a
          href={PORTFOLIO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit portfolio website (opens in new tab)"
        >
          <Image
            src="/images/codex-logo.svg"
            alt="Mirai logo"
            className="mr-2"
            width={16}
            height={16}
          />
          My Portfolio
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit GitHub profile (opens in new tab)"
        >
          <Image
            src={`/images/${resolvedTheme === 'light' && !forceDark ? 'octocat' : 'octocat-white'}.svg`}
            alt="GitHub logo"
            className="mr-2"
            width={16}
            height={16}
          />
          GitHub Profile
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit CodeX GitHub repository (opens in new tab)"
        >
          <Image
            src={`/images/${resolvedTheme === 'light' && !forceDark ? 'octocat' : 'octocat-white'}.svg`}
            alt="GitHub logo"
            className="mr-2"
            width={16}
            height={16}
          />
          CodeX GitHub
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact me (opens in new tab)"
        >
          <Send className="mr-2 size-4" />
          Contact Me
        </a>
      </Button>
    </>
  );
};

export { ExternalLink };
