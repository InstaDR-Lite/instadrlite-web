'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const ALL_CREDENTIALS = ['MD', 'DO', 'NP', 'PA', 'LCSW', 'MFT', 'LPC', 'PhD', 'PsyD', 'RN', 'Other'];

const CREDENTIALS_BY_TYPE: Record<string, string[]> = {
  therapist:  ['LCSW', 'MFT', 'LPC', 'PsyD', 'PhD', 'MD', 'DO', 'RN', 'Other'],
  gp:         ['MD', 'DO', 'NP', 'PA', 'Other'],
  specialist: ['MD', 'DO', 'NP', 'PA', 'RN', 'Other'],
  np:         ['NP', 'RN', 'PA', 'MD', 'DO', 'Other'],
};


export default function OnboardingPage() {
  const router  = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [form, setForm] = useState({
    providerType:   '',
    credentials:    '',
    npi:            '',
    specialty:      '',
    licensedStates: [] as string[],
    slug: '',
    paymentMode:    '' 
  });
  
  const credentials = CREDENTIALS_BY_TYPE[form.providerType] || ALL_CREDENTIALS;

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
        body: 
          JSON.stringify({
            ...form,
            onboardingComplete: true,
          })
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
      <div className="w-full max-w-[480px] border border-[rgba(0,80,40,0.18)] bg-[#e4eaf4]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold">iD</span>
            <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">InstaDR<span className="text-[#7A9A7A]">-Lite</span></span>
          </div>
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            step {step + 1} / 4
          </span>
        </div>


        {/* Content */}
        {step === 0 && (
          <>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <div className="text-lg font-semibold text-[#1A2E1A]">
                  What type of provider are you?
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {[
                  { value: 'therapist',   label: 'Therapist / Mental Health',  sub: 'LCSW, MFT, LPC, PsyD, PhD' },
                  { value: 'gp',          label: 'GP / Family Medicine',       sub: 'MD, DO, NP, PA' },
                  { value: 'specialist',  label: 'Specialist',                 sub: 'Cardiology, Dermatology, etc.' },
                  { value: 'np',          label: 'Nurse Practitioner',         sub: 'NP, RN' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setForm(f => ({ ...f, providerType: t.value }));
                      setStep(1);
                    }}
                    className="w-full p-3 border border-[rgba(0,80,40,0.18)] text-left hover:border-[#007A40] hover:bg-[rgba(0,122,64,0.05)] transition-all"
                  >
                    <div className="text-sm font-semibold text-[#1A2E1A] tracking-wide">
                      {t.label}
                    </div>
                    <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">
                      {t.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
          )}

          {step === 1 && (
            <>
            <div className="p-6 flex flex-col gap-4">
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
                  {credentials.map(c => (
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
                <p className="text-[10px] text-[#7A9A7A] font-mono">
                  Required for superbills and insurance receipts.
                </p>
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
                  placeholder="e.g. Mental Health, Family Medicine, Internal Medicine, Cardiology, etc."
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-4 py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] transition-all">
                  
                  ← back
                </button>
              <button
                onClick={() => setStep(2)}
                disabled={!form.credentials}
                className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
                  form.credentials
                    ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#e4eaf4]'
                    : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                }`}
              >
                next →
                  </button>
              </div>
            </div>
            </>
          )}

          {step === 2 && (
          <>
            <div className="p-6 flex flex-col gap-4">
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

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] transition-all">
                  ← back
                </button>
                <button
                onClick={() => setStep(3)}
                disabled={!form.credentials}
                className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
                  form.credentials
                    ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#e4eaf4]'
                    : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                }`}
              >
                next →
              </button>
              </div>
            </div>
            </>
          )}

          {step === 3 && (
          <>
            <div className="p-6 flex flex-col gap-4"> 
              <div>
                <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// step 3 of 3</div>
                <div className="text-lg font-semibold text-[#1A2E1A]">How do you accept payments?</div>
                <p className="text-[11px] text-[#7A9A7A] font-mono mt-1">You can change this anytime in Settings.</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { value: 'byos',    label: 'Bring Your Own Stripe', sub: 'Direct payouts. 0% platform fee.' },
                  { value: 'managed', label: 'Managed Instant Payouts', sub: 'We handle it. 2% convenience fee.' },
                  { value: 'later',   label: 'Set up later in Settings', sub: 'Skip for now.' },
                ].map(o => (
                  <button
                    key={o.value}
                    onClick={() => setForm(f => ({ ...f, paymentMode: o.value }))}
                    className={`w-full p-3 border text-left transition-all ${
                      form.paymentMode === o.value
                        ? 'border-[#007A40] bg-[rgba(0,122,64,0.08)]'
                        : 'border-[rgba(0,80,40,0.18)] hover:border-[#007A40]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#1A2E1A]">{o.label}</div>
                    <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">{o.sub}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="px-4 py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] transition-all">
                  ← back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!form.paymentMode || loading}
                  className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all ${
                    form.paymentMode && !loading
                      ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                      : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                  }`}
                >
                  {loading ? '// saving...' : '[ complete setup ]'}
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
  );
}