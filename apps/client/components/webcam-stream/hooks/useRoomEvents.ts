/**
 * Keeps WebRTC peers in step with the room: connects to people as they
 * appear, cleans up when they leave, relays signals, and drops a stream when
 * its owner turns their camera and microphone off.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Presence } from "@codex/types/realtime";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
} from "react";
import type Peer from "simple-peer";

import { useRoom } from "@/lib/realtime/room-context";

import {
  cleanupPeer,
  createPeer,
  handleSignal,
  setSignalSender,
} from "../utils/peer";

interface AwarenessChange {
  added: number[];
  removed: number[];
  updated: number[];
}

interface UseRoomEventsProps {
  peersRef: RefObject<Record<string, Peer.Instance>>;
  pendingSignalsRef: RefObject<Record<string, Peer.SignalData[]>>;
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >;
  streamRef: RefObject<MediaStream | null>;
}

export const useRoomEvents = ({
  streamRef,
  peersRef,
  pendingSignalsRef,
  setRemoteStreams,
}: UseRoomEventsProps) => {
  const room = useRoom();

  // biome-ignore lint/correctness/useExhaustiveDependencies: refs and setters are stable for the component's lifetime
  useEffect(() => {
    setSignalSender((userID, signal) =>
      room.send({ type: "signal", to: Number(userID), signal })
    );

    // The lower client ID starts the connection, so two people never both
    // send an offer to each other
    const connectTo = (clientId: number) => {
      if (clientId !== room.clientId && room.clientId < clientId) {
        createPeer(
          String(clientId),
          true,
          streamRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef
        );
      }
    };

    const dropStream = (userID: string) =>
      setRemoteStreams((previous) => {
        if (!(userID in previous)) {
          return previous;
        }
        const next = { ...previous };
        delete next[userID];
        return next;
      });

    const handleChange = ({ added, updated, removed }: AwarenessChange) => {
      const states = room.awareness.getStates() as Map<number, Presence>;
      for (const clientId of removed) {
        cleanupPeer(String(clientId), peersRef, setRemoteStreams);
      }
      for (const clientId of added) {
        connectTo(clientId);
      }
      for (const clientId of updated) {
        const media = states.get(clientId)?.media;
        if (
          clientId !== room.clientId &&
          media &&
          !(media.camera || media.mic)
        ) {
          dropStream(String(clientId));
        }
      }
    };

    room.awareness.on("change", handleChange);
    for (const clientId of room.awareness.getStates().keys()) {
      connectTo(clientId);
    }

    const stopSignals = room.onMessage("signal", ({ from, signal }) => {
      handleSignal(
        signal as Peer.SignalData,
        String(from),
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef
      );
    });

    return () => {
      room.awareness.off("change", handleChange);
      stopSignals();
      setSignalSender(null);

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      for (const userID of Object.keys(peersRef.current)) {
        cleanupPeer(userID, peersRef, setRemoteStreams);
      }
    };
  }, [room]);
};
