'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BlurOptions } from '@/packages/mediadance-sdk/dist/processors/BackgroundBlurProcessor';

export type PatientSessionStatus = 'idle' | 'warmup' | 'waiting' | 'active' | 'error';

export function usePatientVideoSession(roomId: string) {
  const [status, setStatus] = useState<PatientSessionStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const [client, setClient] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const enableBlur = useCallback(async (options: BlurOptions = {}) => {
    if (!client) {
      console.warn('[Patient Hook] Attempted to enable blur, but the client is not initialized.');
      return null;
    }
    return await client.enableBackgroundBlur(options);
  }, [client]);

  const disableBlur = useCallback(async () => {
    if (!client) return null;
    return await client.disableBackgroundBlur();
  }, [client]);
  
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
    console.log('[Patient Hook] Attempting to bind local stream to video element:', videoTrack);
    if (!videoTrack) {
      console.error('[Patient Hook] No valid video track found.');
      return;
    }

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

  async function endSession() {
   
    try {
      await clientRef.current?.disconnect?.();
    } catch (_) {}
    setLocalStream(null);
    setRemoteStream(null);
    clientRef.current = null;
    // setTimeout(() => setSession(initial), 500);
  }

  /**
   * Warms up the video session with optional pre-flight blur
   * @param preFlightBlur 
   */
  const warmupSession = async () => {
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

      clientRef.current.initMedia();
      setClient(clientRef.current);
        
      // Inside your video session hook where events are registered

      // 1. Raw Stream Event Listener
      clientRef.current.on('local-stream-ready', (stream: MediaStream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      });

      clientRef.current.on('blur-ready', (blurredStream: MediaStream | null) => {
        if (!blurredStream) {
          console.warn('[Patient Hook] Received null stream from blur-ready event. Pipeline may still be warm-starting.');
          return;
        }

        console.log('[Patient Hook] 🧠 MediaPipe Shader compiled on Attempt 0. Forcing track structural re-bind...');
        
        // Directly bind the new stream to the local video ref if it exists
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = blurredStream;
        }
        
        // Keep your state clean without creating a brand new container instance
        setLocalStream(blurredStream);
      });

      clientRef.current.on('remote-stream-ready', (stream: MediaStream) => {
        setStatus('active');
        setRemoteStream(stream);
      });

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
    enableBlur,
    disableBlur,
    status,
    localStream,
    remoteStream,
    error,
    localVideoRef,
    remoteVideoRef,
    warmupSession,
    endSession,
  };
}