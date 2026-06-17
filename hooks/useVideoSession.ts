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
  startCall:   (token: string, signalingUrl: string) => Promise<MediaStream>;
  disconnect?: () => Promise<void>;
  enableBackgroundBlur: ({ blurRadius, fps, modelSelection }: BlurOptions) => void;
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
  videoOff:     true,
  error:        null,
};

export function useVideoSession() {
  
  const [session, setSession] = useState<VideoSession>(initial);
  const [status, setStatus] = useState('Disconnected');
  

  const clientRef = useRef<MediaDanceClientInstance | null>(null);
  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const update = (patch: Partial<VideoSession>) =>
    setSession(prev => ({ ...prev, ...patch }));

  // Attach streams to video elements when both are ready
  // Attach local stream when ref becomes available
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
        clientRef.current.enableBackgroundBlur({ blurRadius: 20, fps: 24, modelSelection: 1 });
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

  function toggleVideo() {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      update({ videoOff: !session.videoOff });
    }
  }

  function expandFullscreen() { update({ view: 'fullscreen' }); }
  function collapseFullscreen() { update({ view: 'compact' }); }

  return {
    session,
    localStream,    
    remoteStream,   
    localVideoRef,
    remoteVideoRef,
    startSession,
    endSession,
    toggleMute,
    toggleVideo,
    expandFullscreen,
    collapseFullscreen,
  };
}