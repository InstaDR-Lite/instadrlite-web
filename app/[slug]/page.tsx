'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Provider {
  id:              string;
  name:            string;
  credentials:     string;
  specialty:       string;
  licensed_states: string[];
  slug:            string;
}

export default function ProviderRoomPage() {
  const params   = useParams();
  const router   = useRouter();
  const slug     = params.slug as string;

  const [provider,    setProvider]    = useState<Provider | null>(null);
  const [patientName, setPatientName] = useState('');
  const [loading,     setLoading]     = useState(true);
  const [checking,    setChecking]    = useState(false);
  const [waiting,     setWaiting]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [notFound,    setNotFound]    = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/today`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setNotFound(true); return; }
        setProvider(data.provider);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  // const handleCheckIn = async () => {
  //   if (!patientName.trim()) {
  //     setError('Please enter your name');
  //     return;
  //   }

  //   setChecking(true);
  //   setError(null);

  //   try {
  //     const res  = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/today?patientName=${encodeURIComponent(patientName)}`
  //     );
  //     const data = await res.json();

  //     if (data.roomId) {
  //       router.push(`/room/${data.roomId}`);
  //       return;
  //     }

  //     // No appointment found — show waiting state
  //     setWaiting(true);
  //     setChecking(false);

  //   } catch {
  //     setError('Something went wrong. Please try again.');
  //     setChecking(false);
  //   }
  // };

    const handleCheckIn = async () => {
    if (!patientName.trim()) {
      setError('Please enter your name');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/today?patientName=${encodeURIComponent(patientName)}`
      );
      const data = await res.json();

      if (data.roomId) {
        // Appointment found → redirect to patient gate
        router.push(`/room/${data.roomId}`);
        return;
      }

      // No appointment found
      setError("We couldn't find an appointment for that name today. Please check with your provider.");
      setChecking(false);

    } catch {
      setError('Something went wrong. Please try again.');
      setChecking(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest font-mono">// loading...</p>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">// not found</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Room not found</div>
        <p className="text-sm text-[#7A9A7A] font-mono mt-2">
          This provider link doesn't exist or has moved.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold tracking-wider">iD</span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A] font-mono">
            InstaDR<span className="text-[#7A9A7A]">-Lite</span>
          </span>
        </div>

        {/* Provider profile */}
        <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-2">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            // provider
          </div>
          <div className="text-xl font-semibold text-[#1A2E1A]">
            {provider?.name}
            {provider?.credentials && (
              <span className="text-[#007A40] ml-2 text-sm">{provider.credentials}</span>
            )}
          </div>
          {provider?.specialty && (
            <div className="text-sm text-[#7A9A7A] font-mono">{provider.specialty}</div>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
            <span className="text-[11px] text-[#007A40] font-mono tracking-widest">
               accepting telehealth visits
            </span>
          </div>
          {(provider?.licensed_states?.length ?? 0) > 0 && (
            <div className="text-[10px] text-[#7A9A7A] font-mono mt-1">
              Licensed in: {provider?.licensed_states.join(', ')}
            </div>
          )}
        </div>

        {/* Waiting room card */}
        <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-4">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            // virtual waiting room
          </div>

          {waiting ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-[#1A2E1A]">
                You're checked in, {patientName}
              </div>
              <p className="text-[11px] text-[#7A9A7A] font-mono">
                {provider?.name} will be with you shortly. Please keep this window open.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#007A40] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
                // waiting for provider...
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-[#3D5C3D] font-mono">
                Enter your name to check in for your session.
              </div>

              <input
                type="text"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
                placeholder="Your full name"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
              />

              {error && (
                <div className="text-[11px] text-[#CC2200] font-mono">// {error}</div>
              )}

              <button
                onClick={handleCheckIn}
                disabled={checking}
                className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
                  checking
                    ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                    : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                }`}
              >
                {checking ? '// checking in...' : '[ enter waiting room ]'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-[#7A9A7A] font-mono tracking-widest">
          powered by instaroom.link
        </div>
      </div>
    </div>
  );
}