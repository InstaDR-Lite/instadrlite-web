'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentsTab() {
  const searchParams  = useSearchParams();
  const [provider,    setProvider]    = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [connecting,  setConnecting]  = useState(false);


  const connectError = searchParams.get('error') === 'connect_failed';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(d => { setProvider(d.provider); setLoading(false); });
  }, []);

  const handleConnectStripe = async () => {
    setConnecting(true);
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/connect`, {
      credentials: 'include'
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  const handleDisconnect = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/connect`, {
      method: 'DELETE', credentials: 'include'
    });
    setProvider((p: any) => ({ ...p, stripe_id: null }));
  };

  if (loading) return (
    <div className="p-6">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">loading...</p>
    </div>
  );

  const isConnected = !!provider?.stripe_id;
  const isByos      = provider?.payment_mode === 'byos';
  const isManaged   = provider?.payment_mode === 'managed';

  console.log('Provider data:', isConnected, isByos, isManaged, provider);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[600px]">
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">payment & payouts</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Financial Routing</div>
      </div>

      {/* Section 1 — Static Link */}
      {/* <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-3">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
           section 1 — perimeter management
        </div>
        <div className="text-xs text-[#3D5C3D] font-mono">
          Your permanent patient entry point.
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC] flex-1">
            <span className="px-3 text-[11px] text-[#7A9A7A] font-mono border-r border-[rgba(0,80,40,0.18)]">
              instadr.link/
            </span>
            <span className="px-3 text-sm font-mono text-[#1A2E1A] py-2">
              {provider?.slug || 'not set'}
            </span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`https://instadr.link/${provider?.slug}`)}
            className="px-3 py-2 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all"
          >
            copy
          </button>
        </div>
      </div> */}

      {/* Section 2 — Financial Routing */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-4">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
         Financial routing architecture
        </div>
        <div className="text-xs text-[#3D5C3D] font-mono">
          Choose how your practice processes session fees.
        </div>

        {/* BYOS option */}
        
        {connectError && (
          <div className="text-[11px] text-[#CC2200] font-mono mb-2">
            Error: stripe connection failed. please try again.
          </div>
        )}
        
        <div className={`p-3 border transition-all ${
          isByos ? 'border-[#007A40] bg-[rgba(0,122,64,0.05)]' : 'border-[rgba(0,80,40,0.18)]'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono text-[#7A9A7A]">
              {isByos ? '(•)' : '( )'}
            </span>
            <span className="text-sm font-semibold text-[#1A2E1A]">
              Bring Your Own Stripe (BYOS)
            </span>
            <span className="ml-auto text-[10px] text-[#007A40] font-mono tracking-widest">
              0% fee
            </span>
          </div>
          <p className="text-[11px] text-[#7A9A7A] font-mono mb-3">
            Route copays directly to your own Stripe account.
          </p>

          {isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#007A40]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007A40]" />
                Connected: {provider.stripe_id}
              </div>
              <button
                onClick={handleDisconnect}
                className="text-[10px] tracking-widest uppercase text-[#CC2200] hover:underline"
              >
                disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectStripe}
              disabled={connecting}
              className="w-full py-2 border border-[#007A40] text-[10px] tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8] transition-all"
            >
              {connecting ? '// redirecting...' : '⚡ connect stripe account'}
            </button>
          )}
        </div>

        {/* Managed option */}
        <div className={`p-3 border transition-all ${
          isManaged ? 'border-[#007A40] bg-[rgba(0,122,64,0.05)]' : 'border-[rgba(0,80,40,0.18)]'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono text-[#7A9A7A]">
              {isManaged ? '(•)' : '( )'}
            </span>
            <span className="text-sm font-semibold text-[#1A2E1A]">
              Managed Instant Payouts
            </span>
            <span className="ml-auto text-[10px] text-[#8B6914] font-mono tracking-widest">
              2% fee
            </span>
          </div>
          <p className="text-[11px] text-[#7A9A7A] font-mono">
            Use our native pipeline. We handle everything.
          </p>
        </div>
      </div>
    </div>
  );
}