/**
 * Remote pointer tracking component for visualizing other users' cursors.
 * Features:
 * - Real-time pointer position updates
 * - Throttled movement tracking
 * - Smooth fade animations
 * - Viewport scaling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Pointer } from "@codex/types/pointer";
import type { Presence } from "@codex/types/realtime";
import { MousePointer2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useRoom } from "@/lib/realtime/room-context";
import { getBackgroundColor, getTextColor } from "@/lib/utils";

interface RemotePointer {
  id: number;
  isVisible: boolean;
  lastUpdate: number;
  name: string;
  position: Pointer;
}

interface AwarenessChange {
  added: number[];
  removed: number[];
  updated: number[];
}

const POINTER_TIMEOUT = 2700; // Hide pointer after 2.7 seconds of inactivity
const FADE_DURATION = 200; // Duration of fade out animation in ms
// Each update carries the sender's whole presence, so ~30 per second
const THROTTLE_MS = 33;
const SWEEP_INTERVAL = 1000;

// Refreshes pointers that moved and drops those whose owner left
const applyPresenceChange = (
  previous: Map<number, RemotePointer>,
  { added, updated, removed }: AwarenessChange,
  states: Map<number, Presence>,
  selfId: number
): Map<number, RemotePointer> => {
  const next = new Map(previous);
  let hasChanged = false;

  for (const clientId of removed) {
    hasChanged = next.delete(clientId) || hasChanged;
  }
  for (const clientId of [...added, ...updated]) {
    const state = states.get(clientId);
    const pointer = state?.pointer;
    const current = previous.get(clientId);
    const isUnmoved =
      current?.position[0] === pointer?.[0] &&
      current?.position[1] === pointer?.[1];
    if (clientId === selfId || !(state && pointer) || isUnmoved) {
      continue;
    }
    next.set(clientId, {
      id: clientId,
      name: state.user.name,
      position: pointer,
      lastUpdate: Date.now(),
      isVisible: true,
    });
    hasChanged = true;
  }

  return hasChanged ? next : previous;
};

const RemotePointers = () => {
  const room = useRoom();
  const [pointers, setPointers] = useState<Map<number, RemotePointer>>(
    new Map()
  );
  const lastEmitRef = useRef(0);
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Share this user's pointer as a percentage of the viewport
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const now = Date.now();
      if (now - lastEmitRef.current < THROTTLE_MS) {
        return;
      }
      lastEmitRef.current = now;

      const pointer: Pointer = [
        Number(((event.clientX / window.innerWidth) * 100).toFixed(2)),
        Number(((event.clientY / window.innerHeight) * 100).toFixed(2)),
      ];
      room.setPresence({ pointer });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [room]);

  // Track other users' pointers from presence
  useEffect(() => {
    const handleChange = (change: AwarenessChange) => {
      const states = room.awareness.getStates() as Map<number, Presence>;
      setPointers((previous) =>
        applyPresenceChange(previous, change, states, room.clientId)
      );
    };

    room.awareness.on("change", handleChange);
    return () => room.awareness.off("change", handleChange);
  }, [room]);

  // Fade out idle pointers, then drop them
  useEffect(() => {
    const sweep = setInterval(() => {
      const now = Date.now();
      setPointers((previous) => {
        let next: Map<number, RemotePointer> | null = null;
        for (const [id, pointer] of previous) {
          const idleFor = now - pointer.lastUpdate;
          if (idleFor > POINTER_TIMEOUT + FADE_DURATION) {
            next ??= new Map(previous);
            next.delete(id);
          } else if (idleFor > POINTER_TIMEOUT && pointer.isVisible) {
            next ??= new Map(previous);
            next.set(id, { ...pointer, isVisible: false });
          }
        }
        return next ?? previous;
      });
    }, SWEEP_INTERVAL);

    return () => clearInterval(sweep);
  }, []);

  return (
    <>
      {Array.from(pointers.values()).map((pointer) => {
        const backgroundColor = getBackgroundColor(pointer.name);
        const color = getTextColor(backgroundColor);

        // Calculate scaled position based on viewport differences
        const scaledX = (pointer.position[0] / 100) * viewport.width;
        const scaledY = (pointer.position[1] / 100) * viewport.height;

        return (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[100] translate-x-[-50%] translate-y-[-50%] transform-gpu transition-all duration-100 ease-out will-change-[left,top,opacity]"
            key={pointer.id}
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              opacity: pointer.isVisible ? 1 : 0,
              backfaceVisibility: "hidden",
              transition: `opacity ${FADE_DURATION}ms ease-out, left 100ms ease-out, top 100ms ease-out`,
            }}
          >
            <div className="relative">
              <MousePointer2
                className="absolute -top-[2px] -left-[2px] size-5 drop-shadow"
                style={{
                  color: backgroundColor,
                  fill: "currentColor",
                }}
              />

              <div
                className="absolute top-4 left-4 flex h-[19px] max-w-[120px] items-center px-1 shadow"
                style={{
                  backgroundColor,
                }}
              >
                <span
                  className="truncate font-medium text-xs"
                  style={{ color }}
                >
                  {pointer.name}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export { RemotePointers };
