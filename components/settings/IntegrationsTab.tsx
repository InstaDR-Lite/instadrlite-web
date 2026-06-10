'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function IntegrationsTab() {
  const [provider,   setProvider]   = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchProvider = async () => {
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include'
    });
    const data = await res.json();
    setProvider(data.provider);
    setLoading(false);
  };

  useEffect(() => {
    fetchProvider();
  }, []);

  // Re-fetch if coming back from Google OAuth
  useEffect(() => {
    if (searchParams.get('connected') === 'google') {
      fetchProvider();
    }
  }, [searchParams]);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`, {
      credentials: 'include'
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  const handleDisconnectGoogle = async () => {
    setError(null);
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/disconnect`, {
      method:      'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error);
      return;
    }
    setProvider((p: any) => ({ ...p, google_id: null, google_refresh_token: null }));
  };

  if (loading) return (
    <div className="p-6">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">// loading...</p>
    </div>
  );

  const isGoogleConnected = !!provider?.google_id || !!provider?.google_refresh_token;

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[580px]">
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// integrations</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Connected Services</div>
      </div>

      {/* Google Calendar */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div>
              <div className="text-sm font-semibold text-[#1A2E1A]">Google Calendar</div>
              <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">
                One-way sync — appointments push to your calendar automatically
              </div>
            </div>
          </div>
          <div className={`text-[10px] tracking-widest uppercase font-mono px-2 py-1 border flex-shrink-0 ${
            isGoogleConnected
              ? 'border-[#007A40] text-[#007A40] bg-[rgba(0,122,64,0.08)]'
              : 'border-[#7A9A7A] text-[#7A9A7A]'
          }`}>
            {isGoogleConnected ? 'CONNECTED' : 'NOT CONNECTED'}
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-[#CC2200] font-mono">// {error}</div>
        )}

        {isGoogleConnected ? (
          <button
            onClick={handleDisconnectGoogle}
            className="w-full py-2 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#CC2200] hover:border-[#CC2200] transition-all"
          >
            disconnect google calendar sync
          </button>
        ) : (
          <button
            onClick={handleConnectGoogle}
            disabled={connecting}
            className={`w-full py-2 border text-[10px] tracking-widest uppercase transition-all ${
              connecting
                ? 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A]'
                : 'border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
            }`}
          >
            {connecting ? '// redirecting to Google...' : '⚡ connect google calendar'}
          </button>
        )}
      </div>

      {/* Future integrations */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 opacity-60">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
          // coming soon
        </div>
        <div className="flex flex-col gap-1.5 text-[11px] text-[#7A9A7A] font-mono">
          <div>// EHR integration — Epic, Athena direct inject</div>
          <div>// Practice management — Jane, SimplePractice</div>
          <div>// Messaging — secure patient messaging</div>
        </div>
      </div>
    </div>
  );
}