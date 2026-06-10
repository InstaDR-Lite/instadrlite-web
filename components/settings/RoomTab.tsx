'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function RoomTab() {
  const [provider,  setProvider]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // const roomUrl = `https://instaroom.link/${provider?.slug || ''}`;
  const roomUrl = `https://instadr.link/${provider?.slug || ''}`;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(d => {
      setProvider(d.provider);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (provider?.slug && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, roomUrl, {
        width:  160,
        margin: 2,
        color: {
          dark:  '#1A2E1A',
          light: '#F5F0E8'
        }
      });
    }
  }, [provider, roomUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="p-6">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">loading...</p>
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[580px]">
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// your room</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Your Permanent Room Link</div>
        <p className="text-[11px] text-[#7A9A7A] font-mono mt-1">
          Share this link with patients. It never changes.
        </p>
      </div>

      {/* Room link */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-3">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
          permanent entry point
        </div>
        {provider?.slug ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC] flex-1">
                <span className="px-3 text-[11px] text-[#7A9A7A] font-mono border-r border-[rgba(0,80,40,0.18)] py-2 whitespace-nowrap">
                  instaroom.link/
                </span>
                <span className="px-3 text-sm font-mono text-[#007A40] py-2">
                  {provider.slug}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 border text-[10px] tracking-widest uppercase transition-all whitespace-nowrap ${
                  copied
                    ? 'border-[#007A40] bg-[rgba(0,122,64,0.08)] text-[#007A40]'
                    : 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40]'
                }`}
              >
                {copied ? '✓ copied' : 'copy'}
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-start gap-2">
              <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
                 qr code — patients scan to join
              </div>
              <canvas ref={canvasRef} className="border border-[rgba(0,80,40,0.18)]" />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-[#CC2200] font-mono">
              no room link set — update your profile to claim your slug
            </p>
            
             <a href="#"
              // onClick={() => switch to profile tab}
              className="text-[11px] text-[#007A40] underline font-mono"
            >
              → set your room link in Profile
            </a>
          </div>
        )}
      </div>

      {/* Custom domain — coming soon */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-2 opacity-60">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
          custom domain — coming soon
        </div>
        <p className="text-[11px] text-[#7A9A7A] font-mono">
          Bring your own domain — lewis-therapy.com → your room.
        </p>
        <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]">
          <input
            disabled
            placeholder="lewis-therapy.com"
            className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-[#7A9A7A] placeholder:text-[#7A9A7A]"
          />
          <button
            disabled
            className="px-3 py-2 border-l border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A]"
          >
            connect
          </button>
        </div>
      </div>

      {/* Room hours — coming soon */}
      <div className="border border-[rgba(0,80,40,0.18)] p-4 opacity-60">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
          room hours — coming soon
        </div>
        <p className="text-[11px] text-[#7A9A7A] font-mono">
          Set your availability. Patients see when you&apos;re open.
        </p>
      </div>
    </div>
  );
}