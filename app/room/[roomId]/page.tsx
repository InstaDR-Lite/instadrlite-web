'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CopayForm from '@/components/patient/CopayForm';
import { RemoteVideo } from '@/components/session/RemoteVideo';
import { BlurOptions } from '@/packages/mediadance-sdk/dist/processors/BackgroundBlurProcessor';
import { WebRTCSafetyBoundary } from '@/components/WebRTCSafetyBoundary';
import { EventCallback } from '@/packages/mediadance-sdk/dist/utils/EventEmitter';
import { getBlurPreference } from '@/components/settings/VideoTab';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Add 'session' to GateStep type
type GateStep = 'loading' | 'too_early' | 'expired' | 'name' | 'consent' | 'camera' | 'geo' | 'copay' | 'waiting' | 'session';

const STATE_MAP: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY'
};

interface AppointmentData {
  id:            string;
  patientName:   string;
  patientEmail:  string;
  startsAt:      string;
  endsAt:        string;
  paymentAmount: number | null;
  paymentStatus: string;
  consentSigned: boolean;
  roomId:        string;
  provider: {
    name:            string;
    credentials:     string;
    specialty:       string;
    licensed_states: string[];
  };
}

interface MediaDanceClientInstance {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off:         (event: string, handler: EventCallback) => void; // 👈 Add this line
  startCall:   (token: string, signalingUrl: string) => Promise<MediaStream | null>;
  disconnect?: () => void;
  enableBackgroundBlur: ({ blurRadius, fps, modelSelection }: BlurOptions) => void;
  activateAndPublishMedia: (enableBlur: boolean) => Promise<MediaStream | null>;
  initMedia(): Promise<MediaStream>;
  connectSignaling(token?: string, signalingUrl?: string): Promise<void>;
  joinRoom(): void;
  joinLobby(): void;
}

// ── Shared layout wrapper — OUTSIDE the page component ──────────────
interface ShellProps {
  children: React.ReactNode;
  providerName?: string;
}

function Shell({
  children,
  providerName
}: ShellProps) {
  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-3">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold">IR</span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">
            InstaRoom
          </span>
          {providerName && (
            <span className="ml-auto text-[10px] text-[#7A9A7A] tracking-widest uppercase">
              {providerName}
            </span>
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

  const [step, setStep] = useState<GateStep>('loading');
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [geoState, setGeoState] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const clientRef = useRef<MediaDanceClientInstance | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [blurEnabled, setBlurEnabled] = useState<boolean>(false);

  // In your root layout or early in the page lifecycle
  // Before any session starts — just load the WASM, don't run segmentation
  

   useEffect(() => {
    console.log('[Patient Gate] localStream useEffect fired', {
      hasRef: !!localVideoRef.current,
      hasStream: !!localStream,
    });
    if (localVideoRef.current && localStream) {
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

  
  // Remove polling, call warmupMedia() after prechecks

  const waitForStreamWithTimeout = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      let isResolved = false;

      const handleInitialStream = () => {
        if (isResolved) return;
        console.log('[Patient Gate] Local stream active. Cleaning up listener...');
        isResolved = true;
        clearTimeout(timeoutId);
        clientRef.current?.off('local-stream-ready', handleInitialStream);
        resolve();
      };

      const timeoutId = setTimeout(() => {
        if (isResolved) return;
        console.warn('[Patient Gate] ⚠️ Warmup timed out after 5s. Bypassing...');
        isResolved = true;
        clientRef.current?.off('local-stream-ready', handleInitialStream);
        resolve();
      }, 5000);

      clientRef.current?.on('local-stream-ready', handleInitialStream);
    });
  };
  
  // Called after prechecks complete — Phase 1 + 2
  const warmupSession = async () => {
    console.log('[Patient Gate] warmupSession fired, current step:', step);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}/guest-token`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const { MediaDanceClient } = await import('@mediadance/client-sdk');
      clientRef.current = new MediaDanceClient({ serverUrl: data.signalingUrl });
      
      clientRef.current.initMedia();

      // UI listeners
      clientRef.current.on('local-stream-ready', (stream: MediaStream) => {
        console.log('[Patient Gate] local-stream-ready — ref null?', !localVideoRef.current);
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      });
      
      clientRef.current.on('blur-ready', (stream: MediaStream) => {
        console.log('[Patient Gate] blur-ready received');
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      });

      // // Enable blur
      if (getBlurPreference()) {
        clientRef.current.enableBackgroundBlur({ blurRadius: 20, fps: 24, modelSelection: 1 });
      }

      clientRef.current.on('remote-stream-ready', (stream: MediaStream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });


      // Armed hook — wait for media + blur ready
      await waitForStreamWithTimeout();

      // Phase 2 — signaling only, no join-room yet
      await clientRef.current.connectSignaling(data.token, data.signalingUrl);

      clientRef.current.off('patient-admitted', () => { });

      // Listen for admit — triggers Phase 4
      clientRef.current.on('patient-admitted', async () => {
        console.log('[Patient Gate] Admitted — joining room...');
        clientRef.current?.joinRoom();
      });
      
      // 3. Tell the backend a patient is in the lobby
      clientRef.current.joinLobby();
      console.log('[Patient Gate] Warmed up. Waiting for admit...');

    } catch (err: any) {
      console.error('[Patient SDK Level Error]', err.message);
    }
  };

    useEffect(() => {
    if (step === 'waiting') {
      console.log('[Patient Gate] Step is waiting — starting warmup');
      warmupSession();
    }
    }, [step]);
  
  // const connectToSession = async () => {
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}/guest-token`,
  //       { method: 'POST' }
  //     );
  //     const data = await res.json();
  //     if (!data.success) throw new Error(data.error);

  //     const { MediaDanceClient } = await import('@mediadance/client-sdk');
  //     clientRef.current = new MediaDanceClient({ serverUrl: data.signalingUrl });

  //     // 1. Setup the standard UI stream display listeners
  //     clientRef.current.on('local-stream-ready', (stream: MediaStream) => {
  //       setLocalStream(stream);
  //       if (localVideoRef.current) localVideoRef.current.srcObject = stream;
  //     });

  //     // 3. Kick off the asynchronous camera initialization inside a safe try/catch
      
  //     // try {
  //     //   clientRef.current.enableBackgroundBlur({
  //     //     blurRadius: 20,
  //     //     fps: 24,
  //     //     modelSelection: 1,
  //     //   });
  //     // } catch (blurError) {
  //     //   console.error('[Patient Gate] Synchronous error inside enableBackgroundBlur:', blurError);
  //     // }


  //     clientRef.current.on('remote-stream-ready', (stream: MediaStream) => {
  //       setRemoteStream(stream);
  //       if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
  //     });

  //     // 2. 🔥 ARMED HOOK WITH FAIL-SAFE TIMEOUT
  //     console.log('[Patient Gate] Setting up media warmup hook...');
      
  //     const waitForStreamWithTimeout = new Promise<void>((resolve) => {
  //       let isResolved = false;

  //       const handleInitialStream = () => {
  //         if (isResolved) return;
  //         console.log('[Patient Gate] Local stream active. Cleaning up listener...');
  //         isResolved = true;
  //         clearTimeout(timeoutId); 
  //         clientRef.current?.off('local-stream-ready', handleInitialStream);
  //         resolve();
  //       };

  //       // Safety net: Bypass the hang if the background engine takes longer than 5 seconds
  //       const timeoutId = setTimeout(() => {
  //         if (isResolved) return;
  //         console.warn('[Patient Gate] ⚠️ Warmup timed out after 5s. Bypassing deadlock to force connection...');
  //         isResolved = true;
  //         clientRef.current?.off('local-stream-ready', handleInitialStream);
  //         resolve(); // Resolves the promise to unblock startCall
  //       }, 5000);

  //       clientRef.current?.on('local-stream-ready', handleInitialStream);

  //     });

      
  //     // 4. Await the race
  //     // await waitForStreamWithTimeout;

  //     // 5. Fire signaling handshake!
  //     console.log('[Patient Gate] Advancing to startCall...');
  //     await clientRef.current.startCall(data.token, data.signalingUrl);

  //   } catch (err: any) {
  //     console.error('[Patient SDK Level Error]', err.message);
  //   }
  // };
  
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
      setStep('name');

    } catch (err: any) {
      setError(err.message);
    }
  };


  const initCopayStep = async () => {
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/payment-intent`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ appointmentId: appointment?.id })
    });
    const data = await res.json();
    setClientSecret(data.clientSecret);
    setStep('copay');
  };

  useEffect(() => {
    fetchAppointment();
  }, [roomId]);

  // Poll for session start
  // useEffect(() => {
  //   if (step !== 'waiting') return;

    
  //   const interval = setInterval(async () => {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}`
  //     );
  //     const data = await res.json();

  //     if (data.appointment?.status === 'in_session') {
  //       clearInterval(interval);
  //       setStep('session');
  //       connectToSession();
  //     }
  //   }, 3000);

  //   return () => clearInterval(interval);
  // }, [step]);


  /**
   * Handles geolocation verification by:
   * 1. Requesting user's location
   * 2. Reverse geocoding to get state
   * 3. Checking if state is in provider's licensed states
   * 4. Updating appointment geo status on backend
   * 5. Moving to next step regardless of outcome
   * @returns 
   */
  const handleGeoVerify = () => {
    if (!navigator.geolocation) {
      setGeoStatus('failed');
      setStep('copay');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get state
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();

          const state = data.address?.state_code || data.address?.state;
          const stateAbbr = STATE_MAP[state as string] || state;
          const licensed = appointment?.provider.licensed_states || [];
          const verified = licensed.some(s =>
            s.toUpperCase() === stateAbbr?.toUpperCase()
          );

          setGeoState(`${state} (${stateAbbr})`);
          setGeoStatus(verified ? 'verified' : 'failed');

          // Update appointment geo status
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointment?.id}/geo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verified, state })
          });

          // In handleGeoVerify — before setStep('waiting')
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointment?.id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ready' })
          });

        } catch {
          setGeoStatus('failed');
        }

        // Continue to next step regardless
        setTimeout(async () => {
          const needsCopay = appointment?.paymentAmount &&
            appointment?.paymentStatus !== 'paid';
          if (needsCopay) {
            await initCopayStep();
          } else {
            setStep('waiting');
            // warmupSession();
          }
        }, 1500);
      },
      () => {
        setGeoStatus('failed');
        setTimeout(() => setStep('waiting'), 1500);
      }
    );
  };

  const handleCameraCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // 1. Assign the raw stream to your local state
      setLocalStream(stream);

      // 2. 🔥 EARLY WARMUP: If they enabled blur, spin it up right now
      if (blurEnabled && clientRef.current) {
        console.log('[Patient Gate] Pre-flight blur option selected. Warming up MediaPipe pipeline...');
        
        // Update the configuration flag on your client instance
        clientRef.current.enableBackgroundBlur({
            blurRadius: 20,
            fps: 24,
            modelSelection: 1,
          });
      
      // // Explicitly kick off the processor loop so it compiles WebGL shaders
      // // while the user is looking at the geo-verification screen.
      // if (clientRef.current.media) {
      //   clientRef.current.media.captureLocalStream()
      //     .then((rawStream) => {
      //        console.log('[Patient Gate] MediaPipe background assets armed.');
      //     })
      //     .catch((err) => {
      //        console.error('[Patient Gate] Early blur compilation failed:', err);
      //     });
      // }
    }

    // 3. Move cleanly down the onboarding timeline
    setStep('geo');
    handleGeoVerify();
  } catch {
    setError('Camera/microphone access denied. Please allow access and try again.');
  }
};

  const handleConsent = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointment?.id}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signed: true })
    });
    setStep('camera');
  };


  // ── Loading ──────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <Shell providerName={appointment?.provider.name}>
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">loading session...</p>
    </Shell>
  );

  // ── Too early ────────────────────────────────────────────────────────
  if (step === 'too_early') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">// session not started</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-2">You're a bit early</div>
      <p className="text-sm text-[#3D5C3D] font-mono">
        This link becomes active 10 minutes before your appointment. Check back soon.
      </p>
    </Shell>
  );

  // ── Expired ──────────────────────────────────────────────────────────
  if (step === 'expired') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">// session ended</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-2">This session has ended</div>
      <p className="text-sm text-[#3D5C3D] font-mono">
        Please contact your provider for a new appointment link.
      </p>
    </Shell>
  );

  // ── Error ────────────────────────────────────────────────────────────
  if (error) return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[11px] text-[#CC2200] font-mono">// error: {error}</div>
    </Shell>
  );

  // ── Step 1: Name confirmation ────────────────────────────────────────
  if (step === 'name') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// step 1 of 4</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-1">Confirm your identity</div>
      <p className="text-sm text-[#7A9A7A] font-mono mb-6">
        You have an appointment with{' '}
        <span className="text-[#007A40]">{appointment?.provider.name}, {appointment?.provider.credentials}</span>
      </p>

      <div className="flex flex-col gap-3">
        <div className="p-3 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">patient name</div>
          <div className="text-sm font-semibold text-[#1A2E1A]">{appointment?.patientName}</div>
        </div>
        <div className="text-[11px] text-[#7A9A7A] font-mono">
          {new Date(appointment?.startsAt || '').toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric'
          })} at{' '}
          {new Date(appointment?.startsAt || '').toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
        <button
          onClick={() => setStep('consent')}
          className="w-full py-3 border border-[#007A40] text-xs tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8] transition-all"
        >
          [ that&apos;s me → ]
        </button>
      </div>
    </Shell>
  );

  // ── Step 2: Consent ──────────────────────────────────────────────────
  if (step === 'consent') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// step 2 of 4</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-4">Consent to treatment</div>

      <div className="p-4 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-xs text-[#3D5C3D] font-mono leading-relaxed mb-4 max-h-[200px] overflow-y-auto">
        <p className="mb-2">I consent to receive telehealth services from {appointment?.provider.name}.</p>
        <p className="mb-2">I understand that telehealth involves electronic communication of my personal medical information.</p>
        <p className="mb-2">I understand I have the right to withhold or withdraw consent at any time.</p>
        <p className="mb-2">I confirm I am in a safe, private location for this session.</p>
        <p>I understand that technical difficulties may interrupt the session.</p>
      </div>

      <label className="flex items-start gap-3 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={e => setConsentChecked(e.target.checked)}
          className="mt-0.5 accent-[#007A40]"
        />
        <span className="text-[11px] text-[#3D5C3D] font-mono">
          I have read and agree to the above consent to telehealth treatment
        </span>
      </label>

      <button
        onClick={handleConsent}
        disabled={!consentChecked}
        className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${consentChecked
            ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
            : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
          }`}
      >
        [ sign and continue → ]
      </button>
    </Shell>
  );

  // ── Step 3: Camera check ─────────────────────────────────────────────

  if (step === 'camera') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// step 3 of 4</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-2">Camera + privacy controls</div>
      <p className="text-sm text-[#7A9A7A] font-mono mb-6">
        Configure your hardware permissions and video privacy options before joining the waiting room.
      </p>

      <div className="flex flex-col gap-4">
        {/* PRIVACY SELECTION MATRIX */}
        <div className="border border-dashed border-[#7A9A7A]/30 p-3 bg-[#1A2E1A]/5 rounded-sm flex flex-col gap-2">
          <div className="text-[10px] text-[#007A40] font-mono tracking-wider uppercase mb-1">
            [ OPTIONAL: PRE-FLIGHT PRIVACY ]
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-[#1A2E1A]">
            <input 
              type="checkbox"
              checked={blurEnabled} // Tie this to your component's state variable
              onChange={(e) => setBlurEnabled(e.target.checked)}
              className="accent-[#007A40] w-3.5 h-3.5"
            />
            ✨ Enable surgical background blur immediately
          </label>
          <div className="text-[10px] text-[#7A9A7A] font-mono pl-6.5">
            Warms up the privacy engine locally to mask your surroundings before you connect.
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2 text-[11px] text-[#7A9A7A] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007A40]" />
            Camera initializes safely based on your preference
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#7A9A7A] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007A40]" />
            Zero platform telemetry or video data ever leaves your device
          </div>
        </div>

        <button
          onClick={handleCameraCheck}
          className="w-full py-3 border border-[#007A40] text-xs tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8] transition-all mt-2"
        >
          [ allow camera + mic → ]
        </button>
      </div>
    </Shell>
  );

  // ── Step 4: Geo verify ───────────────────────────────────────────────
  if (step === 'geo') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// step 4 of 4</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-4">Verifying location</div>

      <div className="flex flex-col gap-3">
        <div className={`flex items-center gap-2 text-[11px] font-mono ${geoStatus === 'pending' ? 'text-[#7A9A7A]' :
            geoStatus === 'verified' ? 'text-[#007A40]' : 'text-[#CC2200]'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${geoStatus === 'pending' ? 'bg-[#7A9A7A] animate-pulse' :
              geoStatus === 'verified' ? 'bg-[#007A40]' : 'bg-[#CC2200]'
            }`} />
          {geoStatus === 'pending' && '// verifying location...'}
          {geoStatus === 'verified' && `✓ Location verified — ${geoState}`}
          {geoStatus === 'failed' && `⚠ Location outside licensed states`}
        </div>

        {geoStatus === 'failed' && (
          <p className="text-[11px] text-[#7A9A7A] font-mono">
            Your provider has been notified. Your session may still proceed at their discretion.
          </p>
        )}
      </div>
    </Shell>
    );

    if (step === 'copay') return (
      <Shell providerName={appointment?.provider.name}>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
          copay required
        </div>
        <div className="text-lg font-semibold text-[#1A2E1A] mb-2">Session fee</div>
        <p className="text-sm text-[#7A9A7A] font-mono mb-6">
          A copay of{' '}
          <span className="text-[#007A40]">${appointment?.paymentAmount}</span>
          {' '}is required before your session.
        </p>
        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: 'flat' } }}
          >
            <CopayForm
              paymentAmount={Number(appointment?.paymentAmount)}
              onSuccess={() => {
                setStep('waiting');
                // warmupSession();
              }
            }
            />
          </Elements>
        )}
      </Shell>
  );

  // ── Waiting room ─────────────────────────────────────────────────────
  // if (step === 'waiting') return (
  //   <Shell providerName={appointment?.provider.name}>
  //     <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">waiting room</div>
  //     <div className="text-lg font-semibold text-[#1A2E1A] mb-2">
  //       You are all set
  //     </div>
  //     <p className="text-sm text-[#3D5C3D] font-mono mb-6">
  //       <span className="text-[#007A40]">{appointment?.provider.name}</span> will be with you shortly.
  //       Please keep this window open.
  //     </p>

  //     <div className="flex flex-col gap-2">
  //       <div className="flex items-center gap-2 text-[11px] text-[#007A40] font-mono">
  //         <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
  //         connected to waiting room
  //       </div>
  //       <div className="flex items-center gap-2 text-[11px] text-[#7A9A7A] font-mono">
  //         <span className="w-1.5 h-1.5 rounded-full bg-[#7A9A7A]" />
  //         waiting for provider to start session
  //       </div>
  //     </div>
  //   </Shell>
  // );

  if (step === 'waiting' || step === 'session') return (
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
      <WebRTCSafetyBoundary
        fallbackFallback={
          <div className="absolute top-[64px] right-4 w-[180px] h-[120px] border border-emerald-500/30 bg-[#0C100C] flex items-center justify-center">
            <span className="text-[10px] text-emerald-400 font-mono">CAM_RECOVERING</span>
          </div>
        }
      >
        <div 
          className="absolute top-[64px] right-4 w-[180px] h-[120px] border border-[rgba(0,255,140,0.22)] bg-[#0C100C] overflow-hidden"
          style={{ transform: 'scaleX(-1)' }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </WebRTCSafetyBoundary>

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

  return null;
}