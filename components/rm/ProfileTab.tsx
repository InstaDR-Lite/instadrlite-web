'use client';

import Image from "next/image";

interface Provider {
  id:              string;
  name:            string;
  credentials:     string;
  specialty:       string;
  licensed_states: string[];
  education: string[],
  years_in_practice?:  number;
  slug:            string;
  profile?:        ProviderProfile | null;
}

interface ProviderProfile {
  avatar_url?:         string;
    bio?:                string;
    phone?:              string;
    hours_of_operation?: string;
    certifications:      string[];
    approaches:          string[];
    focus_areas:         string[];
    accepts_insurance:   boolean;
    accepts_selfpay:     boolean;
    accepts_sliding:     boolean;
    session_cost:        number;
    slot_duration:       number;
    session_fees?:       any;
    insurance_networks?: string[];
    payment_methods?:    string[];
    superbill_available: boolean;
    accepting_clients:   boolean;
    telehealth:          boolean;
    education?:          string[];
  } 

interface Props {
  provider: Provider;
}

function Initials({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        className="w-16 h-16 rounded-full object-cover border-2 border-[rgba(0,80,40,0.18)] flex-shrink-0"
      />
    );
  }

  return (
    <div className="w-16 h-16 rounded-full bg-[rgba(0,122,64,0.12)] border-2 border-[rgba(0,80,40,0.18)]
                    flex items-center justify-center flex-shrink-0">
      <span className="font-mono text-lg font-semibold text-[#007A40]">{initials}</span>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 border border-[rgba(0,80,40,0.18)] text-[10px] font-mono
                     text-[#7A9A7A] tracking-widest whitespace-nowrap">
      {label}
    </span>
  );
}

export default function ProfileTab({ provider }: Props) {
  const profile = provider.profile;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Card 1 — Identity ── */}
      <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-3 w-full">

        {/* Avatar + name row */}
        <div className="flex items-start gap-4">
          <Initials name={provider.name} avatarUrl={profile?.avatar_url} />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="text-[12px] text-[#7A9A7A] tracking-widest uppercase font-mono">// provider</div>
            <div className="text-xl font-semibold text-[#1A2E1A] leading-tight">
              {provider.name}
              {provider.credentials && (
                <span className="text-[#007A40] ml-2 text-sm font-normal">{provider.credentials}</span>
              )}
            </div>
            {provider?.years_in_practice && (
              <div className="text-[13px] text-[#7A9A7A] font-mono">
                {provider!.years_in_practice} years in practice
              </div>
            )}
          </div>
        </div>

        {/* Top focus areas */}
        {(profile?.focus_areas?.length ?? 0) > 0 && (
          <div className="text-[12px] text-[#7A9A7A] font-mono">
            {profile!.focus_areas.slice(0, 3).join(', ')}
          </div>
        )}

        {/* Status badges */}
        <div className="flex flex-col gap-1.5">
          {profile?.telehealth && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse flex-shrink-0" />
              <span className="text-[13px] text-[#007A40] font-mono tracking-widest">
                accepting telehealth visits
              </span>
            </div>
          )}
          {profile?.accepting_clients && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] flex-shrink-0" />
              <span className="text-[13px] text-[#007A40] font-mono tracking-widest">
                accepting new clients
              </span>
            </div>
          )}
          {profile?.superbill_available && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D5C3D] flex-shrink-0" />
              <span className="text-[13px] text-[#3D5C3D] font-mono tracking-widest">
                superbill available
              </span>
            </div>
          )}
        </div>

        {/* Licensed states */}
        {(provider.licensed_states?.length ?? 0) > 0 && (
          <div className="text-[13px] text-[#7A9A7A] font-mono">
            Licensed in: {provider.licensed_states.join(', ')}
          </div>
        )}
      </div>

      {/* ── Card 2 — Details ── */}
      <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-4 w-full">

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-[#3D5C3D] font-mono leading-relaxed">{profile.bio}</p>
        )}

        {/* Approaches */}
        {(profile?.approaches?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
              // approaches
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile!.approaches.map(a => <Tag key={a} label={a} />)}
            </div>
          </div>
        )}

        {/* Focus areas — full list */}
        {(profile?.focus_areas?.length ?? 0) > 3 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
              // specializations
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile!.focus_areas.map(f => <Tag key={f} label={f} />)}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="flex flex-col gap-1.5">
          {profile?.hours_of_operation && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#7A9A7A]">
              <span>// hours:</span>
              <span className="text-[#1A2E1A]">{profile.hours_of_operation}</span>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#7A9A7A]">
              <span>// phone:</span>
              <a href={`tel:${profile.phone}`} className="text-[#007A40]">{profile.phone}</a>
            </div>
          )}
        </div>

        {/* Fees */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">// fees</div>
          <div className="flex flex-wrap gap-3 text-[13px] font-mono">
            {profile?.session_fees?.individual && (
              <span className="text-[#1A2E1A]">Individual: <strong>${profile.session_fees.individual}</strong></span>
            )}
            {profile?.session_fees?.couples && (
              <span className="text-[#1A2E1A]">Couples: <strong>${profile.session_fees.couples}</strong></span>
            )}
            {!profile?.session_fees?.individual && profile?.session_cost && (
              <span className="text-[#1A2E1A]">Session: <strong>${profile.session_cost}</strong></span>
            )}
            {profile?.slot_duration && (
              <span className="text-[#7A9A7A]">/ {profile.slot_duration} min</span>
            )}
          </div>

          {/* Payment types */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile?.accepts_selfpay && <Tag label="self-pay" />}
            {profile?.accepts_insurance && <Tag label="insurance" />}
            {profile?.accepts_sliding && <Tag label="sliding scale" />}
          </div>

          {/* Payment methods */}
          {(profile?.payment_methods?.length ?? 0) > 0 && (
            <div className="text-[12px] text-[#7A9A7A] font-mono">
              Accepts: {profile!.payment_methods!.join(', ')}
            </div>
          )}
        </div>

        {/* Insurance networks */}
        {profile?.accepts_insurance && (profile?.insurance_networks?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[12px] text-[#7A9A7A] tracking-widest uppercase font-mono">
              // insurance networks
            </div>
            <div className="text-[13px] text-[#3D5C3D] font-mono">
              {profile!.insurance_networks!.join(', ')}
            </div>
          </div>
        )}

        {/* Education */}
        {(provider?.education?.length ?? 0) > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[12px] text-[#7A9A7A] tracking-widest uppercase font-mono">
              // education
            </div>
            {provider!.education!.map((e, i) => (
              <div key={i} className="text-[13px] text-[#3D5C3D] font-mono">{e}</div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {(profile?.certifications?.length ?? 0) > 0 && (
          <div className="text-[12px] text-[#7A9A7A] font-mono">
            // certifications: {profile!.certifications.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}