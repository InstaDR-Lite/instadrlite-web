'use client';

import { useState, useRef, useEffect } from 'react';

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
  videoOff:     false,
  error:        null,
};

export function useVideoSession() {
  const [session, setSession] = useState<VideoSession>(initial);
  // const clientRef = useRef<any>(null);

  const update = (patch: Partial<VideoSession>) =>
    setSession(prev => ({ ...prev, ...patch }));

  async function requestToken(roomId: string): Promise<string> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/token`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role: 'host' })
      }
    );
    const data = await res.json();
    return data.token;
  }

  async function startSession(roomId: string) {
    try {
      update({ status: 'requesting_token' });
      const token = await requestToken(roomId);

      update({ status: 'connecting' });

      // SDK connect — wire MediaDance SDK here
      // clientRef.current = new MediaDanceClient();
      // clientRef.current.on('local-stream-ready', (stream) => {
      //   update({ status: 'local_only', localStream: stream });
      // });
      // clientRef.current.on('stream-added', (stream) => {
      //   update({ status: 'active', remoteStream: stream });
      // });
      // clientRef.current.on('connection-failed', () => {
      //   update({ status: 'error', error: 'Connection lost' });
      // });
      // await clientRef.current.startCall(token);

      // Mock for now — remove when SDK wired
      setTimeout(() => update({ status: 'local_only', localStream: null }), 1000);

    } catch (err: any) {
      update({ status: 'error', error: err.message });
    }
  }

  async function endSession() {
    update({ status: 'ending' });
    // clientRef.current?.disconnect();
    setTimeout(() => setSession(initial), 1000);
  }

  function toggleMute() {
    update({ localMuted: !session.localMuted });
  }

  function toggleVideo() {
    update({ videoOff: !session.videoOff });
  }

  function expandFullscreen() {
    update({ view: 'fullscreen' });
  }

  function collapseFullscreen() {
    update({ view: 'compact' });
  }

  return {
    session,
    startSession,
    endSession,
    toggleMute,
    toggleVideo,
    expandFullscreen,
    collapseFullscreen,
  };
}