'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import PatientOnboardingFlow from '@/components/patient/PatientOnboardingFlow';
import { RemoteVideo } from '@/components/session/RemoteVideo';
import { WebRTCSafetyBoundary } from '@/components/WebRTCSafetyBoundary';
import { getBlurPreference } from '@/components/settings/VideoTab';

type GateState = 'loading' | 'too_early' | 'expired' | 'onboarding' | 'waiting' | 'session';

interface AppointmentData {
  id: string;
  patientName: string;
  patientEmail: string;
  startsAt: string;
  endsAt: string;
  paymentAmount: number | null;
  paymentStatus: string;
  consentSigned: boolean;
  roomId: string;
  provider: {
    name: string;
    credentials: string;
    specialty: string;
    licensed_states: string[];
  };
}

interface ShellProps {
  children: React.ReactNode;
  providerName?: string;
}

function Shell({ children, providerName }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-3">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold">IR</span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">InstaRoom</span>
          {providerName && (
            <span className="ml-auto text-[10px] text-[#7A9A7A] tracking-widest uppercase">{providerName}</span>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function PatientGatePage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [step, setStep] = useState<GateState>('loading');
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // WebRTC Stream States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Core Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const clientRef = useRef<any>(null);

  // Sync Local Video DOM element to Stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Sync Remote Video DOM element to Stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Fetch Session Meta Entry
  const fetchAppointment = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.status === 'too_early') {
        setStep('too_early');
        return;
      }
      if (data.status === 'expired') {
        setStep('expired');
        return;
      }

      setAppointment(data.appointment);
      setStep('onboarding');
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [roomId]);

  // Fail-Safe Stream Loader Hook
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
        console.warn('[Patient Gate] ⚠️ Warmup timed out after 5s. Forcing bypass...');
        isResolved = true;
        clientRef.current?.off('local-stream-ready', handleInitialStream);
        resolve();
      }, 5000);

      clientRef.current?.on('local-stream-ready', handleInitialStream);
    });
  };

  // Initialize and spin up MediaDance Signaling Pipeline
  const warmupSession = async (preFlightBlur: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}/guest-token`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const { MediaDanceClient } = await import('@mediadance/client-sdk');
      clientRef.current = new MediaDanceClient({ serverUrl: data.signalingUrl });
      
      // Initialize system tracks
      clientRef.current.initMedia();

      // Track bindings
      clientRef.current.on('local-stream-ready', (stream: MediaStream) => {
        setLocalStream(stream);
      });

      clientRef.current.on('blur-ready', (stream: MediaStream) => {
        console.log('[Patient Gate] Background blur track compiled cleanly.');
        setLocalStream(stream);
      });

      clientRef.current.on('remote-stream-ready', (stream: MediaStream) => {
        setStep('session'); // Shift UI view automatically once feed drops
        setRemoteStream(stream);
      });

      // Handle Blur Warmup execution on initialization
      if (preFlightBlur || getBlurPreference()) {
        clientRef.current.enableBackgroundBlur({ blurRadius: 20, fps: 24, modelSelection: 1 });
      }

      // Standby for media pipeline compilation stability
      await waitForStreamWithTimeout();

      // Secure Signaling Exchange handshake
      await clientRef.current.connectSignaling(data.token, data.signalingUrl);

      // Listen for clinician admit entry point
      clientRef.current.on('patient-admitted', async () => {
        clientRef.current?.joinRoom();
      });

      // Declare room presence context status to lobby
      clientRef.current.joinLobby();
    } catch (err: any) {
      console.error('[Patient SDK Level Error]', err.message);
      setError('Failed to establish media tunnel pipeline connection.');
    }
  };

  const handleOnboardingComplete = (blurSelection: boolean) => {
    setStep('waiting');
    warmupSession(blurSelection);
  };

  // State Routing Engine
  if (error) {
    return (
      <Shell providerName={appointment?.provider.name}>
        <div className="text-[11px] text-[#CC2200] font-mono">// error: {error}</div>
      </Shell>
    );
  }

  if (step === 'loading') {
    return (
      <Shell providerName={appointment?.provider.name}>
        <p className="text-[11px] text-[#7A9A7A] tracking-widest">loading session...</p>
      </Shell>
    );
  }

  if (step === 'too_early') {
    return (
      <Shell providerName={appointment?.provider.name}>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">// session not started</div>
        <div className="text-lg font-semibold text-[#1A2E1A] mb-2">You&apos;re a bit early</div>
        <p className="text-sm text-[#3D5C3D] font-mono">
          This link becomes active 10 minutes before your appointment. Check back soon.
        </p>
      </Shell>
    );
  }

  if (step === 'expired') {
    return (
      <Shell providerName={appointment?.provider.name}>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">// session ended</div>
        <div className="text-lg font-semibold text-[#1A2E1A] mb-2">This session has ended</div>
        <p className="text-sm text-[#3D5C3D] font-mono">Please contact your provider for a new appointment link.</p>
      </Shell>
    );
  }

  if (step === 'onboarding') {
    return (
      <PatientOnboardingFlow
        appointment={appointment}
        onComplete={handleOnboardingComplete}
        onError={(msg) => setError(msg)}
      />
    );
  }

  // Persistent Media Layout Stack (Prevents DOM unmount/re-mount deadlocks)
  return (
    <div className="fixed inset-0 bg-[#0C100C] flex flex-col">
      
      <div className="h-[44px] flex-shrink-0 flex items-center justify-between px-6 border-b border-[rgba(0,255,140,0.12)]">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF8C] animate-pulse" />
          <span className="text-xs tracking-widest text-[#E8F5E8] uppercase">
            {appointment?.provider.name}
          </span>
        </div>
      </div>

    {/* Guard the incoming provider track */}
      <WebRTCSafetyBoundary>
        <RemoteVideo stream={remoteStream} waitingText="Waiting on provider to start the session." />
      </WebRTCSafetyBoundary>

      {/* Guard the local PiP container independently */}
      {/* Local Feed Pipeline Display Picture-in-Picture (Always Mounted) */}
      <div className="absolute bottom-6 right-6 w-[160px] h-[120px] bg-[#141A14] border border-[rgba(0,255,140,0.15)] shadow-2xl z-50">
        <WebRTCSafetyBoundary>
          <video
            ref={localVideoRef}
            id="localVideo"
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </WebRTCSafetyBoundary>
      </div>

      {/* Controls */}
      {/* <div className="h-[60px] flex-shrink-0 flex items-center justify-center gap-4 border-t border-[rgba(0,255,140,0.12)]"> */}
      <div className="h-[64px] flex-shrink-0 flex items-center justify-center gap-4 border-t border-[rgba(0,255,140,0.12)]">
        <button
          onClick={() => {
            const track = localStream?.getAudioTracks()[0];
            if (track) track.enabled = !track.enabled;
          }}
          className="px-4 h-[32px] border border-[rgba(0,255,140,0.22)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#00FF8C] hover:text-[#00FF8C] transition-all"
        >
          mute
        </button>
        <button
          onClick={() => {
            const track = localStream?.getVideoTracks()[0];
            if (track) track.enabled = !track.enabled;
          }}
          className="px-4 h-[32px] border border-[rgba(0,255,140,0.22)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#00FF8C] hover:text-[#00FF8C] transition-all"
        >
          cam
        </button>
        <button
          onClick={async () => {
            try {
              await clientRef.current?.disconnect?.();
            } catch (_) {}
            clientRef.current = null;
            setLocalStream(null);
            setRemoteStream(null);
            // setStep('waiting');
          }}
          className="px-6 h-[32px] border border-[#CC2200] text-[10px] tracking-widest uppercase text-[#CC2200] hover:bg-[#CC2200] hover:text-[#F5F0E8] transition-all"
        >
          ✕ end
        </button>
      </div>
    </div>
  );
}