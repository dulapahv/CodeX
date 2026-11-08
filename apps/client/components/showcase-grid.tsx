/**
 * Showcase grid component for displaying feature highlights.
 * Features:
 * - Image grid layout
 * - Feature descriptions
 * - Icon integration
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CodeIcon,
  GitPullRequestIcon,
  LayoutIcon,
  NotebookIcon,
  TerminalWindowIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import type { ReactNode } from "react";

interface ShowcaseImage {
  alt: string;
  description: string;
  icon: ReactNode;
  src: string;
  title: string;
}

const showcaseImages: ShowcaseImage[] = [
  {
    alt: "Five people editing the same file, each with a named cursor and selection",
    description:
      "Code together with live cursors, selections, and follow mode, so you always see who is where",
    icon: <CodeIcon className="size-4" />,
    src: "/images/showcase/collaborate.png",
    title: "Real-time Collaboration",
  },
  {
    alt: "Shared terminal showing a failed run by Priya and a successful run by Mia",
    description:
      "Run code in over 80 languages and see each result, who ran it, and how long it took",
    icon: <TerminalWindowIcon className="size-4" />,
    src: "/images/showcase/terminal.png",
    title: "Shared Terminal",
  },
  {
    alt: "Landing page code beside its live preview",
    description:
      "Preview HTML as you type, with Tailwind CSS, Alpine.js, GSAP, Chart.js, and more loaded on demand",
    icon: <LayoutIcon className="size-4" />,
    src: "/images/showcase/live-preview.png",
    title: "Live Preview",
  },
  {
    alt: "Saving a file to a repository with a commit message",
    description:
      "Open and save files in your GitHub, GitLab, Bitbucket, and Codeberg repositories",
    icon: <GitPullRequestIcon className="size-4" />,
    src: "/images/showcase/github.png",
    title: "Git Integration",
  },
  {
    alt: "Shared notepad with formatting toolbar, date, callout, checklist, and poll",
    description:
      "Plan together in rich text with tables, polls, equations, drawings, and markdown",
    icon: <NotebookIcon className="size-4" />,
    src: "/images/showcase/notepad.png",
    title: "Shared Notepad",
  },
  {
    alt: "Video call with six participants and call controls",
    description:
      "Talk face to face with built-in video, voice, and screen sharing",
    icon: <VideoCameraIcon className="size-4" />,
    src: "/images/showcase/video.png",
    title: "Video & Voice",
  },
];

const ShowcaseCard = ({ image }: { image: ShowcaseImage }) => (
  <div className="group relative min-h-[300px] w-full overflow-hidden border-none bg-black/20 backdrop-blur-xs">
    <div className="relative aspect-video w-full">
      <Image
        alt={image.alt}
        className="object-cover transition-transform duration-300"
        fill
        loading="eager"
        sizes="(min-width: 1189px) 33vw, (min-width: 560px) 50vw, 100vw"
        src={image.src}
      />
    </div>
    <div className="min-h-28 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="bg-[#f6d84f]/10 p-2 text-[#f6d84f]">{image.icon}</span>
        <h1 className="text-foreground text-base font-semibold tracking-tight">
          {image.title}
        </h1>
      </div>
      <p className="text-foreground/60 text-sm">{image.description}</p>
    </div>
  </div>
);

const ShowcaseGrid = () => (
  <div className="grid w-full auto-rows-max gap-6">
    {/* Mobile: Single column */}
    <div className="grid grid-cols-1 gap-6 p-4 min-[560px]:hidden">
      {showcaseImages.map((image) => (
        <ShowcaseCard image={image} key={image.title} />
      ))}
    </div>

    {/* Tablet: Two columns with stagger */}
    <div className="hidden grid-cols-2 gap-6 p-8 min-[560px]:grid min-[1189px]:hidden">
      <div className="space-y-6">
        {showcaseImages.slice(0, 3).map((image) => (
          <ShowcaseCard image={image} key={image.title} />
        ))}
      </div>
      <div className="mt-12 space-y-6">
        {showcaseImages.slice(3, 6).map((image) => (
          <ShowcaseCard image={image} key={image.title} />
        ))}
      </div>
    </div>

    {/* Desktop: Three columns with stagger */}
    <div className="hidden grid-cols-3 gap-6 min-[1189px]:grid">
      <div className="space-y-6">
        {showcaseImages.slice(0, 2).map((image) => (
          <ShowcaseCard image={image} key={image.title} />
        ))}
      </div>
      <div className="mt-12 space-y-6">
        {showcaseImages.slice(2, 4).map((image) => (
          <ShowcaseCard image={image} key={image.title} />
        ))}
      </div>
      <div className="mt-24 space-y-6">
        {showcaseImages.slice(4, 6).map((image) => (
          <ShowcaseCard image={image} key={image.title} />
        ))}
      </div>
    </div>
  </div>
);

export { ShowcaseGrid };
