'use client';

import { useState, useRef, useEffect } from 'react';
import { getBlurPreference } from '@/components/settings/VideoTab';

export type PatientSessionStatus = 'idle' | 'warmup' | 'waiting' | 'active' | 'error';

export function usePatientVideoSession(roomId: string) {
  const [status, setStatus] = useState<PatientSessionStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Create a persistent reference to hold the SDK class once loaded
  const MediaDanceClientClassRef = useRef<any>(null);

  // 🚀 EAGER WARMUP: Preload the SDK and inject compilation targets instantly on mount
  useEffect(() => {
    async function preloadSDK() {
      try {
        const { MediaDanceClient } = await import('@mediadance/client-sdk');
        MediaDanceClientClassRef.current = MediaDanceClient;
        console.log('[Patient Hook] Core WebRTC & WASM SDK binaries preloaded safely.');
      } catch (err) {
        console.error('[Patient Hook] Failed to eager-load media engine assets:', err);
      }
    }
    preloadSDK();
  }, []);

  useEffect(() => {
    const videoEl = localVideoRef.current;
    if (!videoEl || !localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // 🚀 The Definitive Initialization Guard for Attempt 0
    const bindAndPlayStream = () => {
      if (videoEl.srcObject !== localStream) {
        console.log('[Patient Hook] Hardware track unmuted & live. Binding pipeline surface.');
        videoEl.srcObject = localStream;
        
        videoEl.play()
          .then(() => {
            console.log('[Patient Hook] Render committed successfully on Attempt 0:', videoEl.videoWidth, 'x', videoEl.videoHeight);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('[Patient Hook] Video layout stall:', err);
            }
          });
      }
    };

    // If the hardware track is already active and piping data, run instantly
    if (videoTrack.readyState === 'live' && !videoTrack.muted) {
      bindAndPlayStream();
    } else {
      // Otherwise, sit tight until the hardware finishes its wake-up sequence
      console.log('[Patient Hook] Hardware track warming up. Awaiting physical activation...');
      
      const handleTrackActivation = () => {
        console.log('[Patient Hook] Hardware signal received.');
        bindAndPlayStream();
        videoTrack.removeEventListener('unmute', handleTrackActivation);
      };

      videoTrack.addEventListener('unmute', handleTrackActivation);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const waitForStreamWithTimeout = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      let isResolved = false;
      const handleInitialStream = () => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(timeoutId);
        clientRef.current?.off('local-stream-ready', handleInitialStream);
        resolve();
      };

      const timeoutId = setTimeout(() => {
        if (isResolved) return;
        console.warn('[Patient Hook] ⚠️ MediaPipe warmup timed out. Forcing bypass...');
        isResolved = true;
        clientRef.current?.off('local-stream-ready', handleInitialStream);
        resolve();
      }, 5000);

      clientRef.current?.on('local-stream-ready', handleInitialStream);
    });
  };

  const warmupSession = async (preFlightBlur: boolean) => {
    try {
      setStatus('warmup');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}/guest-token`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Fallback if the eager-load hasn't completed yet
      if (!MediaDanceClientClassRef.current) {
        const { MediaDanceClient } = await import('@mediadance/client-sdk');
        MediaDanceClientClassRef.current = MediaDanceClient;
      }

      const ClientClass = MediaDanceClientClassRef.current;
      clientRef.current = new ClientClass({ serverUrl: data.signalingUrl });
      
      // Initialize system tracks
      clientRef.current.initMedia();
      // Inside your video session hook where events are registered

      // 1. Raw Stream Event Listener
      clientRef.current.on('local-stream-ready', (stream: MediaStream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      });

      // 2. Blur Stream Event Listener (Handles Attempt 0 cleanly)
      clientRef.current.on('blur-ready', (blurredStream: MediaStream) => {
        console.log('[Patient Hook] 🧠 MediaPipe Shader compiled on Attempt 0. Forcing track structural re-bind...');
        
        // Update state with a completely new stream instance to break React caching
        const freshStreamInstance = new MediaStream(blurredStream.getTracks());
        setLocalStream(freshStreamInstance);

        // 🔥 THE UI ATTEMPT 0 FIX: Directly update the raw DOM element's srcObject
        const videoElement = localVideoRef.current;
        if (videoElement) {
          videoElement.srcObject = freshStreamInstance;
          
          // Re-trigger playback. This instructs the browser layout engine 
          // to dynamically repaint the bound PiP context window seamlessly.
          videoElement.play()
            .then(() => {
              console.log('[Patient Hook] Re-bind verified. Video streaming updated.');
            })
            .catch((err) => {
              console.warn('[Patient Hook] Video playback re-trigger failed:', err);
            });
        }
      });

      clientRef.current.on('remote-stream-ready', (stream: MediaStream) => {
        setStatus('active');
        setRemoteStream(stream);
      });

      // Handle Background Blur toggle immediately on initialization
      if (preFlightBlur || getBlurPreference()) {
        clientRef.current.enableBackgroundBlur({ blurRadius: 20, fps: 24, modelSelection: 1 });
      }

      await clientRef.current.connectSignaling(data.token, data.signalingUrl);
      
      clientRef.current.on('patient-admitted', async () => {
        clientRef.current?.joinRoom();
      });

      clientRef.current.joinLobby();
      setStatus('waiting');

      await waitForStreamWithTimeout();

    } catch (err: any) {
      console.error('[Patient Hook Error]', err.message);
      setError('Failed to establish media tunnel pipeline connection.');
      setStatus('error');
    }
  };

  return {
    status,
    localStream,
    remoteStream,
    error,
    localVideoRef,
    remoteVideoRef,
    warmupSession
  };
}