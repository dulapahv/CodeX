import React from 'react';
import Image from 'next/image';
import {
  Code2,
  GitBranchPlus,
  Pencil,
  Terminal,
  Users,
  Video as VideoIcon,
} from 'lucide-react';
import { isMobile } from 'react-device-detect';

import { AboutButton } from '@/components/about-button';
import { RoomAccessForm } from '@/components/room-access-form';

interface ShowcaseImage {
  src: string;
  alt: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const showcaseImages: ShowcaseImage[] = [
  {
    src: '/images/1.png',
    alt: 'Real-time collaboration demo',
    title: 'Real-time Collaboration',
    description: 'Code together in real-time with cursor sharing',
    icon: <Code2 className="size-4" />,
  },
  {
    src: '/images/2.png',
    alt: 'Shared terminal interface',
    title: 'Shared Terminal',
    description: 'Execute code and see results together',
    icon: <Terminal className="size-4" />,
  },
  {
    src: '/images/3.png',
    alt: 'Video streaming feature',
    title: 'Video Streaming',
    description: 'Connect with webcam for better collaboration',
    icon: <VideoIcon className="size-4" />,
  },
  {
    src: '/images/4.png',
    alt: 'GitHub integration',
    title: 'GitHub Integration',
    description: 'Save and load code directly from GitHub',
    icon: <GitBranchPlus className="size-4" />,
  },
  {
    src: '/images/5.png',
    alt: 'Shared notes feature',
    title: 'Shared Notes',
    description: 'Collaborate on notes with Markdown support',
    icon: <Pencil className="size-4" />,
  },
];

const ShowcaseCard = ({ image }: { image: ShowcaseImage }) => (
  <div className="group relative mb-4 w-full overflow-hidden rounded-lg border bg-background/50 shadow-sm backdrop-blur">
    <div className="relative aspect-video w-full">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="rounded-t-lg object-cover transition-transform duration-300"
      />
    </div>
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-primary/10 p-2 text-primary">
          {image.icon}
        </span>
        <h3 className="text-sm font-semibold tracking-tight">{image.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{image.description}</p>
    </div>
  </div>
);

const ShowcaseGrid = () => {
  if (isMobile) {
    return (
      <div className="grid w-full gap-4 px-4 pb-8 pt-4">
        {showcaseImages.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
    );
  }

  const columnOne = showcaseImages.slice(0, 2);
  const columnTwo = showcaseImages.slice(2, 4);
  const thirdColumn = showcaseImages.slice(4);

  return (
    <div className="grid w-full grid-cols-1 justify-center gap-x-6 overflow-hidden p-4 md:flex md:px-0">
      <div className="space-y-6">
        {columnOne.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
      <div className="mt-12 space-y-6">
        {columnTwo.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
      <div className="mt-24 space-y-6">
        {thirdColumn.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <main className="relative flex h-dvh w-full">
      {/* Left Section - Form */}
      <div className="flex w-5/12 items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="space-y-6">
              <h1 className="flex flex-row items-start gap-2 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                <Image
                  src="/images/kasca-logo.svg"
                  alt="Kasca Logo"
                  width={96}
                  height={96}
                  className="size-16 lg:size-24"
                  priority
                />
                <div className="flex flex-col items-start text-start">
                  <span>Code Together</span>
                  <span className="flex items-end gap-2 lg:items-baseline">
                    <span>on</span>
                    <span className="bg-gradient-to-r from-[#fb568a] to-[#e456fb] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                      Kasca
                    </span>
                  </span>
                </div>
              </h1>
              <p className="text-lg text-foreground/80 lg:text-xl">
                Real-time code collaboration with live sync, terminal, and video
                chat. Start now by creating or joining a room.
              </p>
            </div>
          </div>
          <RoomAccessForm />
        </div>
      </div>

      {/* Right Section - Showcase Grid */}
      <div className="relative flex w-7/12 items-center justify-center">
        <ShowcaseGrid />
        {/* Gradient overlay - Only visible on larger screens */}
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-l from-background/30 via-transparent to-transparent dark:from-background/60 lg:block" />
      </div>

      <AboutButton />
    </main>
  );
};

export default Page;
