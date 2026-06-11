'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function RoomTab() {
  const [provider,  setProvider]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile,  setProfile]  = useState<any>({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const roomUrl = `https://instaroom.link/${provider?.slug || ''}`;

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        credentials: 'include'
      }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/public`, {
        credentials: 'include'
      }).then(r => r.json())
    ]).then(([meData, profileData]) => {
      setProvider(meData.provider);
      if (profileData.profile) setProfile(profileData.profile);
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

  // Save handler:
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile/public`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(profile)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

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

            {/* Public Profile */}
            <div className="border border-[rgba(0,80,40,0.18)] p-4 flex flex-col gap-4">
              <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
                // public profile — visible at instaroom.link/{provider?.slug}
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">bio</label>
                <textarea
                  value={profile.bio || ''}
                  onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell patients about your practice and approach..."
                  rows={3}
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all resize-none"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">phone</label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                  placeholder="(415) 555-0100"
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              {/* Office address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">office address (optional)</label>
                <input
                  type="text"
                  value={profile.office_address || ''}
                  onChange={e => setProfile((p: any) => ({ ...p, office_address: e.target.value }))}
                  placeholder="123 Main St, San Francisco CA 94105"
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              {/* Hours */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">hours of operation</label>
                <input
                  type="text"
                  value={profile.hours_of_operation || ''}
                  onChange={e => setProfile((p: any) => ({ ...p, hours_of_operation: e.target.value }))}
                  placeholder="Mon-Fri 9am-5pm PT"
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              {/* Payment types */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">accepted payments</label>
                {[
                  { key: 'accepts_selfpay',   label: 'Self-pay / Out of pocket' },
                  { key: 'accepts_insurance', label: 'Insurance' },
                  { key: 'accepts_sliding',   label: 'Sliding scale' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile[opt.key] ?? false}
                      onChange={e => setProfile((p: any) => ({ ...p, [opt.key]: e.target.checked }))}
                      className="accent-[#007A40]"
                    />
                    <span className="text-sm font-mono text-[#3D5C3D]">{opt.label}</span>
                  </label>
                ))}

              {/* Session details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">session cost</label>
                  <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC] focus-within:border-[#007A40]">
                    <span className="px-3 text-[#7A9A7A] font-mono text-sm border-r border-[rgba(0,80,40,0.18)]">$</span>
                    <input
                      type="number"
                      value={profile.session_cost || ''}
                      onChange={e => setProfile((p: any) => ({ ...p, session_cost: e.target.value }))}
                      placeholder="150"
                      className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">session length</label>
                  <select
                    value={profile.session_duration || 50}
                    onChange={e => setProfile((p: any) => ({ ...p, session_duration: parseInt(e.target.value) }))}
                    className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] focus:outline-none focus:border-[#007A40]"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={50}>50 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>
              </div>

              {/* Certifications */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                  additional certifications
                </label>
                <input
                  type="text"
                  value={profile.certifications?.join(', ') || ''}
                  onChange={e => setProfile((p: any) => ({
                    ...p,
                    certifications: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                  }))}
                  placeholder="CBT, EMDR, DBT (comma separated)"
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
                  saving
                    ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A]'
                    : saved
                    ? 'border border-[#007A40] bg-[rgba(0,122,64,0.08)] text-[#007A40]'
                    : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                }`}
              >
                {saving ? '// saving...' : saved ? '✓ saved' : '[ save public profile ]'}
              </button>
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