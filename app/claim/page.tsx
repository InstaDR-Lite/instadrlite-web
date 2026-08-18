'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

// ClaimRoomModal.tsx
function ClaimRoomModal({ onClaim }: { onClaim: (slug: string) => void }) {
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const checkSlug = useDebouncedCallback(async (value: string) => {
    if (value.length < 3) return;
    setStatus('checking');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-slug?slug=${value}`);
    const { available } = await res.json();
    setStatus(available ? 'available' : 'taken');
  }, 400);

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-3">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold">IR</span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">InstaRoom</span>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">
              your permanent room
            </div>
            <div className="text-lg font-semibold text-[#1A2E1A]">
              Claim your room URL
            </div>
            <p className="text-[14px] text-[#7A9A7A] font-mono mt-1">
              This is your permanent room URL. Share it from anywhere — it never changes.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]">
              <span className="px-3 text-[11px] text-[#7A9A7A] font-mono border-r border-[rgba(0,80,40,0.18)] py-3 whitespace-nowrap">
                instaroom.link/rm/
              </span>
              <input
                type="text"
                value={slug}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-_.]/g, '');
                  setSlug(val);
                  if (val.length >= 3) checkSlug(val);
                  else setStatus('idle');
                }}
                placeholder="dr-lewis"
                className="flex-1 px-3 py-3 bg-transparent text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none"
              />
              {status === 'checking' && (
                <span className="px-3 text-[10px] text-[#7A9A7A] font-mono">...</span>
              )}
              {status === 'available' && (
                <span className="px-3 text-[#007A40] text-sm">✓</span>
              )}
              {status === 'taken' && (
                <span className="px-3 text-[#CC2200] text-sm">✕</span>
              )}
            </div>
            {status === 'taken' && (
              <p className="text-[11px] text-[#CC2200] font-mono">
                // that URL is taken — try {slug}-therapy or {slug}-practice
              </p>
            )}
            {status === 'available' && (
              <p className="text-[11px] text-[#007A40] font-mono">
                // instaroom.link/rm/{slug} is yours
              </p>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.setItem('instaroom:claimed_slug', slug);
              onClaim(slug);
            }}
            disabled={status !== 'available'}
            className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
              status === 'available'
                ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
            }`}
          >
            [ Claim This Room → ]
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  const router = useRouter();
  
  return (
    <ClaimRoomModal 
      onClaim={() => {
        router.push('/signup');
      }} 
    />
  );
}