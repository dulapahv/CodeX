/**
 * The room's video call for React: starts the call once the server says
 * video is set up, shares this user's media state and tracks through
 * presence, plays everyone else's audio, and pulls remote tracks for the
 * video tiles and shared screens.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Presence, TrackRef } from "@codex/types/realtime";
import { createAudioSink, type SinkApi } from "partytracks/client";
import { useObservable, useObservableAsValue } from "partytracks/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Observable, of } from "rxjs";

import {
  type Call,
  createCall,
  fetchIceServers,
  type PublishedTracks,
} from "@/lib/realtime/call";
import {
  usePresenceSelector,
  useRoomConnection,
} from "@/lib/realtime/room-context";

import { reportWebcamError } from "./utils/errors";

// connecting: waiting for the server's `media` message or the call to start
export type CallStatus = "connecting" | "ready" | "unavailable";

interface CallState {
  audioOutput: string;
  call: Call | null;
  cameraOn: boolean;
  micOn: boolean;
  // "Connecting video…" or "Reconnecting video…" while media is held up
  notice: string | null;
  screenOn: boolean;
  setAudioOutput: (deviceId: string) => void;
  setSpeakerOn: (speakerOn: boolean) => void;
  speakerOn: boolean;
  status: CallStatus;
}

interface RemoteTrack extends TrackRef {
  key: string;
  kind: "audio" | "screen" | "video";
}

const CallContext = createContext<CallState | null>(null);

const subscribeNothing = () => () => undefined;

// How long a source may be on without reaching the SFU before saying so
const SLOW_CONNECT_MS = 4000;

const OFF$ = of(false);
const NOTHING_PUBLISHED$ = of<PublishedTracks>({});
const NO_TRACK$: Observable<MediaStreamTrack | undefined> = of(undefined);
const NO_ERRORS$: Observable<string> = of();

const REMOTE_KINDS = ["audio", "screen", "video"] as const;

const isSameRemoteTracks = (previous: RemoteTrack[], next: RemoteTrack[]) =>
  JSON.stringify(previous) === JSON.stringify(next);

// Plays one person's microphone through the shared audio sink. It's silent
// while their mic is off, so muting never closes the track.
const RemoteAudio = ({
  call,
  sessionId,
  sink,
  trackName,
}: TrackRef & { call: Call; sink: SinkApi }) => {
  useEffect(() => {
    const subscription = sink.attach(call.pull({ sessionId, trackName }));
    return () => subscription.unsubscribe();
  }, [call, sink, sessionId, trackName]);
  return null;
};

// Holds someone's camera or screen open while they're in the room, so
// turning it off, or switching away from its tab, doesn't close the track.
// Closing and pulling again soon after breaks PartyTracks' renegotiation.
const KeepPulled = ({
  call,
  sessionId,
  trackName,
}: TrackRef & { call: Call }) => {
  useEffect(() => {
    const subscription = call.pull({ sessionId, trackName }).subscribe();
    return () => subscription.unsubscribe();
  }, [call, sessionId, trackName]);
  return null;
};

// Wraps the whole workspace, which renders before the room connects
export const CallProvider = ({ children }: { children: ReactNode }) => {
  const room = useRoomConnection();
  const access = useSyncExternalStore(
    room?.subscribeMediaAccess ?? subscribeNothing,
    () => room?.getMediaAccess() ?? null,
    () => null
  );
  const [call, setCall] = useState<Call | null>(null);
  const [sink, setSink] = useState<SinkApi | null>(null);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [audioOutput, setAudioOutput] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const enabled = access?.enabled ?? false;
  const token = access?.token;
  // A reconnect brings a new token but keeps the same call
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    const initialToken = tokenRef.current;
    if (!(room && enabled && initialToken)) {
      return;
    }
    const callAccess = { roomId: room.roomId, token: initialToken };
    let isCancelled = false;
    let started: Call | null = null;
    fetchIceServers(callAccess).then((iceServers) => {
      if (!isCancelled) {
        started = createCall({ ...callAccess, iceServers });
        setCall(started);
      }
    });
    return () => {
      isCancelled = true;
      started?.destroy();
      setCall(null);
    };
  }, [room, enabled]);

  useEffect(() => {
    if (call && token) {
      call.setToken(token);
    }
  }, [call, token]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!(call && audioElement)) {
      return;
    }
    const next = createAudioSink({ audioElement });
    setSink(next);
    return () => {
      next.cleanup();
      setSink(null);
    };
  }, [call]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = !speakerOn;
    }
  }, [speakerOn]);

  useEffect(() => {
    if (sink?.isSinkIdSupported && audioOutput) {
      sink.setSinkId(audioOutput);
    }
  }, [sink, audioOutput]);

  const cameraOn$ = useMemo(() => call?.isOn$.camera ?? OFF$, [call]);
  const micOn$ = useMemo(() => call?.isOn$.mic ?? OFF$, [call]);
  const screenOn$ = useMemo(() => call?.isOn$.screen ?? OFF$, [call]);
  const published$ = useMemo(
    () => call?.published$ ?? NOTHING_PUBLISHED$,
    [call]
  );
  const isReconnecting$ = useMemo(() => call?.isReconnecting$ ?? OFF$, [call]);
  const error$ = useMemo(() => call?.error$ ?? NO_ERRORS$, [call]);

  const cameraOn = useObservableAsValue(cameraOn$, false);
  const micOn = useObservableAsValue(micOn$, false);
  const screenOn = useObservableAsValue(screenOn$, false);
  const published = useObservableAsValue(published$, {});
  const isReconnecting = useObservableAsValue(isReconnecting$, false);
  useObservable(error$, reportWebcamError);

  useEffect(() => {
    room?.setPresence({
      media: {
        camera: cameraOn,
        mic: micOn,
        screen: screenOn,
        speaker: speakerOn,
        tracks: published,
      },
    });
  }, [room, cameraOn, micOn, screenOn, speakerOn, published]);

  const remoteTracks = usePresenceSelector((states: Map<number, Presence>) => {
    const tracks: RemoteTrack[] = [];
    for (const [clientId, state] of states) {
      if (clientId === room?.clientId) {
        continue;
      }
      for (const kind of REMOTE_KINDS) {
        const track = state.media?.tracks?.[kind];
        if (track) {
          tracks.push({ key: `${clientId}:${kind}`, kind, ...track });
        }
      }
    }
    return tracks;
  }, isSameRemoteTracks);

  // PartyTracks retries quietly, so a source that stays unpublished is the
  // only sign the SFU can't be reached
  const isWaitingToPublish =
    (cameraOn && !published.video) ||
    (micOn && !published.audio) ||
    (screenOn && !published.screen);
  const [isSlowToConnect, setIsSlowToConnect] = useState(false);
  useEffect(() => {
    if (!isWaitingToPublish) {
      setIsSlowToConnect(false);
      return;
    }
    const timer = setTimeout(() => setIsSlowToConnect(true), SLOW_CONNECT_MS);
    return () => clearTimeout(timer);
  }, [isWaitingToPublish]);

  let notice: string | null = null;
  if (isReconnecting) {
    notice = "Reconnecting video…";
  } else if (isSlowToConnect) {
    notice = "Connecting video…";
  }

  let status: CallStatus = "connecting";
  if (access && !enabled) {
    status = "unavailable";
  } else if (call) {
    status = "ready";
  }

  const value = useMemo<CallState>(
    () => ({
      audioOutput,
      call,
      cameraOn,
      micOn,
      notice,
      screenOn,
      setAudioOutput,
      setSpeakerOn,
      speakerOn,
      status,
    }),
    [audioOutput, call, cameraOn, micOn, notice, screenOn, speakerOn, status]
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* biome-ignore lint/a11y/useMediaCaption: live call audio has no captions */}
      <audio autoPlay hidden ref={audioRef} />
      {call &&
        sink &&
        remoteTracks.map(({ key, kind, sessionId, trackName }) =>
          kind === "audio" ? (
            <RemoteAudio
              call={call}
              key={key}
              sessionId={sessionId}
              sink={sink}
              trackName={trackName}
            />
          ) : (
            <KeepPulled
              call={call}
              key={key}
              sessionId={sessionId}
              trackName={trackName}
            />
          )
        )}
    </CallContext.Provider>
  );
};

export const useCall = (): CallState => {
  const state = useContext(CallContext);
  if (!state) {
    throw new Error("useCall must be used inside a CallProvider");
  }
  return state;
};

// Someone else's track, undefined until it arrives. While its source is off
// this is a black or silent placeholder, so check their presence flags too.
export const useRemoteTrack = (
  track: TrackRef | undefined
): MediaStreamTrack | undefined => {
  const { call } = useCall();
  const sessionId = track?.sessionId;
  const trackName = track?.trackName;
  const track$ = useMemo(
    () =>
      call && sessionId && trackName
        ? call.pull({ sessionId, trackName })
        : NO_TRACK$,
    [call, sessionId, trackName]
  );
  return useObservableAsValue(track$, undefined);
};

// This user's camera while it is on, for the self view
export const useLocalCameraTrack = (): MediaStreamTrack | undefined => {
  const { call, cameraOn } = useCall();
  const track$ = useMemo(
    () => (call && cameraOn ? call.camera.broadcastTrack$ : NO_TRACK$),
    [call, cameraOn]
  );
  return useObservableAsValue(track$, undefined);
};
