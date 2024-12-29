import { useCallback, useEffect, useRef, useState } from 'react';
import { MousePointer2 } from 'lucide-react';

import { PointerServiceMsg } from '@common/types/message';
import type { Pointer } from '@common/types/pointer';

import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';

interface RemotePointer {
  position: Pointer;
  lastUpdate: number;
  isVisible: boolean;
}

const POINTER_TIMEOUT = 2700;
const FADE_DURATION = 200;
const THROTTLE_MS = 16;

const RemotePointers = () => {
  const socket = getSocket();

  const pointersRef = useRef(new WeakMap<object, RemotePointer>());
  const lastEmitRef = useRef<number>(0);
  const timeoutsRef = useRef(new Map<string, NodeJS.Timeout>());
  const keyMapRef = useRef(new Map<string, object>());

  const [, setUpdateCounter] = useState(0);
  const updatePointerState = useCallback(
    () => setUpdateCounter((prev) => prev + 1),
    [],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const now = Date.now();
      if (now - lastEmitRef.current < THROTTLE_MS) return;

      const pointer: Pointer = [event.clientX, event.clientY];
      socket.emit(PointerServiceMsg.POINTER, pointer);
      lastEmitRef.current = now;
    },
    [socket],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    const handlePointerUpdate = (userId: string, newPosition: Pointer) => {
      // Get or create key object for WeakMap
      let keyObj = keyMapRef.current.get(userId);
      if (!keyObj) {
        keyObj = {};
        keyMapRef.current.set(userId, keyObj);
      }

      // Update pointer data
      pointersRef.current.set(keyObj, {
        position: newPosition,
        lastUpdate: Date.now(),
        isVisible: true,
      });

      // Clear existing timeout
      const existingTimeout = timeouts.get(userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      // Set new timeout for cleanup
      const timeout = setTimeout(() => {
        const pointer = keyObj && pointersRef.current.get(keyObj);
        if (pointer) {
          pointer.isVisible = false;
          updatePointerState();

          // Remove pointer after fade
          setTimeout(() => {
            pointersRef.current.delete(keyObj!);
            keyMapRef.current.delete(userId);
            updatePointerState();
          }, FADE_DURATION);
        }
      }, POINTER_TIMEOUT);

      timeouts.set(userId, timeout);
      updatePointerState();
    };

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    socket.on(PointerServiceMsg.POINTER, handlePointerUpdate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      socket.off(PointerServiceMsg.POINTER, handlePointerUpdate);
      // Use the captured timeouts reference for cleanup
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, [socket, handlePointerMove, updatePointerState]);

  return (
    <>
      {Array.from(keyMapRef.current.entries()).map(([userId, keyObj]) => {
        const pointer = pointersRef.current.get(keyObj);
        const username = userMap.get(userId);
        if (!pointer || !username) return null;

        const { backgroundColor, color } = userMap.getColors(userId);

        return (
          <div
            key={userId}
            className="pointer-events-none fixed z-[100] translate-x-[-50%] translate-y-[-50%] transform-gpu will-change-[left,top,opacity]"
            style={{
              left: `${pointer.position[0]}px`,
              top: `${pointer.position[1]}px`,
              opacity: pointer.isVisible ? 1 : 0,
              backfaceVisibility: 'hidden',
              transition: `opacity ${FADE_DURATION}ms ease-out, left 100ms ease-out, top 100ms ease-out`,
            }}
            aria-hidden="true"
          >
            <div className="relative">
              <MousePointer2
                size={20}
                className="absolute -left-[2px] -top-[2px] shadow-sm"
                style={{
                  color: backgroundColor,
                  fill: 'currentColor',
                }}
              />
              <div
                className="absolute left-4 top-4 flex h-5 max-w-[120px] items-center rounded-[3px] px-1.5 shadow-sm"
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
