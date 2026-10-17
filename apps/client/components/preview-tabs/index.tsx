/**
 * The Live Preview panel with a tab for each shared screen. A new share is
 * selected for everyone; when it ends the view returns to the latest
 * remaining share or the live preview.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Presence, TrackRef } from "@codex/types/realtime";
import { Maximize } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCall,
  useRemoteTrack,
} from "@/components/webcam-stream/call-provider";
import { TrackVideo } from "@/components/webcam-stream/components/track-video";
import {
  usePresenceSelector,
  useRoomConnection,
} from "@/lib/realtime/room-context";

const PREVIEW_TAB = "preview";

interface Sharer {
  id: string;
  isSelf: boolean;
  name: string;
  track?: TrackRef;
}

const isSameSharers = (previous: Sharer[], next: Sharer[]) =>
  JSON.stringify(previous) === JSON.stringify(next);

const SharedScreen = ({ name, track }: { name: string; track?: TrackRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const screen = useRemoteTrack(track);

  return (
    <div className="relative flex size-full items-center justify-center bg-black">
      {screen ? (
        <TrackVideo
          className="size-full object-contain"
          ref={videoRef}
          track={screen}
        />
      ) : (
        <p className="text-sm text-white/70">Connecting to {name}'s screen…</p>
      )}
      <Button
        aria-label={`View ${name}'s screen full screen`}
        className="absolute right-2 bottom-2 bg-black/50 text-white hover:bg-black/70"
        onClick={() => videoRef.current?.requestFullscreen()}
        size="icon"
        variant="ghost"
      >
        <Maximize className="size-4" />
      </Button>
    </div>
  );
};

// No preview of your own screen, which would show itself recursively
const OwnShare = () => {
  const { call } = useCall();

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3 bg-[color:var(--panel-background)] text-sm">
      <p>You're sharing your screen</p>
      <Button onClick={() => call?.stop("screen")} variant="destructive">
        Stop sharing
      </Button>
    </div>
  );
};

interface PreviewTabsProps {
  children: ReactNode;
  onShareStarted: () => void;
}

export const PreviewTabs = ({ children, onShareStarted }: PreviewTabsProps) => {
  const room = useRoomConnection();
  const sharers = usePresenceSelector((states: Map<number, Presence>) => {
    const list: Sharer[] = [];
    for (const [clientId, state] of states) {
      if (state.media?.screen) {
        list.push({
          id: String(clientId),
          isSelf: clientId === room?.clientId,
          name: state.user.name,
          track: state.media.tracks?.screen,
        });
      }
    }
    return list;
  }, isSameSharers);
  const [selected, setSelected] = useState(PREVIEW_TAB);

  const sharerIdsRef = useRef<string[]>([]);
  useEffect(() => {
    const previous = sharerIdsRef.current;
    sharerIdsRef.current = sharers.map(({ id }) => id);
    const started = sharers.filter(({ id }) => !previous.includes(id)).at(-1);
    if (started) {
      setSelected(started.id);
      onShareStarted();
    }
  }, [sharers, onShareStarted]);

  const isSelectedShown =
    selected === PREVIEW_TAB || sharers.some(({ id }) => id === selected);
  const current = isSelectedShown
    ? selected
    : (sharers.at(-1)?.id ?? PREVIEW_TAB);

  return (
    <Tabs
      className="size-full gap-0"
      onValueChange={(value) => setSelected(String(value))}
      value={current}
    >
      {sharers.length > 0 && (
        <TabsList className="w-full justify-start" variant="line">
          <TabsTrigger className="flex-none" value={PREVIEW_TAB}>
            Live Preview
          </TabsTrigger>
          {sharers.map(({ id, isSelf, name }) => (
            <TabsTrigger className="flex-none" key={id} value={id}>
              {isSelf ? "Your screen" : `${name}'s screen`}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      {/* Kept mounted so switching tabs doesn't reload the preview */}
      <TabsContent className="min-h-0" keepMounted value={PREVIEW_TAB}>
        {children}
      </TabsContent>
      {sharers.map(({ id, isSelf, name, track }) => (
        <TabsContent className="min-h-0" key={id} value={id}>
          {isSelf ? <OwnShare /> : <SharedScreen name={name} track={track} />}
        </TabsContent>
      ))}
    </Tabs>
  );
};
