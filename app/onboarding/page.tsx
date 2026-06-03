'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const CREDENTIALS = ['MD','DO','NP','PA','LCSW','MFT','LPC','PhD','PsyD','RN','Other'];

export default function OnboardingPage() {
  const router  = useRouter();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [form, setForm] = useState({
    credentials:    '',
    npi:            '',
    specialty:      '',
    licensedStates: [] as string[],
    slug:           ''
  });

  const toggleState = (state: string) => {
    setForm(f => ({
      ...f,
      licensedStates: f.licensedStates.includes(state)
        ? f.licensedStates.filter(s => s !== state)
        : [...f.licensedStates, state]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/onboarding`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold">iD</span>
            <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">InstaDR<span className="text-[#7A9A7A]">-Lite</span></span>
          </div>
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            step {step} / 2
          </span>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {step === 1 && (
            <>
              <div>
                <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
                  Clinical identity
                </div>
                <div className="text-lg font-semibold text-[#1A2E1A]">Your credentials</div>
              </div>

              {/* Credentials */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">credentials</label>
                <div className="flex flex-wrap gap-2">
                  {CREDENTIALS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, credentials: c }))}
                      className={`px-3 py-1 text-[11px] tracking-widest border transition-all ${
                        form.credentials === c
                          ? 'border-[#007A40] bg-[rgba(0,122,64,0.10)] text-[#007A40]'
                          : 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* NPI */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">NPI number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={form.npi}
                  onChange={e => setForm(f => ({ ...f, npi: e.target.value.replace(/\D/g, '') }))}
                  placeholder="10-digit NPI"
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              {/* Specialty */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">specialty</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  placeholder="e.g. Mental Health, Family Medicine"
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.credentials}
                className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
                  form.credentials
                    ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                    : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                }`}
              >
                next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
                  licensed states + room link</div>
                <div className="text-lg font-semibold text-[#1A2E1A]">Where you practice</div>
              </div>

              {/* Licensed states */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                  licensed states ({form.licensedStates.length} selected)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto p-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
                  {US_STATES.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleState(s)}
                      className={`px-2 py-0.5 text-[10px] tracking-widest border transition-all ${
                        form.licensedStates.includes(s)
                          ? 'border-[#007A40] bg-[rgba(0,122,64,0.10)] text-[#007A40]'
                          : 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room slug */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                  your room link
                </label>
                <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC] focus-within:border-[#007A40] transition-all">
                  <span className="px-3 text-[11px] text-[#7A9A7A] font-mono border-r border-[rgba(0,80,40,0.18)]">
                    instadr.link/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, '') }))}
                    placeholder="dr.lewis"
                    className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="text-[11px] text-[#CC2200] font-mono">
                  error: {error}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#1A2E1A] transition-all"
                >
                  ← back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || form.licensedStates.length === 0}
                  className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all ${
                    !loading && form.licensedStates.length > 0
                      ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                      : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                  }`}
                >
                  {loading ? '// saving...' : '[ complete setup ]'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}