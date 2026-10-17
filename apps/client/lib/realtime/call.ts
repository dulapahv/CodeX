/**
 * A room's video call on Cloudflare Realtime SFU, through PartyTracks: this
 * user's camera, microphone and screen, publishing them, and pulling other
 * people's tracks. Nothing connects to the SFU until a source is turned on or
 * someone else's track is pulled.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import "webrtc-adapter";

import {
  MEDIA_TOKEN_HEADER,
  ROOM_ID_HEADER,
  SFU_PROXY_PATH,
  type TrackRef,
} from "@codex/types/realtime";
import {
  getCamera,
  getMic,
  getScreenshare,
  type MediaDevice,
  PartyTracks,
  type TrackMetadata,
} from "partytracks/client";
import {
  BehaviorSubject,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  merge,
  type Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
  share,
  switchMap,
  tap,
  timer,
} from "rxjs";

import { BASE_SERVER_URL } from "@/lib/constants";
import { parseError } from "@/lib/utils";

export type CallSource = "camera" | "mic" | "screen";

export type PublishedTracks = Partial<
  Record<"audio" | "screen" | "video", TrackRef>
>;

export interface Call {
  readonly camera: MediaDevice;
  destroy: () => void;
  readonly error$: Observable<string>;
  // True once a source's device is acquired and sending, not just requested
  readonly isOn$: Record<CallSource, Observable<boolean>>;
  // The SFU connection dropped while this user was sending or receiving
  readonly isReconnecting$: Observable<boolean>;
  readonly mic: MediaDevice;
  readonly published$: Observable<PublishedTracks>;
  // Shared by every subscriber; closes when the last one unsubscribes
  pull: (track: TrackRef) => Observable<MediaStreamTrack>;
  setToken: (token: string) => void;
  start: (source: CallSource) => void;
  stop: (source: CallSource) => void;
}

const CAMERA_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  aspectRatio: { ideal: 16 / 9 },
};
const CAMERA_ENCODINGS: RTCRtpEncodingParameters[] = [
  { maxBitrate: 1_000_000 },
];
// Shared code needs sharp text more than smooth motion
const SCREEN_ENCODINGS: RTCRtpEncodingParameters[] = [
  { maxBitrate: 1_500_000, maxFramerate: 15 },
];

const PUBLISHED_KEY = {
  camera: "video",
  mic: "audio",
  screen: "screen",
} as const satisfies Record<CallSource, keyof PublishedTracks>;

const PULL_LINGER_MS = 5000;

const RECONNECTING_STATES = new Set<RTCPeerConnectionState>([
  "disconnected",
  "failed",
]);

const toTrackRef = ({
  sessionId,
  trackName,
}: TrackMetadata): TrackRef | undefined =>
  sessionId && trackName ? { sessionId, trackName } : undefined;

// Cancelling the browser's screen picker rejects with NotAllowedError
const isCancelledShare = (error: Error) => error.name === "NotAllowedError";

interface CallAccess {
  roomId: string;
  token: string;
}

const SFU_PROXY_URL = `${BASE_SERVER_URL}${SFU_PROXY_PATH}`;
const STUN_ONLY: RTCIceServer[] = [{ urls: "stun:stun.cloudflare.com:3478" }];

const accessHeaders = ({ roomId, token }: CallAccess) =>
  new Headers({ [ROOM_ID_HEADER]: roomId, [MEDIA_TOKEN_HEADER]: token });

/**
 * TURN credentials from the SFU proxy. PartyTracks would fetch these itself,
 * but without the access headers, so the proxy would refuse. Without TURN,
 * calls still connect for most networks over STUN.
 */
export const fetchIceServers = async (
  access: CallAccess
): Promise<RTCIceServer[]> => {
  try {
    const response = await fetch(`${SFU_PROXY_URL}/generate-ice-servers`, {
      headers: accessHeaders(access),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const { iceServers } = (await response.json()) as {
      iceServers: RTCIceServer[];
    };
    return iceServers;
  } catch (error) {
    console.warn(`Couldn't get TURN servers: ${parseError(error)}`);
    return STUN_ONLY;
  }
};

export const createCall = ({
  iceServers,
  ...access
}: CallAccess & { iceServers: RTCIceServer[] }): Call => {
  // PartyTracks reads these on every request, so a new token after a
  // reconnect only needs setting here
  const headers = accessHeaders(access);
  const partyTracks = new PartyTracks({
    prefix: SFU_PROXY_URL,
    headers,
    iceServers,
  });

  const camera = getCamera({ constraints: CAMERA_CONSTRAINTS });
  // Released while off, so the browser stops showing the mic as in use
  const mic = getMic({ retainIdleTrack: false });
  const screenshare = getScreenshare({ audio: false });

  const sources = {
    camera: {
      track$: camera.broadcastTrack$,
      encodings: CAMERA_ENCODINGS,
      isOn$: camera.isBroadcasting$,
      start: camera.startBroadcasting,
      stop: camera.stopBroadcasting,
    },
    mic: {
      track$: mic.broadcastTrack$,
      encodings: undefined,
      isOn$: mic.isBroadcasting$,
      start: mic.startBroadcasting,
      stop: mic.stopBroadcasting,
    },
    screen: {
      track$: screenshare.video.broadcastTrack$.pipe(
        tap((track) => {
          track.contentHint = "detail";
        })
      ),
      encodings: SCREEN_ENCODINGS,
      isOn$: screenshare.video.isBroadcasting$,
      start: screenshare.startBroadcasting,
      stop: screenshare.stopBroadcasting,
    },
  } satisfies Record<CallSource, unknown>;

  const subscriptions = new Subscription();
  const published$ = new BehaviorSubject<PublishedTracks>({});
  const isActive$ = new BehaviorSubject(false);
  const pushErrors$ = new Subject<string>();
  const publishing = new Set<CallSource>();

  // Published on first use and kept: while a source is off PartyTracks sends
  // a placeholder, so turning it back on doesn't renegotiate
  const publish = (source: CallSource) => {
    if (publishing.has(source)) {
      return;
    }
    publishing.add(source);
    isActive$.next(true);
    const { track$, encodings } = sources[source];
    subscriptions.add(
      partyTracks
        .push(track$, encodings ? { sendEncodings$: of(encodings) } : {})
        .subscribe({
          next: (metadata) =>
            published$.next({
              ...published$.value,
              [PUBLISHED_KEY[source]]: toTrackRef(metadata),
            }),
          error: (error: unknown) =>
            pushErrors$.next(
              `Couldn't send your ${source}: ${parseError(error)}`
            ),
        })
    );
  };

  // Chrome rejects renegotiating a session whose last track was closed
  // (max-bundle leaves the offer without a BUNDLE group), after which every
  // pull fails. The mic, sent as silence until it's turned on, is the one
  // track that never closes.
  const activate = () => publish("mic");

  // One pull per track however many components show it. It stays open while
  // anything subscribes, so it closes only when its owner leaves, and lingers
  // briefly after that: a pull dropped before it resolves still closes its
  // transceiver when it does, and if a quick resubscribe (React's Strict Mode
  // remount, for one) had pulled the same track again, the SFU may have
  // handed both the same transceiver, closing the live one.
  const pulls = new Map<string, Observable<MediaStreamTrack>>();
  const pullShared = (track: TrackRef) => {
    const key = `${track.sessionId}/${track.trackName}`;
    let pulled = pulls.get(key);
    if (!pulled) {
      pulled = defer(() => {
        activate();
        return partyTracks.pull(of({ location: "remote", ...track }));
      }).pipe(
        share({
          connector: () => new ReplaySubject<MediaStreamTrack>(1),
          resetOnRefCountZero: () => timer(PULL_LINGER_MS),
        })
      );
      pulls.set(key, pulled);
    }
    return pulled;
  };

  const whileActive = <T>(stream$: Observable<T>) =>
    isActive$.pipe(
      distinctUntilChanged(),
      switchMap((active) => (active ? stream$ : EMPTY))
    );

  const error$ = merge(
    camera.error$.pipe(
      map((error) => `Error accessing camera: ${parseError(error)}`)
    ),
    mic.error$.pipe(
      map((error) => `Error accessing microphone: ${parseError(error)}`)
    ),
    screenshare.video.error$.pipe(
      filter((error) => !isCancelledShare(error)),
      map((error) => `Error sharing screen: ${parseError(error)}`)
    ),
    whileActive(partyTracks.sessionError$).pipe(
      map((message) => `Couldn't connect video: ${message}`)
    ),
    pushErrors$
  );

  const isReconnecting$ = merge(
    of(false),
    whileActive(partyTracks.peerConnectionState$).pipe(
      map((state) => RECONNECTING_STATES.has(state))
    )
  ).pipe(distinctUntilChanged());

  return {
    camera,
    mic,
    published$: published$.asObservable(),
    isOn$: {
      camera: sources.camera.isOn$,
      mic: sources.mic.isOn$,
      screen: sources.screen.isOn$,
    },
    isReconnecting$,
    error$,

    // Publishing starts inside the click handler, since Safari only allows
    // screen capture as a direct response to a click
    start: (source) => {
      activate();
      publish(source);
      sources[source].start();
    },

    stop: (source) => sources[source].stop(),

    pull: pullShared,

    setToken: (next) => headers.set(MEDIA_TOKEN_HEADER, next),

    destroy: () => {
      for (const source of Object.values(sources)) {
        source.stop();
      }
      subscriptions.unsubscribe();
      published$.complete();
      isActive$.complete();
      pushErrors$.complete();
    },
  };
};
