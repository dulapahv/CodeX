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

import React, { useCallback, useEffect, useState } from 'react';

import { MousePointer2 } from 'lucide-react';

import { PointerServiceMsg } from '@codex/types/message';
import type { Pointer } from '@codex/types/pointer';

import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';

interface RemotePointer {
  id: string;
  position: Pointer;
  lastUpdate: number;
  isVisible: boolean;
}

const POINTER_TIMEOUT = 2700; // Hide pointer after 2.7 seconds of inactivity
const FADE_DURATION = 200; // Duration of fade out animation in ms
const THROTTLE_MS = 16; // Approximately 60fps for smoother updates

const RemotePointers = () => {
  const socket = getSocket();
  const [pointers, setPointers] = useState<Map<string, RemotePointer>>(
    new Map(),
  );
  const [lastEmit, setLastEmit] = useState<number>(0);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sending pointer updates
  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const now = Date.now();
      if (now - lastEmit < THROTTLE_MS) return;

      // Calculate relative positions as percentages and round to 2 decimal places
      const relativeX = Number(
        ((event.clientX / window.innerWidth) * 100).toFixed(2),
      );
      const relativeY = Number(
        ((event.clientY / window.innerHeight) * 100).toFixed(2),
      );

      const pointer: Pointer = [relativeX, relativeY];

      socket.emit(PointerServiceMsg.POINTER, pointer);
      setLastEmit(now);
    },
    [socket, lastEmit],
  );

  useEffect(() => {
    const handlePointerUpdate = (userId: string, pointer: Pointer) => {
      setPointers((prev) => {
        const updated = new Map(prev);
        updated.set(userId, {
          id: userId,
          position: pointer,
          lastUpdate: Date.now(),
          isVisible: true,
        });
        return updated;
      });
    };

    const cleanup = setInterval(() => {
      setPointers((prev) => {
        const now = Date.now();
        const updated = new Map(prev);
        let hasChanges = false;

        for (const [id, pointer] of updated.entries()) {
          const timeSinceUpdate = now - pointer.lastUpdate;

          // Start fade out animation
          if (timeSinceUpdate > POINTER_TIMEOUT && pointer.isVisible) {
            updated.set(id, { ...pointer, isVisible: false });
            hasChanges = true;

            // Remove pointer after fade animation completes
            setTimeout(() => {
              setPointers((current) => {
                const next = new Map(current);
                next.delete(id);
                return next;
              });
            }, FADE_DURATION);
          }
        }

        return hasChanges ? updated : prev;
      });
    }, 1000);

    window.addEventListener('pointermove', handlePointerMove);
    socket.on(PointerServiceMsg.POINTER, handlePointerUpdate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      socket.off(PointerServiceMsg.POINTER, handlePointerUpdate);
      clearInterval(cleanup);
    };
  }, [socket, handlePointerMove]);

  return (
    <>
      {Array.from(pointers.values()).map((pointer) => {
        const username = userMap.get(pointer.id);
        if (!username) return null;

        const { backgroundColor, color } = userMap.getColors(pointer.id);

        // Calculate scaled position based on viewport differences
        const scaledX = (pointer.position[0] / 100) * viewport.width;
        const scaledY = (pointer.position[1] / 100) * viewport.height;

        return (
          <div
            key={pointer.id}
            className="pointer-events-none fixed z-[100] translate-x-[-50%] translate-y-[-50%]
              transform-gpu transition-all duration-100 ease-out
              will-change-[left,top,opacity]"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              opacity: pointer.isVisible ? 1 : 0,
              backfaceVisibility: 'hidden',
              transition: `opacity ${FADE_DURATION}ms ease-out, left 100ms ease-out, top 100ms ease-out`,
            }}
            aria-hidden="true"
          >
            <div className="relative">
              <MousePointer2
                className="absolute -left-[2px] -top-[2px] size-5 drop-shadow"
                style={{
                  color: backgroundColor,
                  fill: 'currentColor',
                }}
              />

              <div
                className="absolute left-4 top-4 flex h-[19px] max-w-[120px] items-center rounded-[3px]
                  px-1 shadow"
                style={{
                  backgroundColor,
                }}
              >
                <span
                  className="truncate text-xs font-medium"
                  style={{ color }}
                >
                  {username}
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
