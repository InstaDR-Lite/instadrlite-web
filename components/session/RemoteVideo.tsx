'use client';

import { useEffect, useRef } from 'react';

interface RemoteVideoProps {
  stream: MediaStream | null;
  /** Provider view: pass session.status */
  status?: string;
  /** Patient view: pass a custom waiting message */
  waitingText?: string;
}

export function RemoteVideo({ stream, status, waitingText }: RemoteVideoProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;

      // Explicit play trigger — bypasses Safari/Firefox autoplay blocks
      videoElement.play().catch((error) => {
        console.warn('[RemoteVideo] Autoplay blocked, retrying muted:', error);
        videoElement.muted = true;
        videoElement.play().catch(err =>
          console.error('[RemoteVideo] Playback hard-blocked:', err)
        );
      });
    } else {
      videoElement.srcObject = null;
    }
  }, [stream]);

  // Resolve overlay text
  const overlayText = (() => {
    if (stream) return null;                          // stream active — no overlay
    if (waitingText) return waitingText;              // patient view custom text
    if (status === 'local_only') return '// waiting for patient...';
    return '// initializing pipeline...';             // provider default
  })();

  return (
    <div className="flex-1 relative bg-[#080B08] min-h-0">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {overlayText && (
        <div className="flex-1 absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] text-white tracking-widest uppercase">
            {overlayText}
          </span>
        </div>
      )}
    </div>
  );
}