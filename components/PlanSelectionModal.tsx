'use client';

import { useState } from 'react';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onSelect: (plan: 'monthly' | 'annual') => void;
}

export default function PlanSelectionModal({ isOpen, onClose, onSelect }: Props) {
  const [selected, setSelected] = useState<'monthly' | 'annual'>('monthly');
  const [loading,  setLoading]  = useState(false);

  if (!isOpen) return null;

  const handleContinue = async () => {
    setLoading(true);
    await onSelect(selected);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-[480px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
            // choose your plan
          </span>
          <button onClick={onClose} className="text-[#7A9A7A] hover:text-[#1A2E1A] text-sm">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          <div>
            <div className="text-lg font-semibold text-[#1A2E1A] mb-1">
              Start your 30-day free trial
            </div>
            <p className="text-[11px] text-[#7A9A7A] font-mono">
              // no charge until trial ends · cancel anytime
            </p>
          </div>

          {/* Plans side by side */}
          <div className="grid grid-cols-2 gap-3">

            {/* Monthly */}
            <button
              onClick={() => setSelected('monthly')}
              className={`p-4 border text-left transition-all flex flex-col gap-2 ${
                selected === 'monthly'
                  ? 'border-[#007A40] bg-[rgba(0,122,64,0.06)]'
                  : 'border-[rgba(0,80,40,0.18)] hover:border-[#007A40]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
                  monthly
                </span>
                {selected === 'monthly' && (
                  <span className="text-[#007A40] text-xs">✓</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1A2E1A]">$79</span>
                <span className="text-[11px] text-[#7A9A7A] font-mono">/mo</span>
              </div>
              <p className="text-[11px] text-[#7A9A7A] font-mono">
                billed monthly
              </p>
            </button>

            {/* Annual */}
            <button
              onClick={() => setSelected('annual')}
              className={`p-4 border text-left transition-all flex flex-col gap-2 relative ${
                selected === 'annual'
                  ? 'border-[#007A40] bg-[rgba(0,122,64,0.06)]'
                  : 'border-[rgba(0,80,40,0.18)] hover:border-[#007A40]'
              }`}
            >
              {/* Save badge */}
              <div className="absolute top-2 right-2 bg-[#007A40] text-[#F5F0E8] text-[9px] px-1.5 py-0.5 tracking-widest uppercase font-mono">
                save $349
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
                  annual
                </span>
                {selected === 'annual' && (
                  <span className="text-[#007A40] text-xs">✓</span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1A2E1A]">$599</span>
                <span className="text-[11px] text-[#7A9A7A] font-mono">/yr</span>
              </div>
              <p className="text-[11px] text-[#7A9A7A] font-mono">
                $49.92/mo · best value
              </p>
            </button>

          </div>

          {/* Features */}
          <div className="border border-[rgba(0,80,40,0.18)] p-3 flex flex-col gap-1.5">
            {[
              'Permanent room link (instaroom.link/rm/your-name)',
              'Unlimited HD video sessions',
              'Google Calendar sync',
              'Direct Stripe payouts — 0% fee',
              'Client booking widget',
              'Geo-verification + consent',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-[11px] text-[#3D5C3D] font-mono">
                <span className="text-[#007A40]">✓</span>
                {f}
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={loading}
            className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
              loading
                ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A]'
                : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
            }`}
          >
            {loading ? '// loading...' : `[ start free trial · ${selected} ]`}
          </button>

          <p className="text-center text-[10px] text-[#7A9A7A] font-mono">
            // 30-day free trial · no charge today · cancel anytime
          </p>

        </div>
      </div>
    </div>
  );
}