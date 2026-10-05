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
import { buttonVariants } from "@/components/ui/button";
import {
  CONTACT_URL,
  GITHUB_URL,
  PORTFOLIO_URL,
  REPO_URL,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ExternalLinkProps {
  forceDark?: boolean;
}

const ExternalLink = ({ forceDark = false }: ExternalLinkProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <a
        aria-label="Visit portfolio website (opens in new tab)"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        href={PORTFOLIO_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image
          alt="Mirai logo"
          height={16}
          src="/images/codex-logo.svg"
          width={16}
        />
        My Portfolio
      </a>
      <a
        aria-label="Visit GitHub profile (opens in new tab)"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        href={GITHUB_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image
          alt="GitHub logo"
          height={16}
          src={`/images/${resolvedTheme === "light" && !forceDark ? "octocat" : "octocat-white"}.svg`}
          width={16}
        />
        GitHub Profile
      </a>
      <a
        aria-label="Visit CodeX GitHub repository (opens in new tab)"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        href={REPO_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image
          alt="GitHub logo"
          height={16}
          src={`/images/${resolvedTheme === "light" && !forceDark ? "octocat" : "octocat-white"}.svg`}
          width={16}
        />
        CodeX GitHub
      </a>
      <a
        aria-label="Contact me (opens in new tab)"
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        href={CONTACT_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Send className="size-4" />
        Contact Me
      </a>
    </>
  );
};

export { ExternalLink };
