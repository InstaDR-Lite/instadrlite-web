'use client';

import { useState } from 'react';
import { Video, FileText, Calendar, Bell, ChevronRight } from 'lucide-react';

const PROVIDERS = [
  { id: '1', name: 'Dr. Mann' },
  { id: '2', name: 'Dr. Oderberg' },
  { id: '3', name: 'Dr. Cohen' },
  { id: '4', name: 'Dr. Thomas' },
];

const TIMELINE_EVENTS = [
  {
    time:       '08:14',
    type:       'SCHEDULED',
    provider:   '1',
    patient:    'M. Chen',
    action:     'Video consult — Anxiety follow-up',
    status:     'COMPLETED',
    icon:       Video,
    duration:   '50 min',
    note:       'Progress on CBT exercises — continue weekly cadence',
  },
  {
    time:       '09:30',
    type:       'WALK-IN',
    provider:   '2',
    patient:    'R. Okafor',
    action:     'Urgent consult — crisis support',
    status:     'COMPLETED',
    icon:       Video,
    duration:   '30 min',
    note:       'Safety plan reviewed — follow-up scheduled for Friday',
  },
  {
    time:       '10:45',
    type:       'ASYNC',
    provider:   '3',
    patient:    'L. Torres',
    action:     'Intake form submitted — new client',
    status:     'SIGNED',
    icon:       FileText,
    duration:   '5 min',
    note:       'IFS intake complete — first session booked for Thursday',
  },
  {
    time:       '11:30',
    type:       'SCHEDULED',
    provider:   '1',
    patient:    'A. Singh',
    action:     'Couples therapy — session 4',
    status:     'IN PROGRESS',
    icon:       Video,
    duration:   '—',
    note:       'Active now',
    active:     true,
  },
  {
    time:       '13:00',
    type:       'SCHEDULED',
    provider:   '4',
    patient:    'D. Marsh',
    action:     'Trauma therapy — EMDR session',
    status:     'UPCOMING',
    icon:       Calendar,
    duration:   '—',
    note:       'Review EMDR progress from last session',
  },
  {
    time:       '14:30',
    type:       'SCHEDULED',
    provider:   '2',
    patient:    'S. Park',
    action:     'Initial consultation — depression',
    status:     'UPCOMING',
    icon:       Video,
    duration:   '—',
    note:       'New patient — Psychology Today referral',
  },
  {
    time:       '16:00',
    type:       'REMINDER',
    provider:   null,
    patient:    'SYSTEM',
    action:     'End-of-day billing batch',
    status:     'PENDING',
    icon:       Bell,
    duration:   '—',
    note:       '6 sessions queued for processing',
  },
];

const STATUS_COLOR: Record<string, string> = {
  'COMPLETED':   'var(--color-teal)',
  'SIGNED':      'var(--color-teal)',
  'IN PROGRESS': 'var(--color-amber)',
  'UPCOMING':    'var(--color-text-muted)',
  'PENDING':     'var(--color-text-muted)',
};

const PROVIDER_COLORS: Record<string, string> = {
  '1': '#007A40',
  '2': '#8B6914',
  '3': '#0056A0',
  '4': '#7A0040',
};

// ─── Provider filter ────────────────────────────────────────────────────────
function ProviderFilter({
  providers,
  selected,
  onSelect,
}: {
  providers: typeof PROVIDERS;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (providers.length <= 10) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSelect(null)}
          className="px-3 py-1 text-[11px] font-mono tracking-widest whitespace-nowrap border transition-all"
          style={{
            borderColor:     selected === null ? 'var(--color-teal)' : 'var(--color-border)',
            background:      selected === null ? 'var(--color-teal-dim)' : 'transparent',
            color:           selected === null ? 'var(--color-teal)' : 'var(--color-text-muted)',
          }}
        >
          All Providers
        </button>
        {providers.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="px-3 py-1 text-[11px] font-mono tracking-widest whitespace-nowrap border transition-all"
            style={{
              borderColor: selected === p.id ? PROVIDER_COLORS[p.id] : 'var(--color-border)',
              background:  selected === p.id ? `${PROVIDER_COLORS[p.id]}18` : 'transparent',
              color:       selected === p.id ? PROVIDER_COLORS[p.id] : 'var(--color-text-muted)',
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      onChange={e => onSelect(e.target.value || null)}
      className="px-3 py-2 border text-[11px] font-mono focus:outline-none transition-all"
      style={{
        background:   'var(--color-surface)',
        borderColor:  'var(--color-border)',
        color:        'var(--color-text-primary)',
      }}
    >
      <option value="">All Providers</option>
      {providers.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ClinicDailyView() {
  const [activeRow,       setActiveRow]       = useState<number | null>(3);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const filtered = selectedProvider
    ? TIMELINE_EVENTS.filter(e => e.provider === selectedProvider)
    : TIMELINE_EVENTS;

  return (
    <div className="flex flex-col gap-4 p-4 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase mb-1"
               style={{ color: 'var(--color-text-muted)' }}>
            // clinic daily view
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {today}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono"
             style={{ color: 'var(--color-teal)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--color-teal)' }} />
          {TIMELINE_EVENTS.filter(e => e.active).length} in session
        </div>
      </div>

      {/* Provider filter */}
      <ProviderFilter
        providers={PROVIDERS}
        selected={selectedProvider}
        onSelect={setSelectedProvider}
      />

      {/* Timeline table */}
      <div className="border overflow-hidden flex-1"
           style={{ borderColor: 'var(--color-border)' }}>

        {/* Table header */}
        <div className="grid px-5 py-3 border-b"
             style={{
               gridTemplateColumns: '60px 90px 1fr 110px 80px 24px',
               borderColor: 'var(--color-border)',
               background:  'var(--color-surface-2)',
             }}>
          {['TIME', 'TYPE', 'PATIENT / ACTION', 'STATUS', 'DURATION', ''].map(h => (
            <span key={h} className="text-[10px] font-mono tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((ev, i) => {
          const Icon    = ev.icon;
          const isActive = activeRow === i;
          const providerColor = ev.provider ? PROVIDER_COLORS[ev.provider] : 'transparent';

          return (
            <div key={i}>
              <div
                className="grid px-5 py-4 cursor-pointer items-center border-b transition-all"
                style={{
                  gridTemplateColumns: '60px 90px 1fr 110px 80px 24px',
                  borderColor: 'var(--color-border)',
                  background:  ev.active
                    ? 'rgba(139, 105, 20, 0.04)'
                    : isActive
                    ? 'var(--color-teal-dim)'
                    : 'transparent',
                  borderLeft: `3px solid ${
                    ev.active ? 'var(--color-amber)' :
                    isActive  ? providerColor :
                    selectedProvider ? providerColor : 'transparent'
                  }`,
                }}
                onClick={() => setActiveRow(isActive ? null : i)}
              >
                {/* Time */}
                <span className="text-[12px] font-mono"
                      style={{ color: 'var(--color-text-muted)' }}>
                  {ev.time}
                </span>

                {/* Type badge */}
                <span className="px-1.5 py-0.5 inline-block w-fit text-[9px] font-mono tracking-widest border"
                      style={{
                        borderColor: 'var(--color-border)',
                        color:       'var(--color-text-muted)',
                      }}>
                  {ev.type}
                </span>

                {/* Patient / Action */}
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={12} style={{
                    color:    ev.active ? 'var(--color-amber)' : 'var(--color-text-muted)',
                    flexShrink: 0,
                  }} />
                  <div className="truncate">
                    {ev.patient !== 'SYSTEM' && (
                      <span className="text-[13px]"
                            style={{ color: 'var(--color-text-primary)' }}>
                        {ev.patient} —{' '}
                      </span>
                    )}
                    <span className="text-[13px]"
                          style={{ color: 'var(--color-text-secondary)' }}>
                      {ev.action}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <span className="text-[10px] font-mono tracking-widest"
                      style={{ color: STATUS_COLOR[ev.status] ?? 'var(--color-text-muted)' }}>
                  {ev.status}
                </span>

                {/* Duration */}
                <span className="text-[12px] font-mono"
                      style={{ color: 'var(--color-text-muted)' }}>
                  {ev.duration}
                </span>

                {/* Chevron */}
                <ChevronRight
                  size={13}
                  style={{
                    color:     'var(--color-text-muted)',
                    transform:  isActive ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </div>

              {/* Expanded note */}
              {isActive && (
                <div className="px-5 py-3 border-b"
                     style={{
                       borderColor: 'var(--color-border)',
                       background:  'var(--color-teal-dim)',
                     }}>
                  <span className="text-[11px] font-mono"
                        style={{ color: 'var(--color-teal)' }}>
                    NOTE →{' '}
                  </span>
                  <span className="text-[12px] font-mono"
                        style={{ color: 'var(--color-text-secondary)' }}>
                    {ev.note}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}