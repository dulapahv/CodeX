import Image from 'next/image';

import { Send } from 'lucide-react';

import {
  CONTACT_URL,
  GITHUB_URL,
  PORTFOLIO_URL,
  REPO_URL,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';

const ExternalLink = () => (
  <>
    <Button variant="outline" size="sm" asChild>
      <a
        href={PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit portfolio website (opens in new tab)"
      >
        <Image
          src="/images/kasca-logo.svg"
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
          src="/images/github.svg"
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
        aria-label="Visit Kasca GitHub repository (opens in new tab)"
      >
        <Image
          src="/images/github.svg"
          alt="GitHub logo"
          className="mr-2"
          width={16}
          height={16}
        />
        Kasca GitHub
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

export { ExternalLink };
