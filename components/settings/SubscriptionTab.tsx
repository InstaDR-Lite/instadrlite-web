'use client';

import { useState, useEffect } from 'react';

export default function SubscriptionTab() {
  const [provider,   setProvider]   = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [promoCode,  setPromoCode]  = useState('');
  const [applying,   setApplying]   = useState(false);
  const [promoMsg,   setPromoMsg]   = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(d => { setProvider(d.provider); setLoading(false); });
  }, []);

  const handleApplyPromo = async () => {
    setApplying(true);
    setPromoMsg(null);
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/validate-promo`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (data.valid) {
        setPromoMsg({ text: '✓ Promo code applied. Enjoy your access!', ok: true });
        setProvider((p: any) => ({ ...p, subscription_status: 'trial', promo_code: promoCode }));
      } else {
        setPromoMsg({ text: '// invalid promo code', ok: false });
      }
    } catch {
      setPromoMsg({ text: '// error applying code', ok: false });
    } finally {
      setApplying(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/checkout`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ plan })
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  const handlePortal = async () => {
    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stripe/portal`, {
      method:      'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) return (
    <div className="p-6">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">// loading...</p>
    </div>
  );

  const status     = provider?.subscription_status;
  const promoApplied = provider?.promo_code;
  const hasStripeCustomer = provider?.stripe_customer_id;

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[580px]">
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// subscription</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Your Subscription</div>
      </div>

      {/* Current plan status */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-3">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
          // current plan
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#1A2E1A]">
              {promoApplied ? `Cohort 01 Pilot Access` : 'InstaRoom'}
            </div>
            <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">
              {promoApplied
                ? `Code: ${promoApplied}`
                : status === 'trial'
                ? '30-day free trial'
                : status === 'active'
                ? '$79 / month'
                : 'No active subscription'}
            </div>
          </div>
          <div className={`text-[10px] tracking-widest uppercase font-mono px-2 py-1 border ${
            status === 'active' || status === 'trial' || promoApplied
              ? 'border-[#007A40] text-[#007A40] bg-[rgba(0,122,64,0.08)]'
              : 'border-[#CC2200] text-[#CC2200]'
          }`}>
            {promoApplied ? 'PILOT' : status === 'active' ? 'ACTIVE' : status === 'trial' ? 'TRIAL' : 'INACTIVE'}
          </div>
        </div>

        {/* Manage billing if subscribed */}
        {hasStripeCustomer && (
          <button
            onClick={handlePortal}
            className="w-full py-2 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all"
          >
            // manage billing → stripe portal
          </button>
        )}
      </div>

      {/* Subscribe if not active */}
      {!promoApplied && status !== 'active' && (
        <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-3">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            // upgrade plan
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSubscribe('monthly')}
              className="p-3 border border-[rgba(0,80,40,0.18)] hover:border-[#007A40] transition-all text-left"
            >
              <div className="text-sm font-semibold text-[#1A2E1A]">$79 / mo</div>
              <div className="text-[10px] text-[#7A9A7A] font-mono">monthly</div>
            </button>
            <button
              onClick={() => handleSubscribe('annual')}
              className="p-3 border border-[#007A40] bg-[rgba(0,122,64,0.05)] transition-all text-left"
            >
              <div className="text-sm font-semibold text-[#007A40]">$699 / yr</div>
              <div className="text-[10px] text-[#7A9A7A] font-mono">save $249</div>
            </button>
          </div>
        </div>
      )}

      {/* Promo code */}
      {!promoApplied && (
        <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-3">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            // promo code
          </div>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="PROMO_CODE"
              className="flex-1 px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
            />
            <button
              onClick={handleApplyPromo}
              disabled={applying || !promoCode}
              className={`px-4 text-[10px] tracking-widest uppercase transition-all ${
                promoCode && !applying
                  ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                  : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
              }`}
            >
              {applying ? '...' : 'apply'}
            </button>
          </div>
          {promoMsg && (
            <div className={`text-[11px] font-mono ${promoMsg.ok ? 'text-[#007A40]' : 'text-[#CC2200]'}`}>
              {promoMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}