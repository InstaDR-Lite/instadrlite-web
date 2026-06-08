'use client';

import { useState, useEffect } from 'react';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const CREDENTIALS = ['MD','DO','NP','PA','LCSW','MFT','LPC','PhD','PsyD','RN','Other'];

export default function ProfileTab() {
  const [provider, setProvider] = useState<any>(null);
  const [form,     setForm]     = useState<any>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(d => {
      setProvider(d.provider);
      setForm({
        name:            d.provider.name        || '',
        credentials:     d.provider.credentials || '',
        npi:             d.provider.npi          || '',
        specialty:       d.provider.specialty    || '',
        slug:            d.provider.slug         || '',
        licensed_states: d.provider.licensed_states || [],
      });
      setLoading(false);
    });
  }, []);

  const toggleState = (state: string) => {
    setForm((f: any) => ({
      ...f,
      licensed_states: f.licensed_states.includes(state)
        ? f.licensed_states.filter((s: string) => s !== state)
        : [...f.licensed_states, state]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-6">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">// loading...</p>
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[580px]">
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// profile</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Your Profile</div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">full name</label>
        <input
          value={form.name}
          onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
          className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] focus:outline-none focus:border-[#007A40] transition-all"
        />
      </div>

      {/* Credentials */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">credentials</label>
        <div className="flex flex-wrap gap-2">
          {CREDENTIALS.map(c => (
            <button
              key={c}
              onClick={() => setForm((f: any) => ({ ...f, credentials: c }))}
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
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
          npi number
        </label>
        <input
          value={form.npi}
          maxLength={10}
          onChange={e => setForm((f: any) => ({ ...f, npi: e.target.value.replace(/\D/g, '') }))}
          placeholder="10-digit NPI"
          className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
        />
      </div>

      {/* Specialty */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">specialty</label>
        <input
          value={form.specialty}
          onChange={e => setForm((f: any) => ({ ...f, specialty: e.target.value }))}
          placeholder="e.g. Mental Health, Family Medicine"
          className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
        />
      </div>


      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">room link</label>
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
      </div>

      {/* Licensed States */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
          licensed states ({form.licensed_states?.length || 0} selected)
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
          {US_STATES.map(s => (
            <button
              key={s}
              onClick={() => toggleState(s)}
              className={`px-2 py-0.5 text-[10px] tracking-widest border transition-all ${
                form.licensed_states?.includes(s)
                  ? 'border-[#007A40] bg-[rgba(0,122,64,0.10)] text-[#007A40]'
                  : 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-[#CC2200] font-mono">// error: {error}</div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
          saving
            ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A]'
            : saved
            ? 'border border-[#007A40] bg-[rgba(0,122,64,0.08)] text-[#007A40]'
            : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
        }`}
      >
        {saving ? '// saving...' : saved ? '✓ saved' : '[ save changes ]'}
      </button>
    </div>
  );
}