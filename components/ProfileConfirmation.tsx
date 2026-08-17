'use client';

import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';

interface ScrapedProfile {
  name: string;
  credentials: string;
  specialty: string;
  provider_type: string;
  bio: string;
  approaches: string[];
  focus_areas: string[];
  session_fee: number | null;
  session_fees: { individual: number | null; couples: number | null; family: number | null; group: number | null };
  location: string;
  phone: string | null;
  insurance_accepted: boolean;
  sliding_scale: boolean;
  telehealth: boolean;
  accepting_clients: boolean;
  payment_methods: string[];
  superbill_available: boolean;
  insurance_networks: string[];
  licensed_states: string[];
  license_numbers: string[];
  education: string[];
  years_in_practice: number | null;
}

interface Props {
  scraped: ScrapedProfile;
  slug: string;
  onConfirm: (profile: ScrapedProfile & { npi?: string }) => void;
}

// ─── Editable field ──────────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-[rgba(0,80,40,0.08)]">
      <span className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A] w-[140px] flex-shrink-0">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={placeholder}
            className="flex-1 bg-[#EDE8DC] border border-[#007A40] px-2 py-1
                       font-mono text-[13px] text-[#1A2E1A] focus:outline-none"
          />
          <button onClick={handleSave} className="text-[#007A40]">
            <Check size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 group">
          <span className="font-mono text-[13px] text-[#1A2E1A] flex-1">
            {value || <span className="text-[#7A9A7A]">{placeholder ?? '—'}</span>}
          </span>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7A9A7A] hover:text-[#007A40]"
          >
            <Pencil size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ProfileConfirmation({ scraped, slug, onConfirm }: Props) {
  const [form, setForm] = useState({
    name:            scraped.name ?? '',
    credentials:     scraped.credentials ?? '',
    specialty:       scraped.specialty ?? '',
    licensed_states: (scraped.licensed_states ?? []).join(', '),
    license_numbers: (scraped.license_numbers ?? []).join(', '),
    session_fee:     String(scraped.session_fees?.individual ?? scraped.session_fee ?? ''),
    telehealth:      scraped.telehealth ?? true,
    npi:             '',
  });

  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm({
      ...scraped,
      ...form,
      licensed_states: form.licensed_states.split(',').map(s => s.trim()).filter(Boolean),
      license_numbers: form.license_numbers.split(',').map(s => s.trim()).filter(Boolean),
      session_fee: form.session_fee ? Number(form.session_fee) : null,
    } as any);
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1 font-mono">
          // we found your profile
        </div>
        <div className="text-md font-semibol text-[#1A2E1A]">
          Does this look right?
        </div>
        <p className="text-[12px] text-[#7A9A7A] font-mono mt-1">
          Hover on any field to edit.
        </p>
      </div>

      {/* Profile fields */}
      <div className="border border-[rgba(0,80,40,0.18)] px-4">
        <EditableField label="Name"        value={form.name}        onSave={v => setForm(f => ({ ...f, name: v }))} />
        <EditableField label="Credentials" value={form.credentials} onSave={v => setForm(f => ({ ...f, credentials: v }))} />
        <EditableField label="Specialty"   value={form.specialty}   onSave={v => setForm(f => ({ ...f, specialty: v }))} />

        {/* Licensed */}
        <div className="flex items-center gap-4 py-2.5 border-b border-[rgba(0,80,40,0.08)]">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A] w-[140px] flex-shrink-0">
            Licensed
          </span>
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-[13px] text-[#1A2E1A]">
              {form.licensed_states || '—'}
            </span>
            {form.license_numbers && (
              <span className="font-mono text-[11px] text-[#7A9A7A]">
                #{form.license_numbers}
              </span>
            )}
            <span className="text-[9px] font-mono text-[#007A40] bg-[rgba(0,122,64,0.08)] px-2 py-0.5">
              ✓ PT Verified
            </span>
          </div>
        </div>

        {/* Session fee */}
        <EditableField
          label="Session fee"
          value={form.session_fee ? `$${form.session_fee}` : ''}
          onSave={v => setForm(f => ({ ...f, session_fee: v.replace('$', '') }))}
          placeholder="not listed"
        />

        {/* Telehealth toggle */}
        <div className="flex items-center gap-4 py-2.5 border-b border-[rgba(0,80,40,0.08)]">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A] w-[140px] flex-shrink-0">
            Telehealth
          </span>
          <button
            onClick={() => setForm(f => ({ ...f, telehealth: !f.telehealth }))}
            className={`font-mono text-[13px] flex items-center gap-2 group ${
              form.telehealth ? 'text-[#007A40]' : 'text-[#7A9A7A]'
            }`}
          >
            {form.telehealth ? '✓ Available' : '✕ In-person only'}
            <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Payment methods */}
        {scraped.payment_methods?.length > 0 && (
          <div className="flex items-start gap-4 py-2.5 border-b border-[rgba(0,80,40,0.08)]">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A] w-[140px] flex-shrink-0 mt-0.5">
              Payments
            </span>
            <span className="font-mono text-[11px] text-[#3D5C3D] flex-1">
              {scraped.payment_methods.slice(0, 4).join(', ')}
              {scraped.payment_methods.length > 4 && ` +${scraped.payment_methods.length - 4} more`}
            </span>
          </div>
        )}

        {/* Superbill */}
        {scraped.superbill_available && (
          <div className="flex items-center gap-4 py-2.5 border-b border-[rgba(0,80,40,0.08)]">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A] w-[140px] flex-shrink-0">
              Superbill
            </span>
            <span className="font-mono text-[13px] text-[#007A40]">✓ Available</span>
          </div>
        )}
      </div>

      {/* NPI — separate optional group */}
      <div className="border border-[rgba(0,80,40,0.12)] px-4">
        <div className="py-2 text-[9px] font-mono tracking-widest uppercase text-[#7A9A7A]">
          // optional — required for superbill
        </div>
        <EditableField
          label="NPI"
          value={form.npi}
          onSave={v => setForm(f => ({ ...f, npi: v }))}
          placeholder="add later in Settings → Profile"
        />
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={saving}
        className="w-full py-3 border border-[#007A40] text-[10px] tracking-widest
                   uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]
                   transition-all font-mono disabled:opacity-50"
      >
        {saving ? '// saving...' : '[ Looks good → Save & Continue ]'}
      </button>
    </div>
  );
}