'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProfileTab from '@/components/rm/ProfileTab';
import Image from 'next/image';

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
  
  interface Provider {
    id:              string;
    name:            string;
    credentials:     string;
    specialty:       string;
    licensed_states: string[];
    slug:            string;
    education:       string[];
    years_in_practice?:  number;
  profile?:        ProviderProfile | null;
}

type ActiveTab  = 'profile' | 'book' | 'room';
type PageView   = 'tabs' | 'confirm' | 'booked';

const initialBookingForm = {
  name: '',
  email: '',
  payment_type: 'self_pay',
  insurance_carrier: '',
};

export default function ProviderRoomPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params.slug as string;

  // Provider state
  const [provider,    setProvider]    = useState<Provider | null>(null);
  const [loading,     setLoading]     = useState(true);

  // Tab + page view
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('profile');
  const [pageView,    setPageView]    = useState<PageView>('tabs');

  // Booking state
  const [slots,       setSlots]       = useState<any[]>([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [slotsLoading,setSlotsLoading]= useState(false);
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [selectedSlot,setSelectedSlot]= useState<any>(null);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [booking,     setBooking]     = useState(false);
  const [bookedAppt,  setBookedAppt]  = useState<any>(null);

  // Room check-in state
  const [patientName, setPatientName] = useState('');
  const [checking,    setChecking]    = useState(false);
  const [waiting,     setWaiting]     = useState(false);

  // Shared error
  const [error,       setError]       = useState<string | null>(null);

  // ── Validate slug + fetch provider ──────────────────────────────────────
  useEffect(() => {
    if (!slug) { router.replace('/rm'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/slug/${slug}`)
      .then(r => {
        if (!r.ok) { router.replace('/rm'); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setProvider(data.provider);
        setLoading(false);
      })
      .catch(() => router.replace('/rm'));
  }, [router, slug]);

  // ── Lazy-load slots when Book tab first selected ─────────────────────────
  useEffect(() => {
    if (activeTab === 'book' && !slotsLoaded) {
      fetchSlots(0);
    }
  }, [activeTab]);

  const fetchSlots = async (offset = 0) => {
    setSlotsLoading(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/slots?weekOffset=${offset}`
    );
    const data = await res.json();
    if (data.success) { setSlots(data.slots); setSlotsLoaded(true); }
    setSlotsLoading(false);
  };

  const handlePrevWeek = () => {
    if (weekOffset === 0) return;
    const o = weekOffset - 1;
    setWeekOffset(o);
    fetchSlots(o);
  };

  const handleNextWeek = () => {
    const o = weekOffset + 1;
    setWeekOffset(o);
    fetchSlots(o);
  };

  // ── Book appointment ─────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!bookingForm.name || !bookingForm.email || !selectedSlot) return;
    setBooking(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/book`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          slug,
          patientName:       bookingForm.name,
          patientEmail:      bookingForm.email,
          datetime:          selectedSlot.datetime,
          payment_type:      bookingForm.payment_type,
          insurance_carrier: bookingForm.insurance_carrier || null,
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

  // ── Room check-in ────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!patientName.trim()) { setError('Please enter your name'); return; }
    setChecking(true);
    setError(null);
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slug/${slug}/today?patientName=${encodeURIComponent(patientName)}`
      );
      const data = await res.json();
      if (data.roomId) { router.push(`/room/${data.roomId}`); return; }
      setError("We couldn't find an appointment for that name today. Please check with your provider.");
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  // ── Handle tab switch ────────────────────────────────────────────────────
  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    setError(null);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || !provider) return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest font-mono">// loading...</p>
    </div>
  );


  // ── Confirm booking — full page overlay ───────────────────────────────────
  if (pageView === 'confirm') return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">// confirm booking</span>
          <button onClick={() => setPageView('tabs')} className="text-[#7A9A7A] text-xs">← back</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="p-3 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">selected time</div>
            <div className="text-sm font-semibold text-[#1A2E1A]">{selectedSlot?.date} at {selectedSlot?.time}</div>
            <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">
              with {provider?.name}{provider?.credentials ? `, ${provider.credentials}` : ''}
            </div>
          </div>
          {['name','email'].map(field => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
                {field === 'name' ? 'your name *' : 'your email *'}
              </label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={bookingForm[field as 'name' | 'email']}
                onChange={e => setBookingForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={field === 'name' ? 'Full name' : 'email@example.com'}
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
              />
            </div>
          ))}
          {provider?.profile?.accepts_insurance && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">payment type</label>
              {(['self_pay','insurance'] as const).map(pt => (
                <label key={pt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payment_type" value={pt}
                    checked={bookingForm.payment_type === pt}
                    onChange={() => setBookingForm(f => ({ ...f, payment_type: pt, insurance_carrier: '' }))}
                    className="accent-[#007A40]"
                  />
                  <span className="font-mono text-[13px] text-[#1A2E1A]">
                    {pt === 'self_pay' ? 'Self-pay' : 'Insurance'}
                  </span>
                </label>
              ))}
            </div>
          )}
          {bookingForm.payment_type === 'insurance' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">insurance carrier</label>
              <select
                value={bookingForm.insurance_carrier}
                onChange={e => setBookingForm(f => ({ ...f, insurance_carrier: e.target.value }))}
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] focus:outline-none focus:border-[#007A40]"
              >
                <option value="">Select carrier...</option>
                {provider?.profile?.insurance_networks?.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          {bookingForm.payment_type === 'insurance' ? (
            <div className="text-[11px] text-[#7A9A7A] font-mono p-3 border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]">
              // copay collected at session start — amount set by provider
            </div>
          ) : provider?.profile?.session_cost ? (
            <div className="text-[11px] text-[#7A9A7A] font-mono p-3 border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]">
              // session fee: <span className="text-[#1A2E1A]">${provider.profile.session_cost}</span> — collected at session start
            </div>
          ) : null}
          {error && <div className="text-[11px] text-[#CC2200] font-mono">// error: {error}</div>}
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

  // ── Booked confirmation — full page ───────────────────────────────────────
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
            <div className="text-sm font-semibold text-[#1A2E1A]">{selectedSlot?.date} at {selectedSlot?.time}</div>
            <div className="text-[11px] text-[#7A9A7A] font-mono mt-0.5">with {provider?.name}</div>
          </div>
          <p className="text-[11px] text-[#7A9A7A] font-mono">
            // check your email for the session link<br />
            // link activates 10 minutes before your appointment
          </p>
          <button
            onClick={() => { setPageView('tabs'); setActiveTab('profile'); setSelectedSlot(null); setBookingForm(initialBookingForm); }}
            className="w-full py-3 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#1A2E1A] transition-all"
          >
            done
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main tabbed view ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#edf1f7] items-center flex flex-col w-full">

      {/* Top nav */}
      <div className="max-w-[608px] mx-auto w-full  flex items-center justify-between px-2 py-3 bg-[#edf1f7] border-b border-[rgba(0,80,40,0.18)]">
        <Image
          src="/instaroom-wordmark-8-currentcolor.svg"
          alt="InstaRoom logo"
          width={122}
          height={30}
        />
        <span className="text-[11px] fontmono ">instaroom.link/rm/{slug}</span>
      </div>

      {/* Fixed tab bar */}
      <div className="sticky max-w-[608px] mx-auto w-full top-0 z-10 bg-[#F5F0E8] border-b border-l border-r border-[rgba(0,80,40,0.18)]">
        <div className="max-w-[608px] mx-auto flex w-full">
          {(['profile','book','room'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              className={`flex-1 py-3 text-[12px] tracking-widest uppercase font-mono transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-[#007A40] text-[#007A40] bg-[rgba(0,122,64,0.06)]'
                  : 'border-transparent text-[#7A9A7A] hover:text-[#007A40]'
              }`}
            >
              {tab === 'profile' ? 'Profile' : tab === 'book' ? 'Book' : 'Virtual Room'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto w-full">

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="max-w-[640px] mx-auto p-4 w-full">
            <ProfileTab
              provider={provider}
            />
          </div>
        )}

        {/* ── Book tab ── */}
        {activeTab === 'book' && (
          <div className="max-w-[640px] mx-auto p-4 flex flex-col gap-4">

            {/* Provider mini header */}
            <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-semibold text-[#1A2E1A]">{provider?.name}</span>
              {provider?.credentials && <span className="text-[#007A40] text-xs">{provider.credentials}</span>}
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
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevWeek}
                    disabled={weekOffset === 0}
                    className={`text-[10px] tracking-widest uppercase font-mono px-3 py-1.5 border transition-all ${
                      weekOffset === 0
                        ? 'border-[rgba(0,80,40,0.08)] text-[rgba(0,80,40,0.2)] cursor-not-allowed'
                        : 'border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40]'
                    }`}
                  >← prev</button>
                  <span className="text-[10px] text-[#7A9A7A] font-mono tracking-widest">
                    {slots.length > 0 ? `${slots[0].date.split(',')[1]?.trim()} — ${slots[6]?.date.split(',')[1]?.trim()}` : ''}
                  </span>
                  <button
                    onClick={handleNextWeek}
                    className="text-[10px] tracking-widest uppercase font-mono px-3 py-1.5 border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all"
                  >next →</button>
                </div>

                <div className="grid grid-cols-7 gap-1 bg-[rgba(0,80,40,0.08)] p-1">
                  {slots.map((day, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="bg-[#EDE8DC] px-1 py-2 text-center border border-[rgba(0,80,40,0.18)]">
                        <div className="text-[9px] text-[#7A9A7A] tracking-widest uppercase font-mono">{day.weekday}</div>
                        <div className="text-sm font-semibold text-[#1A2E1A]">{day.dayNum}</div>
                      </div>
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
        )}

        {/* ── Room tab ── */}
        {activeTab === 'room' && (
          <div className="max-w-[640px] mx-auto p-4">
            <div className="border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8] p-5 flex flex-col gap-4">
              <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase">virtual waiting room</div>

              {waiting ? (
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-semibold text-[#1A2E1A]">You&apos;re checked in, {patientName}</div>
                  <p className="text-[11px] text-[#7A9A7A] font-mono">
                    {provider?.name} will be with you shortly. Please keep this window open.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#007A40] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
                    waiting for provider...
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
                  {error && <div className="text-[11px] text-[#CC2200] font-mono">// {error}</div>}
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
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-[#7A9A7A] font-mono tracking-widest py-4 border-t border-[rgba(0,80,40,0.08)]">
        powered by instaroom.link
      </div>
    </div>
  );
}