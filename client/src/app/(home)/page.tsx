import Image from 'next/image';
import {
  Code2,
  GitBranchPlus,
  Pencil,
  Terminal,
  Video as VideoIcon,
} from 'lucide-react';

import { AboutButton } from '@/components/about-button';
import { AnimatedGridBackground } from '@/components/animated-grid-bg';
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
  <div className="group relative mb-4 w-full overflow-hidden rounded-lg border-none bg-black/20 backdrop-blur-sm">
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
        <span className="rounded-full bg-[#f6d84f]/10 p-2 text-[#f6d84f]">
          {image.icon}
        </span>
        <h3 className="text-base font-semibold tracking-tight">
          {image.title}
        </h3>
      </div>
      <p className="text-sm text-foreground/60">{image.description}</p>
    </div>
  </div>
);

const ShowcaseGrid = () => {
  const columnOne = showcaseImages.slice(0, 2);
  const columnTwo = showcaseImages.slice(2, 4);
  const thirdColumn = showcaseImages.slice(4);

  return (
    <div className="grid w-full grid-cols-1 gap-x-6 overflow-y-auto p-4 min-[560px]:grid-cols-2 min-[560px]:p-8 md:grid-cols-3 min-[1189px]:px-0">
      <div className="space-y-6">
        {columnOne.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
      <div className="mt-6 space-y-6 min-[560px]:mt-12">
        {columnTwo.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
      <div className="mt-6 space-y-6 min-[560px]:-mt-2 md:mt-24">
        {thirdColumn.map((image) => (
          <ShowcaseCard key={image.title} image={image} />
        ))}
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <>
      <div
        aria-hidden="true"
        role="presentation"
        className="fixed inset-0 -z-10 bg-gradient-to-tr from-[#fb568a]/50 via-[#c240ff]/50 to-[#5bb3fb]/50"
      />
      <div className="fixed inset-0 -z-10">
        <AnimatedGridBackground />
      </div>
      <main className="relative flex min-h-full w-full flex-col overflow-hidden min-[1189px]:flex-row">
        {/* Left Section - Form */}
        <div className="flex min-h-[700px] w-full flex-col justify-center p-4 min-[560px]:p-8 min-[1189px]:h-dvh min-[1189px]:w-5/12 min-[1189px]:items-center">
          <div className="w-full max-w-xl">
            <div className="mb-6">
              <div className="space-y-6">
                <h1 className="flex flex-row items-start gap-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  <Image
                    src="/images/kasca-logo.svg"
                    alt="Kasca Logo"
                    width={96}
                    height={96}
                    className="size-20 min-[1189px]:size-24"
                    priority
                  />
                  <div className="flex flex-col items-start text-start">
                    <span>Code together</span>
                    <span className="flex items-end gap-2 min-[1189px]:items-baseline">
                      <span>now on</span>
                      <span className="bg-gradient-to-r from-[#fb568a] to-[#e456fb] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                        Kasca
                      </span>
                    </span>
                  </div>
                </h1>
                <p className="text-lg text-foreground/90 sm:text-xl">
                  Your collaborative coding space with shared workspace,
                  terminal, video, and notes. Start now, no sign-up required.
                </p>
              </div>
            </div>
            <RoomAccessForm />
          </div>
        </div>

        {/* Right Section - Showcase Grid */}
        <div className="relative flex w-full flex-1 items-center justify-center overflow-y-auto min-[1189px]:w-7/12 min-[1189px]:pr-8">
          <ShowcaseGrid />
        </div>

        <AboutButton />
      </main>
    </>
  );
};

export default Page;
