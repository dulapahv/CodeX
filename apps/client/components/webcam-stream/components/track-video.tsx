/**
 * Plays a single video track. Audio is played separately through the call's
 * audio sink, so the element is always muted.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { type Ref, useEffect, useRef } from "react";

interface TrackVideoProps {
  className?: string;
  ref?: Ref<HTMLVideoElement>;
  track: MediaStreamTrack | undefined;
}

export const TrackVideo = ({ className, ref, track }: TrackVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = track ? new MediaStream([track]) : null;
    }
  }, [track]);

  return (
    <video
      autoPlay
      className={className}
      muted
      playsInline
      ref={(element) => {
        videoRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
    />
  );
};
