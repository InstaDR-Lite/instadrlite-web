'use client';

import { BlurOptions } from '@/packages/mediadance-sdk/dist/processors/BackgroundBlurProcessor';
import { useState, useRef, useEffect } from 'react';
import { getBlurPreference } from '@/components/settings/VideoTab';

// import {  MediaDanceError } from '@mediadance/client-sdk';

// Remove the import and define locally:
interface MediaDanceError {
  message:  string;
  code?:    string;
  severity?: string;
}

interface MediaDanceClientInstance {
  on:          (event: string, handler: (...args: any[]) => void) => void;
  startCall:   (token: string, signalingUrl: string) => Promise<MediaStream | null>;
  disconnect?: () => void;
  enableBackgroundBlur: ({ blurRadius, fps, modelSelection }: BlurOptions) => void;
  // activateAndPublishMedia: (enableBlur: boolean) => Promise<MediaStream | null>;
  admitPatient(): void;
}


export type SessionStatus =
| 'idle'
| 'requesting_token'
| 'connecting'
| 'local_only'
| 'active'
| 'ending'
| 'ended'
| 'error';

export interface VideoSession {
  status:       SessionStatus;
  localStream:  MediaStream | null;
  remoteStream: MediaStream | null;
  view:         'compact' | 'fullscreen';
  localMuted:   boolean;
  videoOff:     boolean;
  error:        string | null;
}

const initial: VideoSession = {
  status:       'idle',
  localStream:  null,
  remoteStream: null,
  view:         'compact',
  localMuted:   false,
  videoOff:      true,
  error:        null,
};

export function useVideoSession() {
  
  const [session, setSession] = useState<VideoSession>(initial);
  const clientRef = useRef<MediaDanceClientInstance | null>(null);
  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const isBlurActiveRef = useRef(false);

  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const update = (patch: Partial<VideoSession>) => setSession(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('[Debug] useEffect attaching local stream');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream when ref becomes available  
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('[Debug] useEffect attaching remote stream');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 2. Clear click handler
  const handleAdmitClick = () => {
    console.log('[Debug] Admitting patient ...');
    clientRef.current?.admitPatient();
  };

  async function requestToken(roomId: string): Promise<{ token: string; signalingUrl: string }> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/token`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role: 'host' }),
        credentials: 'include'  // ← add this
      },
    );
    const data = await res.json();
    // console.log('[Debug] Token response:', data);
    return { token: data.token, signalingUrl: data.signalingUrl };
  }

  async function startSession(roomId: string, skipCompact = false) {
    try {
      update({ status: 'requesting_token', view: skipCompact ? 'fullscreen' : 'compact' });
      const { token, signalingUrl } = await requestToken(roomId);
      
      // Update appointment status to in_session
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}/status`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ status: 'in_session' })
      });
      
      // After the status update fetch
      console.log('[Debug] Updated status to in_session for room:', roomId);
      
      // Create MediaDance client
      const { MediaDanceClient } = await import('@mediadance/client-sdk');
      clientRef.current = new MediaDanceClient({
        serverUrl: signalingUrl
      });

      // enable/diable blur base on system settings
      if (getBlurPreference()) {
        console.log('[Provider hook] Enabling background blur based on system preference');
        clientRef.current.enableBackgroundBlur({
          blurRadius: 20,
          fps: 24,
          modelSelection: 1
        });
      }

      // Register events immediately after creation
     clientRef.current?.on('local-stream-ready', (stream: MediaStream) => {
        // Start with camera OFF
        stream.getVideoTracks().forEach(track => { track.enabled = false; });
        
        setLocalStream(stream);
        update({ status: 'local_only', videoOff: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
     });
    
    clientRef.current.on('blur-ready', (blurredStream: MediaStream | null) => {
      if (!blurredStream) {
        console.warn('[Provider hook] Received null stream from blur-ready event. Pipeline may still be warm-starting.');
        return;
      }

      console.log('[Provider hook] 🧠 MediaPipe Shader compiled on Attempt 0. Forcing track structural re-bind...');
      
      // Directly bind the new stream to the local video ref if it exists
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = blurredStream;
      }
      
      // Keep your state clean without creating a brand new container instance
      setLocalStream(blurredStream);
    });
      
    clientRef.current.on('blurready', (blurredStream: MediaStream) => {
      console.log('[Provider hook] 🧠 MediaPipe Shader compiled on Attempt 0. Forcing track structural re-bind...');
      
      // Update state with a completely new stream instance to break React caching
      const freshStreamInstance = new MediaStream(blurredStream.getTracks());
      setLocalStream(freshStreamInstance);
        
        // const videoTracks = freshStreamInstance.getVideoTracks();
        // if (videoTracks.length > 0) {
        //   videoTracks.forEach((track, index) => {
        //     console.log(`--- Track [${index}] Diagnostics ---`);
        //     console.log("ID:", track.id);
        //     console.log("Label (Camera Name):", track.label);
        //     console.log("ReadyState:", track.readyState); // Expected: "live" (if "ended", the track is dead)
        //     console.log("Enabled:", track.enabled);       // Expected: true (if false, it outputs black frames)
        //     console.log("Muted:", track.muted);           // Expected: false (if true, the browser/hardware muted it)
            
        //     // Check constraints currently applied by MediaPipe/Browser
        //     console.log("Constraints:", track.getConstraints());
        //     console.log("Settings:", track.getSettings());
        //   });
        // } else {
        //   console.error("❌ No video tracks found in this stream instance!");
        // }

        // 🔥 THE UI ATTEMPT 0 FIX: Directly update the raw DOM element's srcObject
        // const videoElement = localVideoRef.current;
        // if (videoElement) {
        //   videoElement.srcObject = freshStreamInstance;
          
        //   // Re-trigger playback. This instructs the browser layout engine 
        //   // to dynamically repaint the bound PiP context window seamlessly.
        //   videoElement.play()
        //     .then(() => {
        //       console.log('[Provider hook] Re-bind verified. Video streaming updated.');
        //     })
        //     .catch((err) => {
        //       console.warn('[Provider hook] Video playback re-trigger failed:', err);
        //     });
        // }
      });
  
      clientRef.current?.on('peer-joined', (data) => {
        console.log('[Provider hook] peer-joined received, initiating offer', data);
      });

      clientRef.current?.on('remote-stream-ready', (stream: MediaStream) => {
        console.log('[Debug] remote-stream-ready fired');
        setRemoteStream(stream);
        update({ status: 'active' });
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      clientRef.current?.on('status-update', (msg: string) => {
        console.log('[MediaDance]', msg);
      });

      clientRef.current?.on('error', (err: MediaDanceError) => {
        if (err.severity === 'FATAL') {
          update({ status: 'error', error: err.message });
        }
      });

      // Start call AFTER events registered
      await clientRef.current?.startCall(token, signalingUrl);

    } catch (err: any) {
      update({ status: 'error', error: err.message });
    }
  }

  async function endSession() {
    update({ status: 'ending' });
    try {
      await clientRef.current?.disconnect?.();
    } catch (_) {}
    setLocalStream(null);
    setRemoteStream(null);
    clientRef.current = null;
    setTimeout(() => setSession(initial), 500);
  }

  function toggleMute() {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      update({ localMuted: !session.localMuted });
    }
  }

  const toggleVideoOrig = async () => {
    // 1. Grab the stream that was already created during startCall
    const rawStream = localStream; 
    if (!rawStream) return;

    // 2. Simply flip the hardware track state directly without touching the SDK connection
    const videoTrack = rawStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      console.log(`[Debug] Video track hardware toggled to: ${videoTrack.enabled}`);
      
      // 3. Force React to trigger its layout rendering effect by passing a shallow copy
      setLocalStream(new MediaStream(rawStream.getTracks()));
    }

    // enable/diable blur base on system settings
    if (getBlurPreference()) {
      console.log('[Provider hook] Enabling background blur based on system preference');
        
      clientRef.current?.enableBackgroundBlur({
        blurRadius: 20,
        fps: 24,
        modelSelection: 1
      });
    }
    
    // Force explicit state: Video is no longer off
    update({ videoOff: false });
  };

  const toggleVideo = async () => {
    const rawStream = localStream; 
    if (!rawStream) return;

    const videoTrack = rawStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // 1. Flip the hardware state directly
    videoTrack.enabled = !videoTrack.enabled;
    console.log(`[Debug] Video track hardware toggled to: ${videoTrack.enabled}`);
    
    // 2. Only invoke the blur engine if video is being turned ON and blur is preferred
    if (videoTrack.enabled && getBlurPreference()) {
      // Check an internal ref or SDK state to make sure we don't double-initialize
      if (!isBlurActiveRef.current) {
        console.log('[Provider hook] Initializing background blur pipeline on camera wake.');
        
        await clientRef.current?.enableBackgroundBlur({
          blurRadius: 20,
          fps: 24,
          modelSelection: 1
        });
        
        isBlurActiveRef.current = true;
        
        // 🚀 Fix local PiP: update local video element to point to the processed output stream
        // if (clientRef.current?.media?.localOutputStream && localVideoRef.current) {
        //   localVideoRef.current.srcObject = clientRef.current.media.localOutputStream;
        // }
      }
    } else if (!videoTrack.enabled) {
      // Optional: If camera is off, you can choose to cleanly dismantle the pipeline 
      // or let it idle depending on how your MediaDance SDK handles disabled tracks.
      console.log('[Provider hook] Camera muted; passing idle states.');
    }

    // Update signaling state
    update({ videoOff: !videoTrack.enabled });
  };
  

  function expandFullscreen() { update({ view: 'fullscreen' }); }
  function collapseFullscreen() { update({ view: 'compact' }); }

  return {
    session,
    localStream,    
    remoteStream,   
    localVideoRef,
    remoteVideoRef,
    startSession,
    handleAdmitClick,
    endSession,
    toggleMute,
    toggleVideo,
    expandFullscreen,
    collapseFullscreen,
  };
}