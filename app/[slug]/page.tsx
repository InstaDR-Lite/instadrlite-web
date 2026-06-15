'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';


interface ProviderProfile {
  bio?:                string;
  phone?:              string;
  office_address?:     string;
  hours_of_operation?: string;
  certifications:      string[];
  accepts_insurance:   boolean;
  accepts_selfpay:     boolean;
  accepts_sliding: boolean;
  session_duration: number;
  session_cost: number;
  slot_duration: number;
}

interface Provider {
  id:              string;
  name:            string;
  credentials:     string;
  specialty:       string;
  licensed_states: string[];
  slug:            string;
  profile?:        ProviderProfile | null;
}

type PageView = 'profile' | 'booking' | 'confirm' | 'booked';

export default function ProviderRoomPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);


  const [pageView, setPageView] = useState<PageView>('profile');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '' });
  const [booking, setBooking] = useState(false);
  const [bookedAppt, setBookedAppt] = useState<any>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  
  
  const fetchSlots = async (offset = 0) => {
    setSlotsLoading(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/slots?weekOffset=${offset}`
    );
    const data = await res.json();
    if (data.success) setSlots(data.slots);
    setSlotsLoading(false);
  };

  const handlePrevWeek = () => {
  if (weekOffset === 0) return; // can't go to past
  const newOffset = weekOffset - 1;
  setWeekOffset(newOffset);
  fetchSlots(newOffset);
};

  const handleNextWeek = () => {
    const newOffset = weekOffset + 1;
    setWeekOffset(newOffset);
    fetchSlots(newOffset);
  };
    
  const handleBook = async () => {
    if (!bookingForm.name || !bookingForm.email || !selectedSlot) return;
    setBooking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          patientName: bookingForm.name,
          patientEmail: bookingForm.email,
          datetime: selectedSlot.datetime
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setBookedAppt(data.appointment);
      setPageView('booked');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/today`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setNotFound(true); return; }
        setProvider(data.provider);
        console.log(data.provider);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);


  const handleCheckIn = async () => {
    if (!patientName.trim()) {
      setError('Please enter your name');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/today?patientName=${encodeURIComponent(patientName)}`
      );
      const data = await res.json();

      if (data.roomId) {
        // Appointment found → redirect to patient gate
        router.push(`/room/${data.roomId}`);
        return;
      }

      // No appointment found
      setError("We couldn't find an appointment for that name today. Please check with your provider.");
      setChecking(false);

    } catch {
      setError('Something went wrong. Please try again.');
      setChecking(false);
    }
  };
  
  if (loading) return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest font-mono">// loading...</p>
    </div>
  );
  
  if (notFound) return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-2">// not found</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Room not found</div>
        <p className="text-sm text-[#7A9A7A] font-mono mt-2">
          This provider link doesn&apos;t exist or has moved.
        </p>
      </div>
    </div>
  );
  
  if (pageView === 'booking') return (
    <div className="min-h-screen bg-[#edf1f7] p-4">
      <div className="w-full max-w-[640px] mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPageView('profile')}
            className="text-[10px] text-[#7A9A7A] hover:text-[#007A40] tracking-widest uppercase"
          >
            ← back
          </button>
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
            // select a time
          </span>
        </div>

        {/* Provider mini header */}
        <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] px-4 py-3 flex items-center gap-3">
          <div>
            <span className="text-sm font-semibold text-[#1A2E1A]">{provider?.name}</span>
            {provider?.credentials && (
              <span className="text-[#007A40] ml-2 text-xs">{provider.credentials}</span>
            )}
          </div>
          {provider?.profile?.session_cost && (
            <span className="ml-auto text-[11px] text-[#7A9A7A] font-mono">
              ${provider.profile.session_cost} / {provider.profile.slot_duration || 50} min
            </span>
          )}
        </div>

        {slotsLoading ? (
          <p className="text-[11px] text-[#7A9A7A] tracking-widest font-mono">// loading slots...</p>
        ) : (

        <>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handlePrevWeek}
              disabled={weekOffset === 0}
              className={`text-[10px] tracking-widest uppercase font-mono px-3 py-1.5 border transition-all ${
                weekOffset === 0
                  ? 'border-[rgba(0,80,40,0.08)] text-[rgba(0,80,40,0.2)] cursor-not-allowed'
                  : 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40]'
              }`}
            >
              ← prev
            </button>

            <span className="text-[10px] text-[#7A9A7A] font-mono tracking-widest">
              {slots.length > 0 ? `${slots[0].date.split(',')[1].trim()} — ${slots[6].date.split(',')[1].trim()}` : ''}
            </span>

            <button
              onClick={handleNextWeek}
              className="text-[10px] tracking-widest uppercase font-mono px-3 py-1.5 border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all"
            >
              next →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 bg-[rgba(0,80,40,0.08)] p-1">
            {slots.map((day, i) => (
              <div key={i} className="flex flex-col gap-1">
                {/* Day header */}
                <div className="bg-[#EDE8DC] px-1 py-2 text-center border border-[rgba(0,80,40,0.18)]">
                  <div className="text-[9px] text-[#7A9A7A] tracking-widest uppercase font-mono">
                    {day.weekday}
                  </div>
                  <div className="text-sm font-semibold text-[#1A2E1A]">{day.dayNum}</div>
                </div>

                {/* Slots */}
                {day.slots.map((slot: any, j: number) => (
                  <button
                    key={j}
                    disabled={!slot.available}
                    onClick={() => {
                      setSelectedSlot({ ...slot, date: day.date });
                      setPageView('confirm');
                    }}
                    className={`py-1.5 text-[11px] font-mono tracking-wide border transition-all ${
                      !slot.available
                        ? 'border-[rgba(0,80,40,0.08)] text-[#000] bg-[#EDE8DC] cursor-not-allowed'
                        : selectedSlot?.datetime === slot.datetime
                        ? 'border-[#007A40] bg-[#007A40] text-[#F5F0E8]'
                        : 'border-[rgba(0,80,40,0.18)] text-[#3D5C3D] hover:border-[#007A40] hover:text-[#007A40] bg-[#F5F0E8]'
                    }`}
                  >
                    {slot.available ? slot.time : '--'}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
        )}
      </div>
    </div>
  );

  if (pageView === 'confirm') return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">// confirm booking</span>
          <button onClick={() => setPageView('booking')} className="text-[#7A9A7A] text-xs">← back</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Selected slot */}
          <div className="p-3 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">selected time</div>
            <div className="text-sm font-semibold text-[#1A2E1A]">
              {selectedSlot?.date} at {selectedSlot?.time}
            </div>
            <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">
              with {provider?.name}{provider?.credentials ? `, ${provider.credentials}` : ''}
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">your name *</label>
            <input
              type="text"
              value={bookingForm.name}
              onChange={e => setBookingForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">your email *</label>
            <input
              type="email"
              value={bookingForm.email}
              onChange={e => setBookingForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com"
              className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
            />
          </div>

          {provider?.profile?.session_cost && (
            <div className="text-[11px] text-[#7A9A7A] font-mono p-3 border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]">
              // session fee: <span className="text-[#1A2E1A]">${provider.profile.session_cost}</span>
              {' '}— collected at session start
            </div>
          )}

          {error && (
            <div className="text-[11px] text-[#CC2200] font-mono">// error: {error}</div>
          )}

          <button
            onClick={handleBook}
            disabled={booking || !bookingForm.name || !bookingForm.email}
            className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
              !booking && bookingForm.name && bookingForm.email
                ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
            }`}
          >
            {booking ? '// booking...' : '[ confirm booking ]'}
          </button>
        </div>
      </div>
    </div>
  );

  if (pageView === 'booked') return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)]">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">// booking confirmed</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="text-lg font-semibold text-[#1A2E1A]">You&apos;re booked! 🎉</div>
          <p className="text-sm text-[#3D5C3D] font-mono">
            A confirmation email has been sent to {bookingForm.email} with your session link and next steps.
          </p>
          <div className="p-3 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">your session</div>
            <div className="text-sm font-semibold text-[#1A2E1A]">
              {selectedSlot?.date} at {selectedSlot?.time}
            </div>
            <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">
              with {provider?.name}
            </div>
          </div>
          <p className="text-[11px] text-[#7A9A7A] font-mono">
            // check your email for the session link
            <br />// link activates 10 minutes before your appointment
          </p>
          <button
            onClick={() => {
              setPageView('profile');
              setSelectedSlot(null);
              setBookingForm({ name: '', email: '' });
              setBookedAppt(null);
            }}
            className="w-full py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#1A2E1A] transition-all"
            >
            done
          </button>
        </div>
      </div>
    </div>
  );

  return (
      
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold tracking-wider">IR</span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A] font-mono">
            InstaRoom
          </span>
        </div>

        {/* Provider profile */}
        <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-2">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            // provider
          </div>
          <div className="text-xl font-semibold text-[#1A2E1A]">
            {provider?.name}
            {provider?.credentials && (
              <span className="text-[#007A40] ml-2 text-sm">{provider.credentials}</span>
            )}
          </div>
          {provider?.specialty && (
            <div className="text-sm text-[#7A9A7A] font-mono">{provider.specialty}</div>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
            <span className="text-[11px] text-[#007A40] font-mono tracking-widest">
               accepting telehealth visits
            </span>
          </div>
          {(provider?.licensed_states?.length ?? 0) > 0 && (
            <div className="text-[10px] text-[#7A9A7A] font-mono mt-1">
              Licensed in: {provider?.licensed_states.join(', ')}
            </div>
          )}
        </div>

        {provider?.profile && (
          <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-3">
            
            {provider.profile?.bio && (
              <p className="text-sm text-[#3D5C3D] font-mono leading-relaxed">
                {provider.profile.bio}
              </p>
            )}

          {provider.profile.hours_of_operation && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#7A9A7A]">
              <span>// hours:</span>
              <span className="text-[#1A2E1A]">{provider.profile.hours_of_operation}</span>
            </div>
          )}

          {provider.profile.phone && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#7A9A7A]">
              <span>// phone:</span>
              <a href={`tel:${provider.profile.phone}`} className="text-[#007A40]">
                {provider.profile.phone}
              </a>
            </div>
          )}

          {/* Payment types */}
          <div className="flex flex-wrap gap-2 mt-1">
            {provider.profile.accepts_selfpay && (
              <span className="px-2 py-0.5 border border-[rgba(0,80,40,0.18)] text-[10px] font-mono text-[#7A9A7A] tracking-widest">
                self-pay
              </span>
            )}
            {provider.profile.accepts_insurance && (
              <span className="px-2 py-0.5 border border-[rgba(0,80,40,0.18)] text-[10px] font-mono text-[#7A9A7A] tracking-widest">
                insurance
              </span>
            )}
            {provider.profile.accepts_sliding && (
              <span className="px-2 py-0.5 border border-[rgba(0,80,40,0.18)] text-[10px] font-mono text-[#7A9A7A] tracking-widest">
                sliding scale
              </span>
            )}
            </div>
            
            {(provider.profile.session_cost || provider.profile.slot_duration) && (
            <div className="flex items-center gap-4 text-[11px] font-mono text-[#7A9A7A]">
              {provider.profile.session_cost && (
                <span>// session: <span className="text-[#1A2E1A]">${provider.profile.session_cost}</span></span>
              )}
              {provider.profile.slot_duration && (
                <span>// duration: <span className="text-[#1A2E1A]">{provider.profile.slot_duration} min</span></span>
              )}
            </div>
          )}
            

          {provider.profile.certifications?.length > 0 && (
            <div className="text-[10px] text-[#7A9A7A] font-mono">
              // certifications: {provider.profile.certifications.join(', ')}
            </div>
          )}
        </div>
      )}

        <button
          onClick={() => { fetchSlots(); setPageView('booking'); }}
          className="w-full py-3 border border-[#007A40] text-xs tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8] transition-all mb-3"
          >
          [ book a session ]
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
          <span className="text-[10px] text-[#7A9A7A] tracking-widest">or</span>
          <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
        </div>

        {/* Waiting room card */}
        <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-4">
          <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">
            // virtual waiting room
          </div>

          {waiting ? (
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-[#1A2E1A]">
                You&apos;re checked in, {patientName}
              </div>
              <p className="text-[11px] text-[#7A9A7A] font-mono">
                {provider?.name} will be with you shortly. Please keep this window open.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#007A40] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
                // waiting for provider...
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-[#3D5C3D] font-mono">
                Enter your name to check in for your session.
              </div>

              <input
                type="text"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
                placeholder="Your full name"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
              />

              {error && (
                <div className="text-[11px] text-[#CC2200] font-mono">// {error}</div>
              )}

              <button
                onClick={handleCheckIn}
                disabled={checking}
                className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
                  checking
                    ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
                    : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                }`}
              >
                {checking ? '// checking in...' : '[ enter waiting room ]'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-[#7A9A7A] font-mono tracking-widest">
          powered by instaroom.link
        </div>
      </div>
    </div>
  );
}