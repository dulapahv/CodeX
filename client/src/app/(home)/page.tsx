/**
 * Root page component with improved UI.
 * Features a split layout with form and showcase sections.
 */

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
}

const showcaseImages: ShowcaseImage[] = [
  {
    src: '/images/1.png',
    alt: 'Real-time collaboration demo',
    title: 'Real-time Collaboration',
    description: 'Code together in real-time with cursor sharing',
  },
  {
    src: '/images/2.png',
    alt: 'Shared terminal interface',
    title: 'Shared Terminal',
    description: 'Execute code and see results together',
  },
  {
    src: '/images/3.png',
    alt: 'Video streaming feature',
    title: 'Video Streaming',
    description: 'Connect with webcam for better collaboration',
  },
  {
    src: '/images/4.png',
    alt: 'GitHub integration',
    title: 'GitHub Integration',
    description: 'Save and load code directly from GitHub',
  },
  {
    src: '/images/5.png',
    alt: 'Shared notes feature',
    title: 'Shared Notes',
    description: 'Collaborate on notes with Markdown support',
  },
];

const ShowcaseCard = ({ image }: { image: ShowcaseImage }) => (
  <div className="group relative mb-4 h-fit w-[25rem] rounded-lg border bg-background/50 shadow-sm backdrop-blur transition-all hover:shadow-lg">
    <div className="relative h-48 w-full">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-lg"
      />
    </div>
    <div className="p-4">
      <h3 className="mb-1 text-sm font-semibold tracking-tight">
        {image.title}
      </h3>
      <p className="text-xs text-muted-foreground">{image.description}</p>
    </div>
  </div>
);

export default function Page() {
  return (
    <main className="relative flex min-h-dvh flex-col items-start justify-start overflow-hidden lg:flex-row lg:items-center lg:justify-center">
      {/* Left Section - Form */}
      <div className="w-full p-4 lg:w-1/2 lg:p-8">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 text-left">
            <div className="space-y-6">
              <h1 className="flex flex-row items-start gap-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                <Image
                  src="/images/kasca-logo.svg"
                  alt="Kasca Logo"
                  width={64}
                  height={64}
                  className="my-auto size-20 lg:size-24"
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
          <RoomAccessForm hideTitle />
        </div>
      </div>

      {/* Right Section - Fixed Size Cards */}
      <div className="relative hidden w-full lg:block lg:h-dvh lg:w-1/2">
        <div className="absolute inset-0 flex">
          <div className="grid grid-cols-2 gap-6 pl-8">
            {showcaseImages.map((image, index) => (
              <div
                key={image.title}
                className={`transform translate-x-12 ${
                  index % 2 === 0 ? 'translate-y-12' : '-translate-y-12'
                }`}
              >
                <ShowcaseCard image={image} />
              </div>
            ))}
          </div>
        </div>
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-background/80 via-transparent to-transparent" />
      </div>

      <AboutButton />
    </main>
  );
}
