'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CopayForm from '@/components/patient/CopayForm';

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
  on:          (event: string, handler: (...args: any[]) => void) => void;
  startCall:   (token: string, signalingUrl: string) => Promise<MediaStream>;
  disconnect?: () => Promise<void>;
  enableBackgroundBlur: ({ blurRadius, fps, modelSelection }: BlurOptions) => void;
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
  const videoRef = useState<HTMLVideoElement | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const clientRef = useRef<MediaDanceClientInstance | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const connectToSession = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}/guest-token`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const { MediaDanceClient } = await import('@mediadance/client-sdk');

      clientRef.current = new MediaDanceClient({ serverUrl: data.signalingUrl });

      clientRef.current.enableBackgroundBlur({
        blurRadius: 12,      // px — increase for heavier blur
        fps: 24,             // px — increase for heavier blur
        modelSelection: 1    // 1 = landscape model, better for desktop clinical 
      });

      clientRef.current.on('local-stream-ready', (stream: MediaStream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      });

      clientRef.current.on('remote-stream-ready', (stream: MediaStream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });

      await clientRef.current.startCall(data.token, data.signalingUrl);

    } catch (err: any) {
      console.error('[Patient SDK]', err.message);
    }
  };
  
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
  useEffect(() => {
    if (step !== 'waiting') return;

    
    const interval = setInterval(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/room/${roomId}`
      );
      const data = await res.json();
      
      console.log('[Patient Poll] full response:', data);
      console.log('[Patient Poll] appt status:', data.appointment?.status);
      console.log('[Patient Poll] top status:', data.status);

      if (data.appointment?.status === 'in_session') {
        clearInterval(interval);
        setStep('session');
        connectToSession();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step]);


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
      setLocalStream(stream);
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
      <div className="text-lg font-semibold text-[#1A2E1A] mb-2">Camera + microphone</div>
      <p className="text-sm text-[#7A9A7A] font-mono mb-6">
        We&apos;ll ask for camera and microphone access. Your camera starts OFF during the session.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[11px] text-[#7A9A7A] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007A40]" />
          Camera starts OFF by default — your privacy first
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#7A9A7A] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007A40]" />
          You control when to turn it on
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
              onSuccess={() => setStep('waiting')}
            />
          </Elements>
        )}
      </Shell>
  );

  // ── Waiting room ─────────────────────────────────────────────────────
  if (step === 'waiting') return (
    <Shell providerName={appointment?.provider.name}>
      <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">waiting room</div>
      <div className="text-lg font-semibold text-[#1A2E1A] mb-2">
        You are all set
      </div>
      <p className="text-sm text-[#3D5C3D] font-mono mb-6">
        <span className="text-[#007A40]">{appointment?.provider.name}</span> will be with you shortly.
        Please keep this window open.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] text-[#007A40] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
          connected to waiting room
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#7A9A7A] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7A9A7A]" />
          waiting for provider to start session
        </div>
      </div>
    </Shell>
  );

  if (step === 'session') return (
    <div className="fixed inset-0 bg-[#0C100C] flex flex-col">
      {/* Remote stream — full screen */}
      <div className="flex-1 relative min-h-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[11px] text-[#3D5C3D] tracking-widest uppercase">
              connecting to provider...
            </p>
          </div>
        )}

        {/* Local PiP — top right */}
        <div className="absolute top-4 right-4 w-[180px] h-[120px] border border-[rgba(0,255,140,0.22)] bg-[#0C100C] overflow-hidden"
          style={{ transform: 'scaleX(-1)' }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
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
          onClick={() => {
            clientRef.current?.disconnect();
            setStep('waiting');
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