/**
 * External link component that renders navigation buttons to portfolio, GitHub, etc.
 * Features:
 * - Link buttons with icons
 * - External URL handling
 * - Accessibility support
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Send } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  CONTACT_URL,
  GITHUB_URL,
  PORTFOLIO_URL,
  REPO_URL,
} from "@/lib/constants";

interface ExternalLinkProps {
  forceDark?: boolean;
}

const ExternalLink = ({ forceDark = false }: ExternalLinkProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Button asChild size="sm" variant="outline">
        <a
          aria-label="Visit portfolio website (opens in new tab)"
          href={PORTFOLIO_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Image
            alt="Mirai logo"
            className="mr-2"
            height={16}
            src="/images/codex-logo.svg"
            width={16}
          />
          My Portfolio
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a
          aria-label="Visit GitHub profile (opens in new tab)"
          href={GITHUB_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Image
            alt="GitHub logo"
            className="mr-2"
            height={16}
            src={`/images/${resolvedTheme === "light" && !forceDark ? "octocat" : "octocat-white"}.svg`}
            width={16}
          />
          GitHub Profile
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a
          aria-label="Visit CodeX GitHub repository (opens in new tab)"
          href={REPO_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Image
            alt="GitHub logo"
            className="mr-2"
            height={16}
            src={`/images/${resolvedTheme === "light" && !forceDark ? "octocat" : "octocat-white"}.svg`}
            width={16}
          />
          CodeX GitHub
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a
          aria-label="Contact me (opens in new tab)"
          href={CONTACT_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Send className="mr-2 size-4" />
          Contact Me
        </a>
      </Button>
    </>
  );
};

export { ExternalLink };
