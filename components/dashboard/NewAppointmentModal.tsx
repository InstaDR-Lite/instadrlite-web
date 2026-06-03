'use client';

import { useState } from 'react';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  onCreated: (appointment: any) => void;
}

export default function NewAppointmentModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    patientName:   '',
    patientEmail:  '',
    date:          '',
    startTime:     '',
    duration:      '50',
    paymentAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!form.patientName || !form.date || !form.startTime) {
      setError('Patient name, date and time are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startsAt = new Date(`${form.date}T${form.startTime}`);
      const endsAt   = new Date(startsAt.getTime() + parseInt(form.duration) * 60000);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName:   form.patientName,
          patientEmail:  form.patientEmail,
          startsAt:      startsAt.toISOString(),
          endsAt:        endsAt.toISOString(),
          paymentAmount: form.paymentAmount || null
        })
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setInviteLink(data.appointment.inviteLink);
      onCreated(data.appointment);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1A2E1A] opacity-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-[#edf1f7] border border-[rgba(0,80,40,0.30)]">

        {/* Header */}
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7A9A7A] tracking-widest">//</span>
            <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">
              New Appointment
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A9A7A] hover:text-[#1A2E1A] text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Invite link success state */}
        {inviteLink ? (
          <div className="p-6">
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">
              // appointment created
            </div>
            <div className="text-sm text-[#1A2E1A] font-semibold tracking-wide mb-4">
              Invite link ready for {form.patientName}
            </div>
            <div className="flex items-center gap-2 p-3 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] mb-4">
              <span className="flex-1 text-[11px] text-[#3D5C3D] font-mono truncate">
                {inviteLink}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 py-2.5 border border-[#007A40] text-[10px] tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#edf1f7] transition-all"
              >
                copy invite link
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#1A2E1A] transition-all"
              >
                done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">

            {/* Patient Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                patient name *
              </label>
              <input
                type="text"
                value={form.patientName}
                onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                placeholder="Full name"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm text-[#1A2E1A] font-mono placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
              />
            </div>

            {/* Patient Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                patient email
              </label>
              <input
                type="email"
                value={form.patientEmail}
                onChange={e => setForm(f => ({ ...f, patientEmail: e.target.value }))}
                placeholder="email@example.com"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm text-[#1A2E1A] font-mono placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                  date *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm text-[#1A2E1A] font-mono focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                  start time *
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm text-[#1A2E1A] font-mono focus:outline-none focus:border-[#007A40] transition-all"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                duration
              </label>
              <select
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm text-[#1A2E1A] font-mono focus:outline-none focus:border-[#007A40] transition-all"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="50">50 minutes (default)</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>

            {/* Copay */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                copay amount (optional)
              </label>
              <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC] focus-within:border-[#007A40] transition-all">
                <span className="px-3 text-sm text-[#7A9A7A] font-mono">$</span>
                <input
                  type="number"
                  value={form.paymentAmount}
                  onChange={e => setForm(f => ({ ...f, paymentAmount: e.target.value }))}
                  placeholder="0.00"
                  className="flex-1 px-2 py-2 bg-transparent text-sm text-[#1A2E1A] font-mono placeholder:text-[#7A9A7A] focus:outline-none"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-[11px] text-[#CC2200] tracking-wide font-mono">
                // error: {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all ${
                  loading
                    ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                    : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#edf1f7]'
                }`}
              >
                {loading ? '// creating...' : '[ create appointment ]'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#1A2E1A] transition-all"
              >
                cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}